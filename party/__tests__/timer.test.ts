import { describe, it, expect } from 'vitest'
import {
  initialRoomState, addPlayer, setReady, startHeist,
  setReadyForNextPhase, claimChip,
} from '../../lib/stateMachine'
import { allPhaseReady } from '../../lib/rules'
import type { ChipValue } from '../../lib/types'

// Exercises the pure timer-expiry effect that the server's onPhaseTimerExpired
// reproduces: auto-claim lowest unclaimed chip + mark ready.

describe('timer auto-claim semantics', () => {
  it('a player with no chip when their timer expires gets the lowest unclaimed chip and is marked ready', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 'fixed', nowMs: 0 })

    s = claimChip(s, 'b', 2); s = setReadyForNextPhase(s, 'b', true)
    s = claimChip(s, 'c', 3); s = setReadyForNextPhase(s, 'c', true)

    const alreadyHeld = Object.values(s.currentChips).includes('a')
    expect(alreadyHeld).toBe(false)
    const lowest = Object.entries(s.currentChips)
      .map(([k, v]) => [Number(k), v] as [number, string | null | undefined])
      .sort((a, b) => a[0] - b[0])
      .find(([, h]) => h == null)![0] as ChipValue
    s = claimChip(s, 'a', lowest)
    s = setReadyForNextPhase(s, 'a', true)

    expect(s.currentChips[1]).toBe('a')
    expect(allPhaseReady(s)).toBe(true)
  })

  it('a player who already holds a chip when their timer expires is just marked ready', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 'fixed', nowMs: 0 })
    s = claimChip(s, 'a', 1)
    expect(s.phaseReady).not.toContain('a')

    const alreadyHeld = Object.values(s.currentChips).includes('a')
    expect(alreadyHeld).toBe(true)
    s = setReadyForNextPhase(s, 'a', true)

    expect(s.currentChips[1]).toBe('a')
    expect(s.phaseReady).toContain('a')
  })
})
