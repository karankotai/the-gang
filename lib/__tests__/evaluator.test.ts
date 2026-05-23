import { describe, it, expect } from 'vitest'
import { evaluate5, categoryName } from '../evaluator'
import type { Card } from '../types'

const c = (r: number, s: 'S'|'H'|'D'|'C'): Card => ({ rank: r as any, suit: s })

describe('evaluate5 — categorize 5-card hands', () => {
  it('high card', () => {
    const hand = [c(2,'S'), c(5,'H'), c(9,'D'), c(11,'C'), c(13,'H')]
    expect(categoryName(evaluate5(hand))).toBe('high-card')
  })
  it('pair', () => {
    const hand = [c(2,'S'), c(2,'H'), c(9,'D'), c(11,'C'), c(13,'H')]
    expect(categoryName(evaluate5(hand))).toBe('pair')
  })
  it('two pair', () => {
    const hand = [c(2,'S'), c(2,'H'), c(9,'D'), c(9,'C'), c(13,'H')]
    expect(categoryName(evaluate5(hand))).toBe('two-pair')
  })
  it('three of a kind', () => {
    const hand = [c(2,'S'), c(2,'H'), c(2,'D'), c(9,'C'), c(13,'H')]
    expect(categoryName(evaluate5(hand))).toBe('three-of-a-kind')
  })
  it('straight (5-high)', () => {
    const hand = [c(2,'S'), c(3,'H'), c(4,'D'), c(5,'C'), c(6,'H')]
    expect(categoryName(evaluate5(hand))).toBe('straight')
  })
  it('straight (ace-low: A-2-3-4-5)', () => {
    const hand = [c(14,'S'), c(2,'H'), c(3,'D'), c(4,'C'), c(5,'H')]
    expect(categoryName(evaluate5(hand))).toBe('straight')
  })
  it('straight (ace-high: 10-J-Q-K-A)', () => {
    const hand = [c(10,'S'), c(11,'H'), c(12,'D'), c(13,'C'), c(14,'H')]
    expect(categoryName(evaluate5(hand))).toBe('straight')
  })
  it('flush', () => {
    const hand = [c(2,'S'), c(5,'S'), c(9,'S'), c(11,'S'), c(13,'S')]
    expect(categoryName(evaluate5(hand))).toBe('flush')
  })
  it('full house', () => {
    const hand = [c(2,'S'), c(2,'H'), c(2,'D'), c(9,'C'), c(9,'H')]
    expect(categoryName(evaluate5(hand))).toBe('full-house')
  })
  it('four of a kind', () => {
    const hand = [c(2,'S'), c(2,'H'), c(2,'D'), c(2,'C'), c(9,'H')]
    expect(categoryName(evaluate5(hand))).toBe('four-of-a-kind')
  })
  it('straight flush', () => {
    const hand = [c(2,'S'), c(3,'S'), c(4,'S'), c(5,'S'), c(6,'S')]
    expect(categoryName(evaluate5(hand))).toBe('straight-flush')
  })
  it('not a straight: A-2-3-4-6', () => {
    const hand = [c(14,'S'), c(2,'H'), c(3,'D'), c(4,'C'), c(6,'H')]
    expect(categoryName(evaluate5(hand))).not.toBe('straight')
  })
})

import { compareHands, evaluateBest, describeHand } from '../evaluator'

describe('compareHands', () => {
  it('higher category beats lower', () => {
    const a = evaluate5([c(2,'S'), c(2,'H'), c(2,'D'), c(2,'C'), c(9,'H')]) // quads
    const b = evaluate5([c(2,'S'), c(2,'H'), c(2,'D'), c(9,'C'), c(9,'H')]) // boat
    expect(compareHands(a, b)).toBeGreaterThan(0)
  })
  it('within same category, higher kicker wins', () => {
    const a = evaluate5([c(13,'S'), c(13,'H'), c(9,'D'), c(5,'C'), c(2,'H')]) // pair K, kicker 9
    const b = evaluate5([c(13,'S'), c(13,'H'), c(8,'D'), c(5,'C'), c(2,'H')]) // pair K, kicker 8
    expect(compareHands(a, b)).toBeGreaterThan(0)
  })
  it('identical hands compare equal', () => {
    const a = evaluate5([c(13,'S'), c(13,'H'), c(9,'D'), c(5,'C'), c(2,'H')])
    const b = evaluate5([c(13,'D'), c(13,'C'), c(9,'S'), c(5,'H'), c(2,'D')])
    expect(compareHands(a, b)).toBe(0)
  })
})

describe('evaluateBest (best 5 of 7)', () => {
  it('picks the flush from 7 cards including a flush', () => {
    const hole: [Card, Card] = [c(2,'S'), c(5,'S')]
    const comm = [c(9,'S'), c(11,'S'), c(13,'S'), c(3,'H'), c(4,'D')] as Card[]
    const best = evaluateBest(hole, comm)
    expect(best.category).toBe('flush')
  })
  it('picks the higher of two possible straights', () => {
    const hole: [Card, Card] = [c(10,'S'), c(11,'H')]
    const comm = [c(12,'D'), c(13,'C'), c(14,'H'), c(2,'H'), c(3,'D')] as Card[]
    const best = evaluateBest(hole, comm)
    expect(best.category).toBe('straight')
    expect(best.kickers[0]).toBe(14)
  })
})

describe('describeHand', () => {
  it('produces human-readable descriptions', () => {
    const h = evaluate5([c(13,'S'), c(13,'H'), c(9,'D'), c(5,'C'), c(2,'H')])
    expect(describeHand(h)).toMatch(/Pair.*King/i)
  })
})
