'use client'
import { create } from 'zustand'
import type { Card, RoomState } from '../types'

type State = {
  state: RoomState | null
  myPlayerId: string | null
  holeCards: [Card, Card] | null
  events: string[]
  errors: string[]
  setState: (s: RoomState) => void
  setHoleCards: (c: [Card, Card]) => void
  setMyPlayerId: (id: string) => void
  addEvent: (e: string) => void
  addError: (e: string) => void
  reset: () => void
}

export const useGameStore = create<State>(set => ({
  state: null,
  myPlayerId: null,
  holeCards: null,
  events: [],
  errors: [],
  setState: s => set({ state: s }),
  setHoleCards: c => set({ holeCards: c }),
  setMyPlayerId: id => set({ myPlayerId: id }),
  addEvent: e => set(s => ({ events: [...s.events.slice(-50), e] })),
  addError: e => set(s => ({ errors: [...s.errors.slice(-10), e] })),
  reset: () => set({ state: null, myPlayerId: null, holeCards: null, events: [], errors: [] }),
}))
