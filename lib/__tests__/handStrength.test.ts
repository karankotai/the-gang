import { describe, it, expect } from 'vitest'
import { handStrengthTier } from '../handStrength'
import type { Card } from '../types'

const c = (r: number, s: 'S'|'H'|'D'|'C'): Card => ({ rank: r as Card['rank'], suit: s })

describe('handStrengthTier', () => {
  it('preflop pocket pair → strong', () => {
    expect(handStrengthTier([c(14,'S'), c(14,'H')], [])).toBe('strong')
  })
  it('preflop high card A-K → medium', () => {
    expect(handStrengthTier([c(14,'S'), c(13,'H')], [])).toBe('medium')
  })
  it('preflop low junk 2-7 → weak', () => {
    expect(handStrengthTier([c(2,'S'), c(7,'H')], [])).toBe('weak')
  })
  it('flop with a flush draw + pair on board → strong (it makes a flush)', () => {
    const hole: [Card, Card] = [c(2,'S'), c(5,'S')]
    const comm = [c(9,'S'), c(11,'S'), c(13,'S')]
    expect(handStrengthTier(hole, comm)).toBe('strong')
  })
  it('flop with a high pair → medium', () => {
    const hole: [Card, Card] = [c(13,'S'), c(13,'H')]
    const comm = [c(2,'C'), c(5,'D'), c(9,'H')]
    expect(handStrengthTier(hole, comm)).toBe('medium')
  })
  it('flop with junk → weak', () => {
    const hole: [Card, Card] = [c(2,'S'), c(7,'H')]
    const comm = [c(3,'C'), c(5,'D'), c(9,'H')]
    expect(handStrengthTier(hole, comm)).toBe('weak')
  })
})
