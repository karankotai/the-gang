'use client'
import { useState } from 'react'
import { useGameStore } from '@/lib/client/store'
import type { ClientMessage } from '@/lib/types'

export function Lobby({ send }: { send: (m: ClientMessage) => void }) {
  const state = useGameStore(s => s.state)!
  const myId = useGameStore(s => s.myPlayerId)!
  const me = state.players.find(p => p.id === myId)
  const [name, setName] = useState(me?.name ?? 'Player')

  return (
    <main className="min-h-screen bg-stone-900 text-stone-100 p-6 max-w-2xl mx-auto space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Room {state.roomCode}</h1>
        <span className="text-stone-400 text-sm">{state.players.length} / 6</span>
      </header>

      <section className="space-y-2">
        <label className="block text-sm text-stone-400">Display name</label>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 px-3 py-2 rounded bg-stone-800 border border-stone-700"
            maxLength={20}
          />
          <button
            className="px-4 py-2 rounded bg-stone-700"
            onClick={() => send({ t: 'setIdentity', name, avatar: '' })}
          >
            Save
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg">Players</h2>
        <ul className="space-y-1">
          {state.players.map(p => (
            <li key={p.id} className="flex items-center justify-between px-3 py-2 rounded bg-stone-800">
              <span>{p.name}{p.id === myId ? ' (you)' : ''}</span>
              <span className={p.ready ? 'text-emerald-400' : 'text-stone-500'}>{p.ready ? 'Ready' : 'Not ready'}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-2">
        <button
          className="flex-1 py-3 rounded bg-amber-600 hover:bg-amber-500"
          onClick={() => send({ t: 'ready', ready: !me?.ready })}
        >
          {me?.ready ? 'Cancel ready' : "I'm ready"}
        </button>
        <button
          className="flex-1 py-3 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40"
          disabled={state.players.length < 3 || !state.players.every(p => p.ready)}
          onClick={() => send({ t: 'startHeist' })}
        >
          Start heist
        </button>
      </div>
    </main>
  )
}
