import type { Card, Rank, Suit } from './types'

const SUITS: Suit[] = ['S', 'H', 'D', 'C']
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

export function createDeck(): Card[] {
  const deck: Card[] = []
  for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s })
  return deck
}

// Mulberry32 PRNG for deterministic seeded shuffles in tests
function makeSeededRng(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  let s = h >>> 0
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function cryptoRng(): () => number {
  return () => {
    const a = new Uint32Array(1)
    crypto.getRandomValues(a)
    return a[0] / 4294967296
  }
}

export function shuffle(cards: Card[], seed?: string): Card[] {
  const rng = seed ? makeSeededRng(seed) : cryptoRng()
  const out = cards.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
