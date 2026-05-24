'use client'
import { useState } from 'react'
import type { AbilityType, ClientMessage, Phase, Player } from '@/lib/types'
import { ABILITY_INFO } from '@/lib/types'
import { CardFace } from './CardFace'
import { useGameStore } from '@/lib/client/store'

type Props = {
  ability: AbilityType
  used: boolean
  phase: Phase
  players: Player[]
  myId: string
  send: (m: ClientMessage) => void
}

function usableInPhase(ability: AbilityType, phase: Phase): boolean {
  switch (ability) {
    case 'scout':      return phase === 'preflop' || phase === 'flop' || phase === 'turn'
    case 'mole':       return phase === 'preflop' || phase === 'flop' || phase === 'turn' || phase === 'river' || phase === 'showdown'
    case 'wildcard':   return phase === 'preflop'
    case 'negotiator': return phase === 'preflop' || phase === 'flop' || phase === 'turn' || phase === 'river'
  }
}

export function AbilityPanel({ ability, used, phase, players, myId, send }: Props) {
  const info = ABILITY_INFO[ability]
  const scoutPeek = useGameStore(s => s.scoutPeek)
  const molePeek = useGameStore(s => s.molePeek)
  const setScoutPeek = useGameStore(s => s.setScoutPeek)
  const setMolePeek = useGameStore(s => s.setMolePeek)
  const [moleTarget, setMoleTarget] = useState<string>('')
  const [negA, setNegA] = useState<string>('')
  const [negB, setNegB] = useState<string>('')

  const canUse = !used && usableInPhase(ability, phase)
  const opponents = players.filter(p => p.id !== myId && p.connected)
  const chipHolders = players.filter(p => p.connected)

  const handleUse = () => {
    if (ability === 'scout') send({ t: 'abilityScout' })
    else if (ability === 'mole' && moleTarget) send({ t: 'abilityMole', targetId: moleTarget })
    else if (ability === 'wildcard') send({ t: 'abilityWildcard' })
    else if (ability === 'negotiator' && negA && negB && negA !== negB) {
      send({ t: 'abilityNegotiator', aId: negA, bId: negB })
    }
  }

  return (
    <section className="rounded border border-violet-700/60 bg-violet-950/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-violet-200">Your ability: {info.label}</div>
          <div className="text-xs text-violet-300/80">{info.description}</div>
        </div>
        {used && <span className="text-xs text-stone-400">Used</span>}
      </div>

      {!used && ability === 'mole' && (
        <select
          value={moleTarget}
          onChange={e => setMoleTarget(e.target.value)}
          className="w-full px-2 py-1 rounded bg-stone-900 border border-stone-700 text-sm"
        >
          <option value="">Pick a target…</option>
          {opponents.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}

      {!used && ability === 'negotiator' && (
        <div className="grid grid-cols-2 gap-2">
          <select value={negA} onChange={e => setNegA(e.target.value)} className="px-2 py-1 rounded bg-stone-900 border border-stone-700 text-sm">
            <option value="">Player A…</option>
            {chipHolders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={negB} onChange={e => setNegB(e.target.value)} className="px-2 py-1 rounded bg-stone-900 border border-stone-700 text-sm">
            <option value="">Player B…</option>
            {chipHolders.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      <button
        disabled={!canUse || (ability === 'mole' && !moleTarget) || (ability === 'negotiator' && (!negA || !negB || negA === negB))}
        onClick={handleUse}
        className="w-full px-3 py-1.5 rounded bg-violet-700 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-stone-50 text-sm font-semibold"
      >
        Use {info.label}
      </button>

      {scoutPeek && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-violet-300">Next community card:</span>
          <CardFace card={scoutPeek} size="sm" />
          <button onClick={() => setScoutPeek(null)} className="ml-auto text-xs text-stone-400 hover:text-stone-200">dismiss</button>
        </div>
      )}

      {molePeek && (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-violet-300">
            {players.find(p => p.id === molePeek.targetId)?.name ?? 'Target'}&apos;s hand:
          </span>
          <CardFace card={molePeek.holeCards[0]} size="sm" />
          <CardFace card={molePeek.holeCards[1]} size="sm" />
          <button onClick={() => setMolePeek(null)} className="ml-auto text-xs text-stone-400 hover:text-stone-200">dismiss</button>
        </div>
      )}
    </section>
  )
}
