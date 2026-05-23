'use client'
import { use } from 'react'
import { useGameSocket } from '@/lib/client/useGameSocket'
import { useGameStore } from '@/lib/client/store'
import { Lobby } from '@/components/Lobby'
import { Table } from '@/components/Table'

export default function RoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params)
  const { send } = useGameSocket(roomCode)
  const state = useGameStore(s => s.state)

  if (!state) return <main className="min-h-screen grid place-items-center bg-stone-900 text-stone-100">Connecting…</main>
  if (state.phase === 'lobby') return <Lobby send={send} />
  return <Table send={send} />
}
