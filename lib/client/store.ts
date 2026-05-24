'use client'
import { create } from 'zustand'
import type { Card, RoomState, AbilityType } from '../types'

type MolePeek = { targetId: string; holeCards: [Card, Card] }

type State = {
  state: RoomState | null
  myPlayerId: string | null
  holeCards: [Card, Card] | null
  events: string[]
  errors: string[]
  myAbility: AbilityType | null
  scoutPeek: Card | null
  molePeek: MolePeek | null
  setState: (s: RoomState) => void
  setHoleCards: (c: [Card, Card]) => void
  setMyPlayerId: (id: string) => void
  addEvent: (e: string) => void
  addError: (e: string) => void
  setMyAbility: (a: AbilityType | null) => void
  setScoutPeek: (c: Card | null) => void
  setMolePeek: (m: MolePeek | null) => void
  reset: () => void
}

export const useGameStore = create<State>(set => ({
  state: null,
  myPlayerId: null,
  holeCards: null,
  events: [],
  errors: [],
  myAbility: null,
  scoutPeek: null,
  molePeek: null,
  setState: s => set({ state: s }),
  setHoleCards: c => set({ holeCards: c }),
  setMyPlayerId: id => set({ myPlayerId: id }),
  addEvent: e => set(s => ({ events: [...s.events.slice(-50), e] })),
  addError: e => set(s => ({ errors: [...s.errors.slice(-10), e] })),
  setMyAbility: a => set({ myAbility: a }),
  setScoutPeek: c => set({ scoutPeek: c }),
  setMolePeek: m => set({ molePeek: m }),
  reset: () => set({
    state: null, myPlayerId: null, holeCards: null,
    events: [], errors: [],
    myAbility: null, scoutPeek: null, molePeek: null,
  }),
}))
