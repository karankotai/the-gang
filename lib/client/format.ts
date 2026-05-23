import type { Card } from '../types'

export const RANK_LABEL: Record<number, string> = {
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
}
export const SUIT_GLYPH: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
export const SUIT_IS_RED = (s: string) => s === 'H' || s === 'D'

export function formatRank(r: number): string {
  return RANK_LABEL[r] ?? String(r)
}

export function formatCard(c: Card): string {
  return `${formatRank(c.rank)}${SUIT_GLYPH[c.suit]}`
}
