import { describe, it, expect } from 'vitest'
import {
  initialRoomState, addPlayer, setReady, startHeist,
  claimChip, setReadyForNextPhase, advancePhase, resolveShowdown,
} from '../../lib/stateMachine'
import { deal } from '../../lib/dealer'
import { allPhaseReady } from '../../lib/rules'
import type { ChipValue } from '../../lib/types'

describe('full round end-to-end', () => {
  it('runs preflop through showdown and produces a verdict', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 'fixed' })
    expect(s.phase).toBe('preflop')

    const { holeCards, community } = deal(['a','b','c'], 'fixed')

    for (const [id, v] of [['a',1],['b',2],['c',3]] as [string,ChipValue][]) {
      s = claimChip(s, id, v)
      s = setReadyForNextPhase(s, id, true)
    }
    expect(allPhaseReady(s)).toBe(true)
    s = advancePhase(s, community)
    expect(s.phase).toBe('flop')
    expect(s.community).toHaveLength(3)

    for (const [id, v] of [['a',1],['b',2],['c',3]] as [string,ChipValue][]) {
      s = claimChip(s, id, v); s = setReadyForNextPhase(s, id, true)
    }
    s = advancePhase(s, community)
    expect(s.phase).toBe('turn')
    expect(s.community).toHaveLength(4)

    for (const [id, v] of [['a',1],['b',2],['c',3]] as [string,ChipValue][]) {
      s = claimChip(s, id, v); s = setReadyForNextPhase(s, id, true)
    }
    s = advancePhase(s, community)
    expect(s.phase).toBe('river')
    expect(s.community).toHaveLength(5)

    for (const [id, v] of [['a',1],['b',2],['c',3]] as [string,ChipValue][]) {
      s = claimChip(s, id, v); s = setReadyForNextPhase(s, id, true)
    }
    s = advancePhase(s, community)
    expect(s.phase).toBe('showdown')

    const result = resolveShowdown(s, holeCards, community)
    expect(result.actualRanking).toHaveLength(3)
    expect(result.claimedRanking).toEqual(['a','b','c']) // matches the chip values we claimed
    expect(typeof result.won).toBe('boolean')
  })
})
