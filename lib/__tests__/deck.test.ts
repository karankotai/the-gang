import { describe, it, expect } from 'vitest'
import { createDeck, shuffle } from '../deck'

describe('createDeck', () => {
  it('returns 52 unique cards', () => {
    const deck = createDeck()
    expect(deck).toHaveLength(52)
    const set = new Set(deck.map(c => `${c.rank}${c.suit}`))
    expect(set.size).toBe(52)
  })

  it('contains all 4 suits and 13 ranks', () => {
    const deck = createDeck()
    const suits = new Set(deck.map(c => c.suit))
    const ranks = new Set(deck.map(c => c.rank))
    expect(suits.size).toBe(4)
    expect(ranks.size).toBe(13)
  })
})

describe('shuffle', () => {
  it('preserves all cards', () => {
    const deck = createDeck()
    const shuffled = shuffle(deck, 'seed-1')
    expect(shuffled).toHaveLength(52)
    const set = new Set(shuffled.map(c => `${c.rank}${c.suit}`))
    expect(set.size).toBe(52)
  })

  it('is deterministic with same seed', () => {
    const a = shuffle(createDeck(), 'seed-42')
    const b = shuffle(createDeck(), 'seed-42')
    expect(a).toEqual(b)
  })

  it('differs with different seeds', () => {
    const a = shuffle(createDeck(), 'seed-a')
    const b = shuffle(createDeck(), 'seed-b')
    expect(a).not.toEqual(b)
  })

  it('without seed uses crypto random', () => {
    const a = shuffle(createDeck())
    const b = shuffle(createDeck())
    expect(a).not.toEqual(b)
  })
})
