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
  return true
}

export function canReturnChip(state: RoomState, playerId: string): boolean {
  if (!CLAIM_PHASES.has(state.phase)) return false
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
