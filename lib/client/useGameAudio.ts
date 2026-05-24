'use client'
import { useEffect, useRef } from 'react'
import type { RoomState } from '../types'
import { useGameStore } from './store'
import { playChip, playFlip, playReady, playWin, playLoss } from './audio'

type Snapshot = {
  chipsKey: string
  communityLen: number
  phaseReadyLen: number
  roundResultWon: boolean | null
}

function snapshot(state: RoomState): Snapshot {
  const chipsKey = Object.entries(state.currentChips)
    .map(([k, v]) => `${k}:${v ?? '-'}`).sort().join(',')
  return {
    chipsKey,
    communityLen: state.community.length,
    phaseReadyLen: state.phaseReady.length,
    roundResultWon: state.roundResult ? state.roundResult.won : null,
  }
}

export function useGameAudio(enabled: boolean) {
  const state = useGameStore(s => s.state)
  const prev = useRef<Snapshot | null>(null)

  useEffect(() => {
    if (!state) { prev.current = null; return }
    const next = snapshot(state)
    const last = prev.current
    prev.current = next
    if (!enabled || !last) return

    if (next.chipsKey !== last.chipsKey) playChip()
    if (next.communityLen > last.communityLen) {
      const delta = next.communityLen - last.communityLen
      for (let i = 0; i < delta; i++) {
        setTimeout(playFlip, i * 140)
      }
    }
    if (next.phaseReadyLen > last.phaseReadyLen) playReady()
    if (next.roundResultWon !== last.roundResultWon && next.roundResultWon != null) {
      if (next.roundResultWon) playWin()
      else playLoss()
    }
  }, [state, enabled])
}
