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
  removePlayer,
  setVariant,
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

  it('claimChip steals from another player and clears their phaseReady', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 'fixed' })
    // b claims chip 1, then is ready
    s = claimChip(s, 'b', 1)
    s = setReadyForNextPhase(s, 'b', true)
    expect(s.currentChips[1]).toBe('b')
    expect(s.phaseReady).toContain('b')
    // a steals chip 1 from b
    s = claimChip(s, 'a', 1)
    expect(s.currentChips[1]).toBe('a')
    expect(s.phaseReady).not.toContain('b')
    expect(s.phaseReady).not.toContain('a')
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

  it('startHeist seeds phaseDeadlineMs for every connected player', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    const nowMs = 1_700_000_000_000
    s = startHeist(s, { seed: 'fixed', nowMs })
    expect(Object.keys(s.phaseDeadlineMs).sort()).toEqual(['a','b','c'])
    expect(s.phaseDeadlineMs.a).toBe(nowMs + 90_000)
    expect(s.phaseDeadlineMs.b).toBe(nowMs + 90_000)
    expect(s.phaseDeadlineMs.c).toBe(nowMs + 90_000)
  })

  it('removePlayer drops the player and frees their chip', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 'fixed', nowMs: 1 })
    s = claimChip(s, 'b', 2)
    s = removePlayer(s, 'b')
    expect(s.players.map(p => p.id)).toEqual(['a','c'])
    expect(s.currentChips[2]).toBe(null)
    expect(s.phaseReady.includes('b')).toBe(false)
    expect(s.phaseDeadlineMs.b).toBeUndefined()
  })

  it('removePlayer cancels an active kick proposal targeting the removed id', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = { ...s, activeKick: { targetId: 'b', proposerId: 'a', votes: { a: true }, startedMs: 1 } }
    s = removePlayer(s, 'b')
    expect(s.activeKick).toBeNull()
  })

  it('advancePhase resets phaseDeadlineMs for every connected player', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 'fixed', nowMs: 1_700_000_000_000 })
    s = claimChip(s, 'a', 1); s = claimChip(s, 'b', 2); s = claimChip(s, 'c', 3)
    s = setReadyForNextPhase(s, 'a', true); s = setReadyForNextPhase(s, 'b', true); s = setReadyForNextPhase(s, 'c', true)
    const community = [
      {rank:7,suit:'C'},{rank:8,suit:'D'},{rank:9,suit:'H'},{rank:3,suit:'C'},{rank:4,suit:'D'},
    ] as const
    const laterMs = 1_700_000_120_000
    s = advancePhase(s, community as never, laterMs)
    expect(s.phase).toBe('flop')
    expect(s.phaseDeadlineMs.a).toBe(laterMs + 90_000)
    expect(s.phaseDeadlineMs.b).toBe(laterMs + 90_000)
    expect(s.phaseDeadlineMs.c).toBe(laterMs + 90_000)
  })

  it('setVariant updates the variant only in lobby phase', () => {
    let s = initialRoomState('R')
    s = setVariant(s, 'reverseRank')
    expect(s.variant).toBe('reverseRank')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 's', nowMs: 0 })
    s = setVariant(s, 'standard')
    expect(s.variant).toBe('reverseRank') // unchanged after heist started
  })
})
