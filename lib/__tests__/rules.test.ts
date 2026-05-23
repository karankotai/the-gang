import { describe, it, expect } from 'vitest'
import { canClaimChip, canReturnChip, canReadyForNextPhase, allPhaseReady } from '../rules'
import type { RoomState } from '../types'

function baseState(over: Partial<RoomState> = {}): RoomState {
  return {
    roomCode: 'R',
    phase: 'preflop',
    players: [
      { id: 'a', name:'A', avatar:'', seat:0, connected:true, ready:true },
      { id: 'b', name:'B', avatar:'', seat:1, connected:true, ready:true },
      { id: 'c', name:'C', avatar:'', seat:2, connected:true, ready:true },
    ],
    community: [],
    currentChips: { 1: null, 2: null, 3: null },
    lockedChips: [],
    phaseReady: [],
    phaseDeadlineMs: {},
    showdownAgreed: [],
    heist: { number: 1, roundsWon: 0, roundsLost: 0, totalHeistsWon: 0 },
    roundResult: null,
    ...over,
  }
}

describe('canClaimChip', () => {
  it('allowed: unclaimed chip in a claim phase', () => {
    expect(canClaimChip(baseState(), 'a', 1)).toBe(true)
  })
  it('allowed: chip already held by self', () => {
    const s = baseState({ currentChips: { 1: 'a', 2: null, 3: null } })
    expect(canClaimChip(s, 'a', 1)).toBe(true)
  })
  it('allowed: chip held by another player (steal)', () => {
    const s = baseState({ currentChips: { 1: 'b', 2: null, 3: null } })
    expect(canClaimChip(s, 'a', 1)).toBe(true)
  })
  it('denied: out-of-range value for player count', () => {
    expect(canClaimChip(baseState(), 'a', 4)).toBe(false)
  })
  it('denied: not a claim phase', () => {
    expect(canClaimChip(baseState({ phase: 'showdown' }), 'a', 1)).toBe(false)
  })
})

describe('canReturnChip', () => {
  it('allowed: player holds a chip', () => {
    const s = baseState({ currentChips: { 1: 'a', 2: null, 3: null } })
    expect(canReturnChip(s, 'a')).toBe(true)
  })
  it('denied: player holds no chip', () => {
    expect(canReturnChip(baseState(), 'a')).toBe(false)
  })
})

describe('canReadyForNextPhase', () => {
  it('allowed: player holds a chip', () => {
    const s = baseState({ currentChips: { 1: 'a', 2: null, 3: null } })
    expect(canReadyForNextPhase(s, 'a')).toBe(true)
  })
  it('denied: player holds no chip', () => {
    expect(canReadyForNextPhase(baseState(), 'a')).toBe(false)
  })
})

describe('allPhaseReady', () => {
  it('true when all connected players are in phaseReady', () => {
    const s = baseState({ phaseReady: ['a','b','c'] })
    expect(allPhaseReady(s)).toBe(true)
  })
  it('false when one missing', () => {
    const s = baseState({ phaseReady: ['a','b'] })
    expect(allPhaseReady(s)).toBe(false)
  })
})
