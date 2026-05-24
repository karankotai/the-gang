import type { ChipValue, RoomState } from './types'

const CLAIM_PHASES = new Set(['preflop','flop','turn','river'])

function holderOf(state: RoomState, playerId: string): ChipValue | null {
  for (const [k, v] of Object.entries(state.currentChips)) {
    if (v === playerId) return Number(k) as ChipValue
  }
  return null
}

export function canClaimChip(state: RoomState, _playerId: string, value: ChipValue): boolean {
  if (!CLAIM_PHASES.has(state.phase)) return false
  const n = state.players.filter(p => p.connected).length
  if (value < 1 || value > n) return false
  if (state.variant === 'lockedEarly') {
    if (state.currentChips[value] != null) return false
    const alreadyHolds = Object.values(state.currentChips).includes(_playerId)
    if (alreadyHolds) return false
  }
  return true
}

export function canReturnChip(state: RoomState, playerId: string): boolean {
  if (!CLAIM_PHASES.has(state.phase)) return false
  if (state.variant === 'lockedEarly') return false
  return holderOf(state, playerId) !== null
}

export function canReadyForNextPhase(state: RoomState, playerId: string): boolean {
  if (!CLAIM_PHASES.has(state.phase)) return false
  return holderOf(state, playerId) !== null
}

export function allPhaseReady(state: RoomState): boolean {
  const connected = state.players.filter(p => p.connected).map(p => p.id)
  return connected.every(id => state.phaseReady.includes(id))
}

export function canProposeKick(state: RoomState, proposerId: string, targetId: string): boolean {
  if (proposerId === targetId) return false
  if (state.activeKick) return false
  const target = state.players.find(p => p.id === targetId)
  const proposer = state.players.find(p => p.id === proposerId)
  if (!target || !proposer) return false
  if (target.connected) return false
  if (!proposer.connected) return false
  return true
}

export function enoughPlayers(state: RoomState): boolean {
  return state.players.filter(p => p.connected).length >= 3
}

export function kickVoteSatisfied(state: RoomState): boolean {
  const k = state.activeKick
  if (!k) return false
  const connectedNonTarget = state.players.filter(p => p.connected && p.id !== k.targetId)
  const yesVotes = connectedNonTarget.filter(p => k.votes[p.id] === true).length
  return yesVotes > connectedNonTarget.length / 2
}
