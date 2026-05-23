import type { Card } from './types'
import { createDeck, shuffle } from './deck'

export type DealResult = {
  holeCards: Record<string, [Card, Card]>
  community: [Card, Card, Card, Card, Card]
}

export function deal(playerIds: string[], seed?: string): DealResult {
  const deck = shuffle(createDeck(), seed)
  let i = 0
  const holeCards: Record<string, [Card, Card]> = {}
  for (const id of playerIds) {
    holeCards[id] = [deck[i++], deck[i++]]
  }
  const community: [Card, Card, Card, Card, Card] = [
    deck[i++], deck[i++], deck[i++], deck[i++], deck[i++],
  ]
  return { holeCards, community }
}
