'use client'
import { useGameStore } from '@/lib/client/store'
import type { ChipValue, ClientMessage } from '@/lib/types'
import { PHASE_COLOR } from '@/lib/types'
import { CardFace } from '@/components/CardFace'
import { ShowdownReveal } from '@/components/ShowdownReveal'
import { ChipIcon } from '@/components/ChipIcon'
import { HeistProgress } from '@/components/HeistProgress'
import { EventLog } from '@/components/EventLog'
import { motion, LayoutGroup } from 'framer-motion'

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
    <LayoutGroup>
    <main className="min-h-screen table-felt text-stone-100 p-4">
      <div className="grid lg:grid-cols-[1fr_220px] gap-4 max-w-6xl mx-auto">
        <div className="space-y-4">
          <header className="flex items-center justify-between gap-4 text-sm">
            <HeistProgress heist={state.heist} />
            <span className="uppercase tracking-wider text-stone-400 text-xs">{state.phase}</span>
            <span className="text-stone-400">Room {state.roomCode}</span>
          </header>

          <section className="md:grid md:grid-cols-3 md:gap-3 lg:grid-cols-5">
            <div className="flex md:contents gap-2 overflow-x-auto pb-2 md:pb-0 md:overflow-visible">
            {opponents.map(p => {
              const opChip = Object.entries(state.currentChips).find(([, v]) => v === p.id)?.[0]
              return (
                <div key={p.id} className="flex-shrink-0 min-w-[140px] md:min-w-0 p-3 rounded bg-stone-900/60 border border-stone-800">
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-stone-400">{p.connected ? 'online' : 'offline'}</div>
                  <div className="mt-2 flex gap-1 text-xs">
                    {state.lockedChips.map((l, i) => {
                      const v = Object.entries(l.claims).find(([, id]) => id === p.id)?.[0]
                      if (!v) return null
                      return <ChipIcon key={i} value={Number(v)} color={PHASE_COLOR[l.phase]} size={24} />
                    })}
                    {opChip && (
                      <motion.div
                        layoutId={`chip-${state.phase}-${Number(opChip)}`}
                        layout
                        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                      >
                        <ChipIcon
                          value={Number(opChip)}
                          color="other"
                          size={32}
                          title={`Click to steal chip ${opChip} from ${p.name}`}
                          ariaLabel={`Steal chip ${opChip} from ${p.name}`}
                          onClick={() => send({ t: 'claimChip', value: Number(opChip) as ChipValue })}
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              )
            })}
            </div>
          </section>

          <section className="text-center space-y-2">
            <div className="text-sm text-stone-400">Community</div>
            <div className="flex justify-center gap-1.5 md:gap-2">
              {state.community.length === 0 && <span className="text-stone-500">(none yet)</span>}
              {state.community.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ rotateY: 180, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={{ delay: i * 0.12, duration: 0.45, ease: 'easeOut' }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="scale-90 md:scale-100"
                >
                  <CardFace card={c} size="md" />
                </motion.div>
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
                  const heldByOther = holder != null && !mine
                  // Opponent-held chips are rendered next to that opponent's panel — not in the pool.
                  // Rendering them here too would duplicate the layoutId and break the animation.
                  if (heldByOther) return null
                  const isClaim = state.phase === 'preflop' || state.phase === 'flop' || state.phase === 'turn' || state.phase === 'river'
                  const currentPhaseColor = isClaim ? PHASE_COLOR[state.phase as Extract<typeof state.phase, 'preflop'|'flop'|'turn'|'river'>] : 'white'
                  const color = mine ? 'mine' : currentPhaseColor
                  return (
                    <motion.div
                      key={v}
                      layoutId={`chip-${state.phase}-${v}`}
                      layout
                      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    >
                      <ChipIcon
                        value={v}
                        color={color}
                        size={56}
                        title={mine ? 'Click to return' : 'Click to claim'}
                        ariaLabel={`Chip ${v}`}
                        onClick={() => send(mine ? { t: 'returnChip' } : { t: 'claimChip', value: v })}
                      />
                    </motion.div>
                  )
                })}
              </div>
              <div className="text-center text-xs text-stone-400">Lowest ← → Highest</div>
            </section>
          )}

          <section className="space-y-2 sticky bottom-0 bg-stone-950/95 backdrop-blur border-t border-stone-800 -mx-4 px-4 py-3 md:static md:mx-0 md:p-0 md:bg-transparent md:border-0 md:backdrop-blur-none">
            <div className="text-sm text-stone-400 text-center">Your hand</div>
            <div className="flex justify-center gap-2">
              {hole ? hole.map((c, i) => (
                <CardFace key={i} card={c} size="lg" />
              )) : <span className="text-stone-500">(waiting for deal)</span>}
            </div>
            {['preflop', 'flop', 'turn', 'river'].includes(state.phase) && (
              <div className="flex justify-center gap-2">
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
              <div className="space-y-3">
                <ShowdownReveal result={state.roundResult} players={state.players} />
                <div className="text-center">
                  <button className="px-6 py-2 rounded bg-amber-600 hover:bg-amber-500" onClick={() => send({ t: 'nextRound' })}>
                    Next round
                  </button>
                </div>
              </div>
            )}
            {state.phase === 'gameEnd' && (
              <div className="text-center text-2xl font-bold">Game over — {state.heist.totalHeistsWon}/4 heists cleared</div>
            )}
          </section>

          {errors.length > 0 && (
            <div className="fixed bottom-2 right-2 text-xs text-rose-400">{errors[errors.length - 1]}</div>
          )}
        </div>

        <aside className="hidden lg:block bg-stone-900/50 rounded border border-stone-800 p-2 h-fit sticky top-4">
          <h3 className="text-xs uppercase tracking-wide text-stone-400 px-2 py-1">Event log</h3>
          <EventLog />
        </aside>
      </div>
    </main>
    </LayoutGroup>
  )
}
