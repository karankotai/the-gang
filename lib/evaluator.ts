import type { Card, Rank } from './types'

export type Category =
  | 'high-card' | 'pair' | 'two-pair' | 'three-of-a-kind'
  | 'straight' | 'flush' | 'full-house' | 'four-of-a-kind' | 'straight-flush'

const CATEGORY_RANK: Record<Category, number> = {
  'high-card': 1, 'pair': 2, 'two-pair': 3, 'three-of-a-kind': 4,
  'straight': 5, 'flush': 6, 'full-house': 7, 'four-of-a-kind': 8,
  'straight-flush': 9,
}

export type HandRank = {
  category: Category
  // Tiebreakers in descending importance, e.g. for two-pair: [highPair, lowPair, kicker]
  kickers: number[]
}

export function categoryName(h: HandRank): Category { return h.category }
export function categoryRank(c: Category): number { return CATEGORY_RANK[c] }

export function evaluate5(cards: Card[]): HandRank {
  if (cards.length !== 5) throw new Error('evaluate5 requires 5 cards')

  const ranks = cards.map(c => c.rank).sort((a,b)=>b-a) as Rank[]
  const counts = new Map<Rank, number>()
  for (const r of ranks) counts.set(r, (counts.get(r) ?? 0) + 1)

  const isFlush = cards.every(c => c.suit === cards[0].suit)

  // Straight detection (also ace-low A-2-3-4-5)
  const sortedAsc = [...ranks].sort((a,b)=>a-b)
  let isStraight = true
  for (let i = 1; i < sortedAsc.length; i++) {
    if (sortedAsc[i] !== sortedAsc[i-1] + 1) { isStraight = false; break }
  }
  let straightHigh = sortedAsc[4]
  // Ace-low: A,2,3,4,5
  if (!isStraight && sortedAsc.join(',') === '2,3,4,5,14') {
    isStraight = true
    straightHigh = 5 as Rank
  }

  const groups = [...counts.entries()].sort((a,b) => b[1]-a[1] || b[0]-a[0])
  const groupSizes = groups.map(g => g[1])

  if (isStraight && isFlush) return { category: 'straight-flush', kickers: [straightHigh] }
  if (groupSizes[0] === 4) return { category: 'four-of-a-kind', kickers: [groups[0][0], groups[1][0]] }
  if (groupSizes[0] === 3 && groupSizes[1] === 2) return { category: 'full-house', kickers: [groups[0][0], groups[1][0]] }
  if (isFlush) return { category: 'flush', kickers: ranks }
  if (isStraight) return { category: 'straight', kickers: [straightHigh] }
  if (groupSizes[0] === 3) return { category: 'three-of-a-kind', kickers: [groups[0][0], ...ranks.filter(r => r !== groups[0][0])] }
  if (groupSizes[0] === 2 && groupSizes[1] === 2) {
    const [hp, lp] = [groups[0][0], groups[1][0]].sort((a,b)=>b-a)
    const kicker = ranks.find(r => r !== hp && r !== lp)!
    return { category: 'two-pair', kickers: [hp, lp, kicker] }
  }
  if (groupSizes[0] === 2) return { category: 'pair', kickers: [groups[0][0], ...ranks.filter(r => r !== groups[0][0])] }
  return { category: 'high-card', kickers: ranks }
}

export function compareHands(a: HandRank, b: HandRank): number {
  const ca = categoryRank(a.category), cb = categoryRank(b.category)
  if (ca !== cb) return ca - cb
  for (let i = 0; i < Math.max(a.kickers.length, b.kickers.length); i++) {
    const av = a.kickers[i] ?? 0, bv = b.kickers[i] ?? 0
    if (av !== bv) return av - bv
  }
  return 0
}

function combinations<T>(arr: T[], k: number): T[][] {
  const out: T[][] = []
  const rec = (start: number, chosen: T[]) => {
    if (chosen.length === k) { out.push(chosen); return }
    for (let i = start; i < arr.length; i++) rec(i + 1, [...chosen, arr[i]])
  }
  rec(0, [])
  return out
}

export function evaluateBest(hole: [Card, Card], community: Card[]): HandRank {
  const all = [...hole, ...community]
  if (all.length < 5) throw new Error('evaluateBest needs at least 5 cards total')
  let best: HandRank | null = null
  for (const combo of combinations(all, 5)) {
    const r = evaluate5(combo)
    if (!best || compareHands(r, best) > 0) best = r
  }
  return best!
}

const RANK_NAME: Record<number, string> = {
  2:'Two',3:'Three',4:'Four',5:'Five',6:'Six',7:'Seven',8:'Eight',
  9:'Nine',10:'Ten',11:'Jack',12:'Queen',13:'King',14:'Ace',
}

export function describeHand(h: HandRank): string {
  const k = h.kickers
  switch (h.category) {
    case 'high-card': return `High Card (${RANK_NAME[k[0]]})`
    case 'pair': return `Pair (${RANK_NAME[k[0]]})`
    case 'two-pair': return `Two Pair (${RANK_NAME[k[0]]} & ${RANK_NAME[k[1]]})`
    case 'three-of-a-kind': return `Three of a Kind (${RANK_NAME[k[0]]})`
    case 'straight': return `Straight (${RANK_NAME[k[0]]} high)`
    case 'flush': return `Flush (${RANK_NAME[k[0]]} high)`
    case 'full-house': return `Full House (${RANK_NAME[k[0]]}s over ${RANK_NAME[k[1]]}s)`
    case 'four-of-a-kind': return `Four of a Kind (${RANK_NAME[k[0]]}s)`
    case 'straight-flush': return `Straight Flush (${RANK_NAME[k[0]]} high)`
  }
}
