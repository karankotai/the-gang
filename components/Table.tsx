'use client'
import { useGameStore } from '@/lib/client/store'
import type { Card, ChipValue, ClientMessage } from '@/lib/types'

const RANK_LABEL: Record<number, string> = {
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
}
const SUIT_GLYPH: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' }
function formatCard(c: Card): string {
  return `${RANK_LABEL[c.rank] ?? c.rank}${SUIT_GLYPH[c.suit]}`
}

export function Table({ send }: { send: (m: ClientMessage) => void }) {
  const state = useGameStore(s => s.state)!
  const myId = useGameStore(s => s.myPlayerId)!
  const hole = useGameStore(s => s.holeCards)
  const errors = useGameStore(s => s.errors)
  const opponents = state.players.filter(p => p.id !== myId)

  const n = state.players.length
  const myChip = Object.entries(state.currentChips).find(([, v]) => v === myId)?.[0]
  const iAmReady = state.phaseReady.includes(myId)

  return (
    <main className="min-h-screen bg-[#3a2a1a] text-stone-100 p-4 space-y-4">
      <header className="flex items-center justify-between text-sm">
        <span>Heist {state.heist.number}/4 · won {state.heist.roundsWon} lost {state.heist.roundsLost}</span>
        <span className="uppercase tracking-wider">{state.phase}</span>
        <span>Room {state.roomCode}</span>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {opponents.map(p => {
          const opChip = Object.entries(state.currentChips).find(([, v]) => v === p.id)?.[0]
          return (
            <div key={p.id} className="p-3 rounded bg-stone-900/60 border border-stone-800">
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-stone-400">{p.connected ? 'online' : 'offline'}</div>
              <div className="mt-2 flex gap-1 text-xs">
                {state.lockedChips.map((l, i) => {
                  const v = Object.entries(l.claims).find(([, id]) => id === p.id)?.[0]
                  return v ? <span key={i} className="px-2 py-0.5 rounded bg-stone-800 border">{l.phase[0]}:{v}</span> : null
                })}
                {opChip && <span className="px-2 py-0.5 rounded bg-amber-700 border border-amber-500">·{opChip}</span>}
              </div>
            </div>
          )
        })}
      </section>

      <section className="text-center space-y-2">
        <div className="text-sm text-stone-400">Community</div>
        <div className="flex justify-center gap-2">
          {state.community.length === 0 && <span className="text-stone-500">(none yet)</span>}
          {state.community.map((c, i) => (
            <span key={i} className="px-3 py-2 rounded bg-stone-100 text-stone-900 font-mono">{formatCard(c)}</span>
          ))}
        </div>
      </section>

      {['preflop', 'flop', 'turn', 'river'].includes(state.phase) && (
        <section className="space-y-2">
          <div className="text-sm text-stone-400 text-center">Chip pool ({state.phase})</div>
          <div className="flex justify-center gap-2">
            {Array.from({ length: n }, (_, i) => (i + 1) as ChipValue).map(v => {
              const holder = state.currentChips[v]
              const mine = holder === myId
              const taken = holder != null && !mine
              return (
                <button
                  key={v}
                  disabled={taken}
                  className={
                    'w-12 h-12 rounded-full grid place-items-center font-bold ' +
                    (mine ? 'bg-amber-500 text-stone-900' :
                      taken ? 'bg-stone-700 text-stone-500' :
                        'bg-stone-200 text-stone-900 hover:bg-amber-300')
                  }
                  onClick={() => send(mine ? { t: 'returnChip' } : { t: 'claimChip', value: v })}
                >
                  {v}
                </button>
              )
            })}
          </div>
          <div className="text-center text-xs text-stone-400">Lowest ← → Highest</div>
        </section>
      )}

      <section className="space-y-2">
        <div className="text-sm text-stone-400 text-center">Your hand</div>
        <div className="flex justify-center gap-2">
          {hole ? hole.map((c, i) => (
            <span key={i} className="px-3 py-2 rounded bg-stone-100 text-stone-900 font-mono">{formatCard(c)}</span>
          )) : <span className="text-stone-500">(waiting for deal)</span>}
        </div>
        {['preflop', 'flop', 'turn', 'river'].includes(state.phase) && (
          <div className="flex justify-center gap-2">
            <button
              className="px-4 py-2 rounded bg-stone-700 disabled:opacity-40"
              disabled={!myChip}
              onClick={() => send({ t: 'returnChip' })}
            >
              Return chip
            </button>
            <button
              className="px-4 py-2 rounded bg-emerald-600 disabled:opacity-40"
              disabled={!myChip}
              onClick={() => send({ t: 'readyForNextPhase', ready: !iAmReady })}
            >
              {iAmReady ? 'Cancel ready' : 'Ready for next phase'}
            </button>
          </div>
        )}
        {state.phase === 'showdown' && (
          <div className="flex justify-center">
            <button
              className="px-6 py-3 rounded bg-amber-500 text-stone-900 font-bold"
              onClick={() => send({ t: 'agreeShowdown' })}
            >
              Start showdown
            </button>
          </div>
        )}
        {(state.phase === 'roundResult' || state.phase === 'heistResult') && state.roundResult && (
          <div className="text-center space-y-2">
            <div className={'text-2xl font-bold ' + (state.roundResult.won ? 'text-emerald-400' : 'text-rose-400')}>
              {state.roundResult.won ? 'Round won!' : 'Round lost'}
            </div>
            <ul className="text-sm">
              {state.roundResult.actualRanking.map((id, i) => (
                <li key={id}>{i + 1}. {state.players.find(p => p.id === id)?.name} — {state.roundResult!.hands[id].description}</li>
              ))}
            </ul>
            <button className="mt-3 px-6 py-2 rounded bg-amber-600" onClick={() => send({ t: 'nextRound' })}>
              Next round
            </button>
          </div>
        )}
        {state.phase === 'gameEnd' && (
          <div className="text-center text-2xl font-bold">Game over — {state.heist.totalHeistsWon}/4 heists cleared</div>
        )}
      </section>

      {errors.length > 0 && (
        <div className="fixed bottom-2 right-2 text-xs text-rose-400">{errors[errors.length - 1]}</div>
      )}
    </main>
  )
}
