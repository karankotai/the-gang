'use client'
import { useState } from 'react'
import { useGameStore } from '@/lib/client/store'
import type { ClientMessage } from '@/lib/types'
import { VariantPicker } from '@/components/VariantPicker'

export function Lobby({ send }: { send: (m: ClientMessage) => void }) {
  const state = useGameStore(s => s.state)!
  const myId = useGameStore(s => s.myPlayerId)!
  const me = state.players.find(p => p.id === myId)
  const host = state.players.find(p => p.connected)
  const iAmHost = host?.id === myId
  const [name, setName] = useState(me?.name ?? 'Player')
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    if (typeof window === 'undefined') return
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <main className="min-h-screen table-felt text-stone-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-wide">The Gang</h1>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded bg-stone-900/60 border border-stone-700">
            <span className="text-stone-400 text-sm">Room</span>
            <span className="text-2xl font-mono tracking-widest text-amber-300">{state.roomCode}</span>
            <button
              onClick={copyLink}
              className="text-xs px-2 py-1 rounded bg-stone-800 hover:bg-stone-700 border border-stone-700"
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
          <div className="text-stone-400 text-xs">{state.players.length} / 6 players</div>
        </header>

        <section className="space-y-2 bg-stone-900/40 p-4 rounded border border-stone-800">
          <label className="block text-sm text-stone-400">Your display name</label>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => send({ t: 'setIdentity', name, avatar: '' })}
              className="flex-1 px-3 py-2 rounded bg-stone-800 border border-stone-700 focus:border-amber-500 outline-none"
              maxLength={20}
            />
            <button
              className="px-4 py-2 rounded bg-stone-700 hover:bg-stone-600"
              onClick={() => send({ t: 'setIdentity', name, avatar: '' })}
            >
              Save
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm uppercase tracking-wider text-stone-400">Players</h2>
          <ul className="space-y-1">
            {state.players.map(p => (
              <li
                key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded bg-stone-900/60 border border-stone-800"
              >
                <span>
                  {p.name}
                  {p.id === myId && <span className="text-stone-500 text-xs ml-1">(you)</span>}
                </span>
                <span className={'text-xs ' + (p.ready ? 'text-emerald-400' : 'text-stone-500')}>
                  {p.ready ? '● Ready' : '○ Not ready'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-stone-900/40 p-4 rounded border border-stone-800">
          <VariantPicker variant={state.variant} disabled={!iAmHost} send={send} />
          {!iAmHost && (
            <div className="text-xs text-stone-500 mt-1">Only the host can change the variant.</div>
          )}
        </section>

        <div className="flex gap-2">
          <button
            className="flex-1 py-3 rounded bg-amber-600 hover:bg-amber-500 font-semibold"
            onClick={() => send({ t: 'ready', ready: !me?.ready })}
          >
            {me?.ready ? 'Cancel ready' : "I'm ready"}
          </button>
          <button
            className="flex-1 py-3 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
            disabled={state.players.length < 3 || !state.players.every(p => p.ready)}
            onClick={() => send({ t: 'startHeist' })}
          >
            Start heist
          </button>
        </div>
      </div>
    </main>
  )
}
