import { describe, it, expect } from 'vitest'
import { deal } from '../dealer'

describe('deal', () => {
  it('gives every player 2 hole cards', () => {
    const result = deal(['a', 'b', 'c', 'd'], 'seed-1')
    expect(result.holeCards.a).toHaveLength(2)
    expect(result.holeCards.b).toHaveLength(2)
    expect(result.holeCards.c).toHaveLength(2)
    expect(result.holeCards.d).toHaveLength(2)
  })

  it('produces 5 community cards', () => {
    const result = deal(['a', 'b', 'c'], 'seed-2')
    expect(result.community).toHaveLength(5)
  })

  it('uses no card twice', () => {
    const result = deal(['a', 'b', 'c', 'd', 'e', 'f'], 'seed-3')
    const all = [
      ...result.community,
      ...Object.values(result.holeCards).flat(),
    ]
    const set = new Set(all.map(c => `${c.rank}${c.suit}`))
    expect(set.size).toBe(all.length)
  })

  it('is deterministic with same seed', () => {
    const a = deal(['x', 'y', 'z'], 'seed-fixed')
    const b = deal(['x', 'y', 'z'], 'seed-fixed')
    expect(a).toEqual(b)
  })
})
