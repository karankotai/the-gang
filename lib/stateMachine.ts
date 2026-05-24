import type { Card, ChipValue, HeistVariant, LockedPhase, Phase, Player, RoomState, RoundResult } from './types'
import { describeHand, evaluateBest, compareHands } from './evaluator'

const PHASE_TIMEOUT_MS = 90_000

function phaseTimeoutFor(phase: Phase, variant: HeistVariant): number {
  if (variant === 'heatRising') {
    if (phase === 'preflop') return 90_000
    if (phase === 'flop') return 60_000
    if (phase === 'turn') return 40_000
    if (phase === 'river') return 20_000
  }
  return PHASE_TIMEOUT_MS
}

function freshPhaseDeadlines(state: RoomState, nowMs: number, phase: Phase): Record<string, number> {
  const ms = phaseTimeoutFor(phase, state.variant)
  const out: Record<string, number> = {}
  for (const p of state.players) {
    if (p.connected) out[p.id] = nowMs + ms
  }
  return out
}

export function initialRoomState(roomCode: string): RoomState {
  return {
    roomCode,
    phase: 'lobby',
    players: [],
    community: [],
    currentChips: {},
    lockedChips: [],
    phaseReady: [],
    phaseDeadlineMs: {},
    showdownAgreed: [],
    heist: { number: 1, roundsWon: 0, roundsLost: 0, totalHeistsWon: 0 },
    variant: 'standard',
    roundResult: null,
    activeKick: null,
    abilitiesEnabled: false,
    abilityUsed: {},
  }
}

export function addPlayer(state: RoomState, p: { id: string; name: string; avatar: string }): RoomState {
  if (state.players.find(x => x.id === p.id)) return state
  const seat = state.players.length
  const player: Player = { id: p.id, name: p.name, avatar: p.avatar, seat, connected: true, ready: false }
  return { ...state, players: [...state.players, player] }
}

export function setConnected(state: RoomState, playerId: string, connected: boolean): RoomState {
  return { ...state, players: state.players.map(p => p.id === playerId ? { ...p, connected } : p) }
}

export function removePlayer(state: RoomState, playerId: string): RoomState {
  const players = state.players.filter(p => p.id !== playerId).map((p, i) => ({ ...p, seat: i }))
  const currentChips: Partial<Record<ChipValue, string | null>> = { ...state.currentChips }
  for (const k of Object.keys(currentChips)) {
    const kv = Number(k) as ChipValue
    if (currentChips[kv] === playerId) currentChips[kv] = null
  }
  const lockedChips = state.lockedChips.map(l => {
    const claims: Partial<Record<ChipValue, string>> = {}
    for (const [k, id] of Object.entries(l.claims)) {
      if (id !== playerId) claims[Number(k) as ChipValue] = id
    }
    return { ...l, claims }
  })
  const phaseReady = state.phaseReady.filter(id => id !== playerId)
  const showdownAgreed = state.showdownAgreed.filter(id => id !== playerId)
  const phaseDeadlineMs = { ...state.phaseDeadlineMs }
  delete phaseDeadlineMs[playerId]
  const activeKick = state.activeKick && state.activeKick.targetId === playerId ? null : state.activeKick
  return { ...state, players, currentChips, lockedChips, phaseReady, showdownAgreed, phaseDeadlineMs, activeKick }
}

export function setIdentity(state: RoomState, playerId: string, name: string, avatar: string): RoomState {
  return { ...state, players: state.players.map(p => p.id === playerId ? { ...p, name, avatar } : p) }
}

export function setReady(state: RoomState, playerId: string, ready: boolean): RoomState {
  return { ...state, players: state.players.map(p => p.id === playerId ? { ...p, ready } : p) }
}

export function abandonGame(state: RoomState): RoomState {
  return {
    ...state,
    phase: 'lobby',
    players: state.players.map(p => ({ ...p, ready: false })),
    community: [],
    currentChips: {},
    lockedChips: [],
    phaseReady: [],
    phaseDeadlineMs: {},
    showdownAgreed: [],
    heist: { number: 1, roundsWon: 0, roundsLost: 0, totalHeistsWon: 0 },
    roundResult: null,
    activeKick: null,
    // keep variant — host chose it, don't lose it on abandon
  }
}

export function setVariant(state: RoomState, variant: HeistVariant): RoomState {
  if (state.phase !== 'lobby') return state
  return { ...state, variant }
}

export function startHeist(state: RoomState, opts: { seed?: string; nowMs?: number } = {}): RoomState {
  if (state.phase !== 'lobby') return state
  if (state.players.length < 3) return state
  if (!state.players.every(p => p.ready)) return state
  const n = state.players.length
  const nowMs = opts.nowMs ?? Date.now()
  // Treat all listed players as connected at heist start (lobby UI requires all ready, so they were online).
  const playersAsConnected = { ...state, players: state.players.map(p => ({ ...p, connected: true })) }
  return {
    ...state,
    phase: 'preflop',
    community: [],
    currentChips: chipPoolFor(n),
    lockedChips: [],
    phaseReady: [],
    phaseDeadlineMs: freshPhaseDeadlines(playersAsConnected, nowMs, 'preflop'),
    showdownAgreed: [],
    roundResult: null,
  }
}

export function claimChip(state: RoomState, playerId: string, value: ChipValue): RoomState {
  if (!isClaimPhase(state.phase)) return state
  const nextChips: Partial<Record<ChipValue, string | null>> = { ...state.currentChips }
  // Release any chip the caller currently holds
  for (const k of Object.keys(nextChips)) {
    const kv = Number(k) as ChipValue
    if (nextChips[kv] === playerId) nextChips[kv] = null
  }
  // If the target chip was held by another player, they lose it (stealing is allowed)
  const previousHolder = nextChips[value]
  nextChips[value] = playerId
  // Clear caller from phaseReady (they just acted) and previous holder too (they no longer hold a chip)
  const nextPhaseReady = state.phaseReady.filter(id =>
    id !== playerId && id !== previousHolder
  )
  return {
    ...state,
    currentChips: nextChips,
    phaseReady: nextPhaseReady,
  }
}

export function returnChip(state: RoomState, playerId: string): RoomState {
  if (!isClaimPhase(state.phase)) return state
  const nextChips: Partial<Record<ChipValue, string | null>> = { ...state.currentChips }
  for (const k of Object.keys(nextChips)) {
    const kv = Number(k) as ChipValue
    if (nextChips[kv] === playerId) nextChips[kv] = null
  }
  return {
    ...state,
    currentChips: nextChips,
    phaseReady: state.phaseReady.filter(id => id !== playerId),
  }
}

export function setReadyForNextPhase(state: RoomState, playerId: string, ready: boolean): RoomState {
  const next = new Set(state.phaseReady)
  if (ready) next.add(playerId); else next.delete(playerId)
  return { ...state, phaseReady: [...next] }
}

export function advancePhase(state: RoomState, community?: Card[], nowMs?: number): RoomState {
  const next: Record<Phase, Phase | null> = {
    lobby: 'preflop', preflop: 'flop', flop: 'turn', turn: 'river',
    river: 'showdown', showdown: 'roundResult', roundResult: 'preflop',
    heistResult: 'preflop', gameEnd: null,
  }
  let np = next[state.phase]
  if (state.variant === 'quickHeist' && state.phase === 'flop') np = 'river'
  if (!np) return state
  if (isClaimPhase(state.phase)) {
    const locked: LockedPhase = {
      phase: state.phase as any,
      claims: Object.fromEntries(
        Object.entries(state.currentChips).filter(([,v]) => v != null) as [string,string][]
      ) as any,
    }
    const n = state.players.filter(p => p.connected).length
    const newPool: Partial<Record<ChipValue, string | null>> = {}
    if (isClaimPhase(np)) {
      for (let v = 1; v <= n; v++) newPool[v as ChipValue] = null
    }
    // Use caller-supplied community or fall back to what is already on state.
    const fullBoard: Card[] = community ?? state.community

    let newCommunity: Card[]
    if (np === 'flop') newCommunity = fullBoard.slice(0, 3)
    else if (np === 'turn') newCommunity = fullBoard.slice(0, 4)
    else if (np === 'river') {
      const riverCount = state.variant === 'blindRiver' ? 4 : 5
      newCommunity = fullBoard.slice(0, riverCount)
    }
    else newCommunity = state.community

    return {
      ...state,
      phase: np,
      community: newCommunity,
      currentChips: newPool,
      lockedChips: [...state.lockedChips, locked],
      phaseReady: [],
      phaseDeadlineMs: isClaimPhase(np) ? freshPhaseDeadlines(state, nowMs ?? Date.now(), np) : {},
    }
  }
  return { ...state, phase: np }
}

export function isClaimPhase(p: Phase): boolean {
  return p === 'preflop' || p === 'flop' || p === 'turn' || p === 'river'
}

export function resolveShowdown(
  state: RoomState,
  holeCards: Record<string, [Card, Card]>,
  communityOverride?: Card[]
): RoundResult {
  const community = communityOverride ?? state.community
  const hands: Record<string, { cards: Card[]; description: string; rank: ReturnType<typeof evaluateBest> }> = {}
  for (const p of state.players) {
    const best = evaluateBest(holeCards[p.id], community)
    hands[p.id] = { cards: [...holeCards[p.id], ...community], description: describeHand(best), rank: best }
  }
  const rawActualRanking = state.players
    .map(p => p.id)
    .sort((a, b) => compareHands(hands[a].rank, hands[b].rank))
  const actualRanking = state.variant === 'reverseRank'
    ? [...rawActualRanking].reverse()
    : rawActualRanking

  const riverLocked = state.lockedChips.find(l => l.phase === 'river')
  const claimedRanking: string[] = []
  if (riverLocked) {
    const sorted = Object.entries(riverLocked.claims)
      .map(([v, id]) => [Number(v), id] as [number, string])
      .sort((a, b) => a[0] - b[0])
    for (const [, id] of sorted) claimedRanking.push(id)
  }

  const won = ranksMatchWithTies(actualRanking, claimedRanking, hands)

  return {
    won,
    actualRanking,
    claimedRanking,
    hands: Object.fromEntries(Object.entries(hands).map(([id, h]) => [id, { cards: h.cards, description: h.description }])),
  }
}

function ranksMatchWithTies(
  actual: string[],
  claimed: string[],
  hands: Record<string, { rank: ReturnType<typeof evaluateBest> }>
): boolean {
  if (actual.length !== claimed.length) return false
  const groups: string[][] = []
  let curr: string[] = []
  let prev: string | null = null
  for (const id of actual) {
    if (prev == null || compareHands(hands[id].rank, hands[prev].rank) === 0) {
      curr.push(id)
    } else {
      groups.push(curr); curr = [id]
    }
    prev = id
  }
  if (curr.length) groups.push(curr)

  let i = 0
  for (const group of groups) {
    const slice = claimed.slice(i, i + group.length)
    const a = new Set(group)
    const b = new Set(slice)
    if (a.size !== b.size) return false
    for (const x of a) if (!b.has(x)) return false
    i += group.length
  }
  return true
}

export function applyRoundResult(state: RoomState, result: RoundResult): RoomState {
  const won = result.won
  const heist = { ...state.heist }
  if (won) heist.roundsWon += 1
  else heist.roundsLost += 1

  let phase: Phase = 'roundResult'
  if (heist.roundsWon >= 3) {
    phase = 'heistResult'
    heist.totalHeistsWon += 1
  } else if (heist.roundsLost >= 2) {
    phase = 'heistResult'
  }
  return { ...state, phase, roundResult: result, heist }
}

export function nextRoundOrHeist(state: RoomState, nowMs?: number): RoomState {
  const h = state.heist
  const t = nowMs ?? Date.now()
  if (state.phase === 'heistResult') {
    if (h.number >= 4) return { ...state, phase: 'gameEnd' }
    return {
      ...state,
      phase: 'preflop',
      heist: { number: (h.number + 1) as 1|2|3|4, roundsWon: 0, roundsLost: 0, totalHeistsWon: h.totalHeistsWon },
      community: [],
      currentChips: chipPoolFor(state.players.filter(p=>p.connected).length),
      lockedChips: [],
      phaseReady: [],
      phaseDeadlineMs: freshPhaseDeadlines(state, t, 'preflop'),
      showdownAgreed: [],
      roundResult: null,
    }
  }
  return {
    ...state,
    phase: 'preflop',
    community: [],
    currentChips: chipPoolFor(state.players.filter(p=>p.connected).length),
    lockedChips: [],
    phaseReady: [],
    phaseDeadlineMs: freshPhaseDeadlines(state, t, 'preflop'),
    showdownAgreed: [],
    roundResult: null,
  }
}

function chipPoolFor(n: number): Partial<Record<ChipValue, string | null>> {
  const out: Partial<Record<ChipValue, string | null>> = {}
  for (let v = 1; v <= n; v++) out[v as ChipValue] = null
  return out
}
