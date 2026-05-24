import type * as Party from 'partykit/server'
import type { Card, ChipValue, ClientMessage, RoomState, ServerMessage } from '../lib/types'
import {
  initialRoomState, addPlayer, setIdentity, setReady, setConnected,
  startHeist, claimChip, returnChip, setReadyForNextPhase, advancePhase,
  resolveShowdown, applyRoundResult, nextRoundOrHeist, removePlayer, setVariant, abandonGame,
} from '../lib/stateMachine'
import { canClaimChip, canReturnChip, canReadyForNextPhase, allPhaseReady, canProposeKick, kickVoteSatisfied, enoughPlayers } from '../lib/rules'
import { deal } from '../lib/dealer'

export default class GangServer implements Party.Server {
  room: RoomState
  holeCards: Map<string, [Card, Card]> = new Map()
  community: Card[] = []
  connByPlayer: Map<string, Party.Connection> = new Map()
  phaseTimers: Map<string, ReturnType<typeof setTimeout>> = new Map()
  lastActivityMs: number = Date.now()
  idleReaperTimer: ReturnType<typeof setTimeout> | null = null

  constructor(readonly party: Party.Room) {
    this.room = initialRoomState(party.id)
    this.rearmIdleReaper()
  }

  static onBeforeConnect(req: Party.Request, _lobby: Party.Lobby, _ctx: Party.ExecutionContext) {
    const url = new URL(req.url)
    const playerId = url.searchParams.get('playerId')
    if (!playerId) return new Response('playerId required', { status: 400 })
    return req
  }

  onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    this.touchActivity()
    const url = new URL(ctx.request.url)
    const playerId = url.searchParams.get('playerId')
    if (!playerId) { connection.close(); return }
    connection.setState({ playerId } as any)
    const existing = this.room.players.find(p => p.id === playerId)
    if (existing) {
      this.room = setConnected(this.room, playerId, true)
      this.connByPlayer.set(playerId, connection)
      const deadline = this.room.phaseDeadlineMs[playerId]
      if (deadline != null) {
        const delay = Math.max(0, deadline - Date.now())
        const t = setTimeout(() => this.onPhaseTimerExpired(playerId), delay)
        this.phaseTimers.set(playerId, t)
      }
      const hc = this.holeCards.get(playerId)
      if (hc) this.sendPrivate(playerId, hc)
    } else {
      if (this.room.phase !== 'lobby') {
        this.send(connection, { t: 'error', code: 'ROOM_BUSY', msg: 'Game already in progress' })
        connection.close()
        return
      }
      if (this.room.players.length >= 6) {
        this.send(connection, { t: 'error', code: 'ROOM_FULL', msg: 'Room is full (max 6)' })
        connection.close()
        return
      }
      this.room = addPlayer(this.room, { id: playerId, name: 'Player', avatar: '' })
      this.connByPlayer.set(playerId, connection)
    }
    this.broadcastState()
  }

  onClose(connection: Party.Connection) {
    const playerId = (connection.state as any)?.playerId
    if (!playerId) return
    if (this.connByPlayer.get(playerId) === connection) {
      this.connByPlayer.delete(playerId)
      this.room = setConnected(this.room, playerId, false)
      const t = this.phaseTimers.get(playerId)
      if (t) { clearTimeout(t); this.phaseTimers.delete(playerId) }
      this.broadcastState()
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    this.touchActivity()
    const playerId = (sender.state as any)?.playerId as string
    let msg: ClientMessage
    try { msg = JSON.parse(message) } catch { return }
    this.handle(playerId, msg)
  }

  private handle(playerId: string, msg: ClientMessage) {
    switch (msg.t) {
      case 'setIdentity':
        this.room = setIdentity(this.room, playerId, msg.name.slice(0, 20), msg.avatar.slice(0, 60))
        break
      case 'setVariant': {
        if (this.room.phase !== 'lobby') return this.err(playerId, 'NOT_LOBBY')
        const hostId = this.room.players.find(p => p.connected)?.id
        if (playerId !== hostId) return this.err(playerId, 'NOT_HOST')
        this.room = setVariant(this.room, msg.variant)
        break
      }
      case 'ready':
        this.room = setReady(this.room, playerId, msg.ready)
        break
      case 'startHeist':
        this.beginHeist()
        return
      case 'claimChip':
        if (!canClaimChip(this.room, playerId, msg.value)) return this.err(playerId, 'BAD_CLAIM')
        this.room = claimChip(this.room, playerId, msg.value)
        break
      case 'returnChip':
        if (!canReturnChip(this.room, playerId)) return this.err(playerId, 'BAD_RETURN')
        this.room = returnChip(this.room, playerId)
        break
      case 'readyForNextPhase':
        if (msg.ready && !canReadyForNextPhase(this.room, playerId)) return this.err(playerId, 'BAD_READY')
        this.room = setReadyForNextPhase(this.room, playerId, msg.ready)
        if (allPhaseReady(this.room) && enoughPlayers(this.room)) {
          this.advance()
          return
        }
        // Fall through to broadcast so other clients see the updated phaseReady count.
        break
      case 'agreeShowdown': {
        if (this.room.phase !== 'showdown') return this.err(playerId, 'NOT_SHOWDOWN')
        if (!enoughPlayers(this.room)) return this.err(playerId, 'NOT_ENOUGH_PLAYERS')
        const hostId = this.room.players.find(p => p.connected)?.id
        if (playerId !== hostId) return this.err(playerId, 'NOT_HOST')
        this.runShowdown()
        return
      }
      case 'nextRound':
        if (this.room.phase !== 'roundResult' && this.room.phase !== 'heistResult') return
        if (!enoughPlayers(this.room)) return this.err(playerId, 'NOT_ENOUGH_PLAYERS')
        this.room = nextRoundOrHeist(this.room, Date.now())
        if (this.room.phase === 'preflop') this.dealAndStart()
        break
      case 'kickProposal': {
        if (!canProposeKick(this.room, playerId, msg.playerId)) return this.err(playerId, 'BAD_KICK_PROPOSE')
        this.room = {
          ...this.room,
          activeKick: {
            targetId: msg.playerId,
            proposerId: playerId,
            votes: { [playerId]: true },
            startedMs: Date.now(),
          },
        }
        break
      }
      case 'kickVote': {
        const k = this.room.activeKick
        if (!k) return this.err(playerId, 'NO_KICK')
        if (k.targetId !== msg.playerId) return this.err(playerId, 'KICK_TARGET_MISMATCH')
        if (playerId === k.targetId) return this.err(playerId, 'CANNOT_VOTE_ON_SELF')
        this.room = {
          ...this.room,
          activeKick: { ...k, votes: { ...k.votes, [playerId]: msg.agree } },
        }
        if (kickVoteSatisfied(this.room)) {
          const target = k.targetId
          const conn = this.connByPlayer.get(target)
          if (conn) { try { conn.close() } catch {} this.connByPlayer.delete(target) }
          const t = this.phaseTimers.get(target)
          if (t) { clearTimeout(t); this.phaseTimers.delete(target) }
          this.holeCards.delete(target)
          this.room = removePlayer(this.room, target)
        }
        break
      }
      case 'endGame':
        if (this.room.phase === 'lobby') return
        this.clearPhaseTimers()
        this.holeCards.clear()
        this.community = []
        this.room = abandonGame(this.room)
        break
      case 'leave':
        break
    }
    this.broadcastState()
  }

  private beginHeist() {
    this.room = startHeist(this.room, { nowMs: Date.now() })
    if (this.room.phase !== 'preflop') return this.broadcastState()
    this.dealAndStart()
  }

  private dealAndStart() {
    const ids = this.room.players.map(p => p.id)
    const result = deal(ids)
    this.holeCards = new Map(Object.entries(result.holeCards) as [string, [Card, Card]][])
    this.community = result.community
    for (const [id, hc] of this.holeCards) this.sendPrivate(id, hc)
    this.scheduleTimers()
    this.broadcastState()
  }

  private advance() {
    this.room = advancePhase(this.room, this.community, Date.now())
    this.scheduleTimers()
    this.broadcastState()
  }

  private allShowdownAgreed(): boolean {
    return this.room.players.filter(p => p.connected).every(p => this.room.showdownAgreed.includes(p.id))
  }

  private runShowdown() {
    const hc: Record<string, [Card, Card]> = {}
    for (const [id, c] of this.holeCards) hc[id] = c
    // For blindRiver, the room currently shows only 4 community cards — reveal the full 5 now.
    if (this.room.variant === 'blindRiver' && this.room.community.length < 5) {
      this.room = { ...this.room, community: this.community.slice(0, 5) }
    }
    const result = resolveShowdown(this.room, hc, this.community)
    this.room = applyRoundResult(this.room, result)
    this.broadcastState()
  }

  private touchActivity() {
    this.lastActivityMs = Date.now()
    this.rearmIdleReaper()
  }

  private rearmIdleReaper() {
    if (this.idleReaperTimer) clearTimeout(this.idleReaperTimer)
    const IDLE_MS = 30 * 60 * 1000
    this.idleReaperTimer = setTimeout(() => this.maybeReap(), IDLE_MS)
  }

  private maybeReap() {
    const idleFor = Date.now() - this.lastActivityMs
    if (idleFor < 30 * 60 * 1000) { this.rearmIdleReaper(); return }
    this.clearPhaseTimers()
    this.holeCards.clear()
    this.community = []
    this.room = initialRoomState(this.party.id)
    for (const conn of this.party.getConnections()) {
      try {
        conn.send(JSON.stringify({ t: 'event', text: 'Room reset due to inactivity' } satisfies ServerMessage))
        conn.close()
      } catch {}
    }
    this.connByPlayer.clear()
  }

  private clearPhaseTimers() {
    for (const t of this.phaseTimers.values()) clearTimeout(t)
    this.phaseTimers.clear()
  }

  private scheduleTimers() {
    this.clearPhaseTimers()
    for (const [playerId, deadline] of Object.entries(this.room.phaseDeadlineMs)) {
      const player = this.room.players.find(p => p.id === playerId)
      if (!player || !player.connected) continue
      const delay = Math.max(0, deadline - Date.now())
      const t = setTimeout(() => this.onPhaseTimerExpired(playerId), delay)
      this.phaseTimers.set(playerId, t)
    }
  }

  private onPhaseTimerExpired(playerId: string) {
    const player = this.room.players.find(p => p.id === playerId)
    if (!player || !player.connected) return
    const alreadyHeld = Object.values(this.room.currentChips).includes(playerId)
    if (!alreadyHeld) {
      const entries = Object.entries(this.room.currentChips)
        .map(([k, v]) => [Number(k), v] as [number, string | null | undefined])
        .sort((a, b) => a[0] - b[0])
      const target = entries.find(([, holder]) => holder == null)
      if (target) this.room = claimChip(this.room, playerId, target[0] as ChipValue)
    }
    if (!this.room.phaseReady.includes(playerId)) {
      this.room = setReadyForNextPhase(this.room, playerId, true)
    }
    if (allPhaseReady(this.room) && enoughPlayers(this.room)) {
      this.advance()
      return
    }
    this.broadcastState()
  }

  private broadcastState() {
    const msg: ServerMessage = { t: 'state', state: this.room }
    const encoded = JSON.stringify(msg)
    for (const conn of this.party.getConnections()) {
      try { conn.send(encoded) } catch {}
    }
  }

  private sendPrivate(playerId: string, holeCards: [Card, Card]) {
    const conn = this.connByPlayer.get(playerId)
    if (!conn) return
    const msg: ServerMessage = { t: 'private', holeCards }
    try { conn.send(JSON.stringify(msg)) } catch {}
  }

  private send(conn: Party.Connection, msg: ServerMessage) {
    try { conn.send(JSON.stringify(msg)) } catch {}
  }

  private err(playerId: string, code: string) {
    const conn = this.connByPlayer.get(playerId)
    if (conn) this.send(conn, { t: 'error', code, msg: code })
  }
}
