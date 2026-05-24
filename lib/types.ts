// lib/types.ts

export type Suit = 'S' | 'H' | 'D' | 'C'
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14
export type Card = { rank: Rank; suit: Suit }

export type Phase =
  | 'lobby'
  | 'preflop'
  | 'flop'
  | 'turn'
  | 'river'
  | 'showdown'
  | 'roundResult'
  | 'heistResult'
  | 'gameEnd'

export type ChipColor = 'white' | 'yellow' | 'orange' | 'red'
export type ChipValue = 1 | 2 | 3 | 4 | 5 | 6

export type HeistVariant =
  | 'standard'
  | 'lockedEarly'
  | 'reverseRank'
  | 'blindRiver'
  | 'quickHeist'
  | 'heatRising'

export const VARIANT_INFO: Record<HeistVariant, { label: string; description: string }> = {
  standard:    { label: 'Standard',       description: 'Base rules. Recommended for first-timers.' },
  lockedEarly: { label: 'Locked Early',   description: 'One claim per phase: no swap, no steal, no return.' },
  reverseRank: { label: 'Reverse Rank',   description: 'Chip 1 = highest hand, chip N = lowest. Mind-bender.' },
  blindRiver:  { label: 'Blind River',    description: 'The 5th community card stays face-down until showdown.' },
  quickHeist:  { label: 'Quick Heist',    description: 'Skip the turn phase. Shorter, snappier rounds.' },
  heatRising:  { label: 'Heat Rising',    description: 'Phase timer halves each phase: 90s -> 60s -> 40s -> 20s.' },
}

export const PHASE_COLOR: Record<Extract<Phase, 'preflop'|'flop'|'turn'|'river'>, ChipColor> = {
  preflop: 'white',
  flop: 'yellow',
  turn: 'orange',
  river: 'red',
}

export type Player = {
  id: string
  name: string
  avatar: string
  seat: number
  connected: boolean
  ready: boolean
}

export type HeistState = {
  number: 1 | 2 | 3 | 4
  roundsWon: number
  roundsLost: number
  totalHeistsWon: number
}

export type KickProposal = {
  targetId: string
  proposerId: string
  votes: Record<string, boolean>
  startedMs: number
}

export type LockedPhase = {
  phase: Extract<Phase, 'preflop'|'flop'|'turn'|'river'>
  claims: Partial<Record<ChipValue, string>>
}

export type RoundResult = {
  won: boolean
  actualRanking: string[]
  claimedRanking: string[]
  hands: Record<string, { cards: Card[]; description: string }>
}

export type RoomState = {
  roomCode: string
  phase: Phase
  players: Player[]
  community: Card[]
  currentChips: Partial<Record<ChipValue, string | null>>
  lockedChips: LockedPhase[]
  phaseReady: string[]
  phaseDeadlineMs: Record<string, number>
  showdownAgreed: string[]
  heist: HeistState
  variant: HeistVariant
  roundResult: RoundResult | null
  activeKick: KickProposal | null
}

// Wire messages

export type ClientMessage =
  | { t: 'setIdentity'; name: string; avatar: string }
  | { t: 'ready'; ready: boolean }
  | { t: 'startHeist' }
  | { t: 'claimChip'; value: ChipValue }
  | { t: 'returnChip' }
  | { t: 'readyForNextPhase'; ready: boolean }
  | { t: 'agreeShowdown' }
  | { t: 'nextRound' }
  | { t: 'kickProposal'; playerId: string }
  | { t: 'kickVote'; playerId: string; agree: boolean }
  | { t: 'setVariant'; variant: HeistVariant }
  | { t: 'leave' }

export type ServerMessage =
  | { t: 'state'; state: RoomState }
  | { t: 'private'; holeCards: [Card, Card] }
  | { t: 'error'; code: string; msg: string }
  | { t: 'event'; text: string }
