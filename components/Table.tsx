'use client'
import { useState } from 'react'
import { useGameStore } from '@/lib/client/store'
import { useGameAudio } from '@/lib/client/useGameAudio'
import { SoundToggle } from '@/components/SoundToggle'
import type { ChipValue, ClientMessage } from '@/lib/types'
import { PHASE_COLOR, VARIANT_INFO } from '@/lib/types'
import { CardFace } from '@/components/CardFace'
import { ShowdownReveal } from '@/components/ShowdownReveal'
import { ChipIcon } from '@/components/ChipIcon'
import { HeistProgress } from '@/components/HeistProgress'
import { EventLog } from '@/components/EventLog'
import { motion, LayoutGroup } from 'framer-motion'
import { Countdown } from '@/components/Countdown'
import { AbilityPanel } from '@/components/AbilityPanel'
import { AbilityBadge } from '@/components/AbilityBadge'

export function Table({ send }: { send: (m: ClientMessage) => void }) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  useGameAudio(soundEnabled)
  const state = useGameStore(s => s.state)!
  const myId = useGameStore(s => s.myPlayerId)!
  const hole = useGameStore(s => s.holeCards)
  const errors = useGameStore(s => s.errors)
  // Reorder so the current player is last (rightmost on desktop, rightmost in scroll on mobile).
  const seatedPlayers = [
    ...state.players.filter(p => p.id !== myId),
    ...state.players.filter(p => p.id === myId),
  ]

  const n = state.players.length
  const connectedCount = state.players.filter(p => p.connected).length
  const isPaused = connectedCount < 3 && state.phase !== 'lobby' && state.phase !== 'gameEnd'
  const myChip = Object.entries(state.currentChips).find(([, v]) => v === myId)?.[0]
  const iAmReady = state.phaseReady.includes(myId)
  const host = state.players.find(p => p.connected)
  const iAmHost = host?.id === myId
  const myAbility = useGameStore(s => s.myAbility)

  return (
    <LayoutGroup>
    <main className="min-h-screen table-felt text-stone-100 p-4">
      <div className="grid lg:grid-cols-[1fr_220px] gap-4 max-w-6xl mx-auto">
        <div className="space-y-4">
          <header className="flex items-center justify-between gap-4 text-sm">
            <HeistProgress heist={state.heist} />
            <div className="flex items-center gap-2 text-xs">
              <span className="uppercase tracking-wider text-stone-400">{state.phase}</span>
              {state.variant !== 'standard' && (
                <span
                  title={VARIANT_INFO[state.variant].description}
                  className="px-2 py-0.5 rounded bg-rose-900/40 text-rose-200 border border-rose-700/60 uppercase tracking-wide"
                >
                  {VARIANT_INFO[state.variant].label}
                </span>
              )}
            </div>
            <span className="flex items-center gap-2 text-stone-400">
              Room {state.roomCode}
              <SoundToggle onChange={setSoundEnabled} />
            </span>
          </header>

          {isPaused && (
            <div className="rounded border border-rose-700 bg-rose-950/60 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-rose-200">Paused — not enough players</div>
                <div className="text-xs text-rose-300/80">
                  {connectedCount}/3 connected. Waiting for someone to reconnect, or abandon to return to lobby.
                </div>
              </div>
              <button
                className="px-3 py-1.5 rounded bg-rose-700 hover:bg-rose-600 text-stone-50 text-sm font-semibold"
                onClick={() => send({ t: 'endGame' })}
              >
                Abandon game
              </button>
            </div>
          )}

          <section className="md:grid md:grid-cols-3 md:gap-3 lg:grid-cols-5">
            <div className="flex md:contents gap-2 overflow-x-auto pb-2 md:pb-0 md:overflow-visible">
            {seatedPlayers.map(p => {
              const isMe = p.id === myId
              const pChip = Object.entries(state.currentChips).find(([, v]) => v === p.id)?.[0]
              const isReady = state.phaseReady.includes(p.id)
              return (
                <div
                  key={p.id}
                  className={
                    'flex-shrink-0 min-w-[140px] md:min-w-0 p-3 rounded border ' +
                    (isMe
                      ? 'bg-amber-950/50 border-amber-600/60 ring-1 ring-amber-500/40'
                      : 'bg-stone-900/60 border-stone-800')
                  }
                >
                  <div className="flex items-center justify-between gap-1">
                    <div className="font-semibold truncate flex items-center gap-1">
                      <span className="truncate">{p.name}</span>
                      {p.id === host?.id && (
                        <span
                          title="Host — controls Start showdown"
                          className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-700/70 text-amber-50 border border-amber-500/50"
                        >
                          Host
                        </span>
                      )}
                      {isMe && <span className="text-amber-300 text-xs">(you)</span>}
                      {state.abilitiesEnabled && <AbilityBadge used={!!state.abilityUsed[p.id]} />}
                    </div>
                    <div className="flex items-center gap-1">
                      {p.connected && <Countdown deadlineMs={state.phaseDeadlineMs[p.id]} />}
                      {isReady && <span className="text-emerald-400 text-xs">✓</span>}
                    </div>
                  </div>
                  <div className="text-xs text-stone-400">{p.connected ? 'online' : 'offline'}</div>
                  <div className="mt-2 flex gap-1 text-xs items-center">
                    {state.lockedChips.map((l, i) => {
                      const v = Object.entries(l.claims).find(([, id]) => id === p.id)?.[0]
                      if (!v) return null
                      return <ChipIcon key={i} value={Number(v)} color={PHASE_COLOR[l.phase]} size={24} />
                    })}
                    {pChip && (
                      <motion.div
                        layoutId={`chip-${state.phase}-${Number(pChip)}`}
                        layout
                        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                      >
                        <ChipIcon
                          value={Number(pChip)}
                          color={isMe ? 'mine' : 'other'}
                          size={32}
                          title={isMe ? 'Click to return' : `Click to steal chip ${pChip} from ${p.name}`}
                          ariaLabel={isMe ? `Return chip ${pChip}` : `Steal chip ${pChip} from ${p.name}`}
                          onClick={() =>
                            send(isMe
                              ? { t: 'returnChip' }
                              : { t: 'claimChip', value: Number(pChip) as ChipValue })
                          }
                        />
                      </motion.div>
                    )}
                  </div>
                  {!p.connected && !isMe && (
                    <div className="mt-2 text-xs">
                      {!state.activeKick && (
                        <button
                          className="px-2 py-1 rounded bg-rose-900/40 text-rose-200 border border-rose-700 hover:bg-rose-800/60"
                          onClick={() => send({ t: 'kickProposal', playerId: p.id })}
                        >
                          Propose kick
                        </button>
                      )}
                      {state.activeKick && state.activeKick.targetId === p.id && state.activeKick.votes[myId] === undefined && (
                        <div className="flex gap-1">
                          <button
                            className="px-2 py-1 rounded bg-rose-700 text-stone-50 hover:bg-rose-600"
                            onClick={() => send({ t: 'kickVote', playerId: p.id, agree: true })}
                          >
                            Vote yes
                          </button>
                          <button
                            className="px-2 py-1 rounded bg-stone-700 text-stone-200 hover:bg-stone-600"
                            onClick={() => send({ t: 'kickVote', playerId: p.id, agree: false })}
                          >
                            Vote no
                          </button>
                        </div>
                      )}
                      {state.activeKick && state.activeKick.targetId === p.id && state.activeKick.votes[myId] !== undefined && (
                        <div className="text-stone-400 italic">You voted {state.activeKick.votes[myId] ? 'yes' : 'no'}</div>
                      )}
                    </div>
                  )}
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
                  // Any claimed chip — mine or an opponent's — lives in that player's panel.
                  // The pool only shows unclaimed chips, so each chip has exactly one DOM home
                  // and the layoutId animates cleanly between locations.
                  if (holder != null) return null
                  const isClaim = state.phase === 'preflop' || state.phase === 'flop' || state.phase === 'turn' || state.phase === 'river'
                  const currentPhaseColor = isClaim ? PHASE_COLOR[state.phase as Extract<typeof state.phase, 'preflop'|'flop'|'turn'|'river'>] : 'white'
                  return (
                    <motion.div
                      key={v}
                      layoutId={`chip-${state.phase}-${v}`}
                      layout
                      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                    >
                      <ChipIcon
                        value={v}
                        color={currentPhaseColor}
                        size={56}
                        title="Click to claim"
                        ariaLabel={`Chip ${v}`}
                        onClick={() => send({ t: 'claimChip', value: v })}
                      />
                    </motion.div>
                  )
                })}
              </div>
              <div className="text-center text-xs text-stone-400">Lowest ← → Highest</div>
            </section>
          )}

          {state.abilitiesEnabled && myAbility && (
            <AbilityPanel
              ability={myAbility}
              used={!!state.abilityUsed[myId]}
              phase={state.phase}
              players={state.players}
              myId={myId}
              send={send}
            />
          )}

          <section className="space-y-2 sticky bottom-0 bg-stone-950/95 backdrop-blur border-t border-stone-800 -mx-4 px-4 py-3 md:static md:mx-0 md:p-0 md:bg-transparent md:border-0 md:backdrop-blur-none">
            <div className="text-sm text-stone-400 text-center">Your hand</div>
            <div className="flex justify-center gap-2">
              {hole ? hole.map((c, i) => (
                <CardFace key={i} card={c} size="lg" />
              )) : <span className="text-stone-500">(waiting for deal)</span>}
            </div>
            {['preflop', 'flop', 'turn', 'river'].includes(state.phase) && (
              <div className="flex flex-col items-center gap-1">
                <button
                  className={
                    'px-4 py-2 rounded font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ' +
                    (iAmReady
                      ? 'bg-emerald-500 text-stone-950 ring-2 ring-emerald-300 shadow-lg shadow-emerald-500/30 active:scale-95'
                      : 'bg-emerald-900/40 text-emerald-200 border border-emerald-700 hover:bg-emerald-800/60')
                  }
                  disabled={!myChip}
                  onClick={() => send({ t: 'readyForNextPhase', ready: !iAmReady })}
                  aria-pressed={iAmReady}
                >
                  {iAmReady ? '✓ Ready — click to cancel' : 'Ready for next phase'}
                </button>
                <div className="text-xs text-stone-400">
                  {state.phaseReady.length} / {state.players.filter(p => p.connected).length} ready
                </div>
              </div>
            )}
            {state.phase === 'showdown' && (
              <div className="flex justify-center">
                {iAmHost ? (
                  <button
                    className="px-6 py-3 rounded bg-amber-500 text-stone-900 font-bold hover:bg-amber-400 active:scale-95 transition-transform shadow-lg shadow-amber-500/30"
                    onClick={() => send({ t: 'agreeShowdown' })}
                  >
                    Start showdown
                  </button>
                ) : (
                  <div className="text-stone-300 text-sm italic">
                    Waiting for <span className="text-amber-300 font-semibold not-italic">{host?.name ?? 'host'}</span> to start the showdown…
                  </div>
                )}
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
