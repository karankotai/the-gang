import type { Card } from './types'
import { evaluateBest, categoryRank } from './evaluator'

export type HandStrengthTier = 'weak' | 'medium' | 'strong'

export function handStrengthTier(hole: [Card, Card], community: Card[]): HandStrengthTier {
  if (community.length < 3) {
    const [a, b] = hole
    if (a.rank === b.rank) return 'strong'
    const max = Math.max(a.rank, b.rank)
    if (max >= 12) return 'medium'
    return 'weak'
  }
  const best = evaluateBest(hole, community)
  const rank = categoryRank(best.category)
  if (rank >= 5) return 'strong'
  if (rank >= 3) return 'medium'
  if (rank === 2) {
    return best.kickers[0] >= 10 ? 'medium' : 'weak'
  }
  return 'weak'
}
