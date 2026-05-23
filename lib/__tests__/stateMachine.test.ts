import { describe, it, expect } from 'vitest'
import {
  initialRoomState,
  addPlayer,
  setReady,
  startHeist,
  claimChip,
  returnChip,
  setReadyForNextPhase,
  advancePhase,
  resolveShowdown,
} from '../stateMachine'
import { deal } from '../dealer'

describe('stateMachine', () => {
  it('initialRoomState is in lobby with empty players', () => {
    const s = initialRoomState('ROOM1')
    expect(s.phase).toBe('lobby')
    expect(s.players).toEqual([])
    expect(s.heist.number).toBe(1)
  })

  it('addPlayer assigns next seat', () => {
    let s = initialRoomState('ROOM1')
    s = addPlayer(s, { id:'a', name:'A', avatar:'' })
    s = addPlayer(s, { id:'b', name:'B', avatar:'' })
    expect(s.players[0].seat).toBe(0)
    expect(s.players[1].seat).toBe(1)
  })

  it('setReady toggles ready flag', () => {
    let s = addPlayer(initialRoomState('R'), { id:'a', name:'A', avatar:'' })
    s = setReady(s, 'a', true)
    expect(s.players[0].ready).toBe(true)
  })

  it('startHeist transitions to preflop when ready & N>=3', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) {
      s = addPlayer(s, { id, name:id, avatar:'' })
      s = setReady(s, id, true)
    }
    s = startHeist(s, { seed: 'seed-1' })
    expect(s.phase).toBe('preflop')
    expect(s.community).toHaveLength(0)
    expect(Object.keys(s.currentChips)).toEqual(['1','2','3'])
  })

  it('claimChip records claim and clears caller readiness', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 's' })
    s = setReadyForNextPhase(s, 'a', true)
    s = claimChip(s, 'a', 2)
    expect(s.currentChips[2]).toBe('a')
    expect(s.phaseReady.includes('a')).toBe(false)
  })

  it('returnChip clears claim', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 's' })
    s = claimChip(s, 'a', 2)
    s = returnChip(s, 'a')
    expect(s.currentChips[2]).toBe(null)
  })

  it('advancePhase: preflop -> flop reveals 3 community + new colored chip pool + locks old chips', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 's' })
    s = claimChip(s, 'a', 1); s = claimChip(s, 'b', 2); s = claimChip(s, 'c', 3)
    s = setReadyForNextPhase(s, 'a', true); s = setReadyForNextPhase(s, 'b', true); s = setReadyForNextPhase(s, 'c', true)
    const { community } = deal(['a', 'b', 'c'], 's')
    s = advancePhase(s, community)
    expect(s.phase).toBe('flop')
    expect(s.community).toHaveLength(3)
    expect(s.lockedChips).toHaveLength(1)
    expect(s.lockedChips[0].phase).toBe('preflop')
    expect(s.currentChips).toEqual({ 1: null, 2: null, 3: null })
    expect(s.phaseReady).toEqual([])
  })

  it('resolveShowdown: correct ranking -> won', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 'fixed-seed-for-test' })
    s = { ...s, phase: 'showdown' }
    const result = resolveShowdown(s, {
      a: [{rank:14, suit:'S'}, {rank:14, suit:'H'}],
      b: [{rank:13, suit:'S'}, {rank:13, suit:'H'}],
      c: [{rank:2,  suit:'S'}, {rank:5, suit:'D'}],
    }, [
      {rank:7,suit:'C'}, {rank:8,suit:'D'}, {rank:9,suit:'H'}, {rank:3,suit:'C'}, {rank:4,suit:'D'}
    ])
    expect(result.actualRanking).toEqual(['c','b','a'])
  })
})
