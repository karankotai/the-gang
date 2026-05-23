import type * as Party from 'partykit/server'
import type { Card, ClientMessage, RoomState, ServerMessage } from '../lib/types'
import {
  initialRoomState, addPlayer, setIdentity, setReady, setConnected,
  startHeist, claimChip, returnChip, setReadyForNextPhase, advancePhase,
  resolveShowdown, applyRoundResult, nextRoundOrHeist,
} from '../lib/stateMachine'
import { canClaimChip, canReturnChip, canReadyForNextPhase, allPhaseReady } from '../lib/rules'
import { deal } from '../lib/dealer'

export default class GangServer implements Party.Server {
  room: RoomState
  holeCards: Map<string, [Card, Card]> = new Map()
  community: Card[] = []
  connByPlayer: Map<string, Party.Connection> = new Map()

  constructor(readonly party: Party.Room) {
    this.room = initialRoomState(party.id)
  }

  static onBeforeConnect(req: Party.Request, _lobby: Party.Lobby, _ctx: Party.ExecutionContext) {
    const url = new URL(req.url)
    const playerId = url.searchParams.get('playerId')
    if (!playerId) return new Response('playerId required', { status: 400 })
    return req
  }

  onConnect(connection: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url)
    const playerId = url.searchParams.get('playerId')
    if (!playerId) { connection.close(); return }
    connection.setState({ playerId } as any)
    const existing = this.room.players.find(p => p.id === playerId)
    if (existing) {
      this.room = setConnected(this.room, playerId, true)
      this.connByPlayer.set(playerId, connection)
      const hc = this.holeCards.get(playerId)
      if (hc) this.sendPrivate(playerId, hc)
    } else {
      if (this.room.phase !== 'lobby') {
        this.send(connection, { t: 'error', code: 'ROOM_BUSY', msg: 'Game already in progress' })
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
      this.broadcastState()
    }
  }

  onMessage(message: string, sender: Party.Connection) {
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
        if (allPhaseReady(this.room)) this.advance()
        return
      case 'agreeShowdown':
        if (this.room.phase !== 'showdown') return this.err(playerId, 'NOT_SHOWDOWN')
        if (!this.room.showdownAgreed.includes(playerId)) {
          this.room = { ...this.room, showdownAgreed: [...this.room.showdownAgreed, playerId] }
        }
        if (this.allShowdownAgreed()) this.runShowdown()
        break
      case 'nextRound':
        if (this.room.phase !== 'roundResult' && this.room.phase !== 'heistResult') return
        this.room = nextRoundOrHeist(this.room)
        if (this.room.phase === 'preflop') this.dealAndStart()
        break
      case 'kickProposal':
      case 'kickVote':
        // Phase 2: kick-vote feature not implemented yet
        return
      case 'leave':
        break
    }
    this.broadcastState()
  }

  private beginHeist() {
    this.room = startHeist(this.room)
    if (this.room.phase !== 'preflop') return this.broadcastState()
    this.dealAndStart()
  }

  private dealAndStart() {
    const ids = this.room.players.map(p => p.id)
    const result = deal(ids)
    this.holeCards = new Map(Object.entries(result.holeCards) as [string, [Card, Card]][])
    this.community = result.community
    for (const [id, hc] of this.holeCards) this.sendPrivate(id, hc)
    this.broadcastState()
  }

  private advance() {
    this.room = advancePhase(this.room, this.community)
    this.broadcastState()
  }

  private allShowdownAgreed(): boolean {
    return this.room.players.filter(p => p.connected).every(p => this.room.showdownAgreed.includes(p.id))
  }

  private runShowdown() {
    const hc: Record<string, [Card, Card]> = {}
    for (const [id, c] of this.holeCards) hc[id] = c
    const result = resolveShowdown(this.room, hc, this.community)
    this.room = applyRoundResult(this.room, result)
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
