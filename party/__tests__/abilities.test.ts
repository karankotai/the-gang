import { describe, it, expect } from 'vitest'
import {
  initialRoomState, addPlayer, setReady, startHeist,
  claimChip, applyNegotiatorSwap, markAbilityUsed,
  nextRoundOrHeist, setAbilitiesEnabled,
} from '../../lib/stateMachine'

describe('ability semantics (state-level)', () => {
  it('Negotiator swap correctly inverts two players chips during a claim phase', () => {
    let s = initialRoomState('R')
    s = setAbilitiesEnabled(s, true)
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 'fixed', nowMs: 0 })
    s = claimChip(s, 'a', 1)
    s = claimChip(s, 'b', 3)
    s = applyNegotiatorSwap(s, 'a', 'b')
    expect(s.currentChips[1]).toBe('b')
    expect(s.currentChips[3]).toBe('a')
  })

  it('markAbilityUsed flag survives the round but resets at next heist', () => {
    let s = initialRoomState('R')
    s = setAbilitiesEnabled(s, true)
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 's', nowMs: 0 })
    s = markAbilityUsed(s, 'a')
    expect(s.abilityUsed.a).toBe(true)
    s = { ...s, phase: 'heistResult', heist: { ...s.heist, roundsWon: 3, roundsLost: 0 } }
    s = nextRoundOrHeist(s, 100)
    expect(s.phase).toBe('preflop')
    expect(s.abilityUsed).toEqual({})
  })
})
