'use client'
import { motion } from 'framer-motion'
import type { RoundResult, Player } from '@/lib/types'
import { CardFace } from './CardFace'

type Props = {
  result: RoundResult
  players: Player[]
}

export function ShowdownReveal({ result, players }: Props) {
  const nameOf = (id: string) => players.find(p => p.id === id)?.name ?? id

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={'text-center text-3xl font-bold ' + (result.won ? 'text-emerald-300' : 'text-rose-400')}
      >
        {result.won ? 'Heist round won!' : 'Round lost'}
      </motion.div>

      <ul className="space-y-3">
        {result.actualRanking.map((id, i) => {
          const hand = result.hands[id]
          const holeCards = hand.cards.slice(0, 2)
          return (
            <motion.li
              key={id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.18, duration: 0.35, ease: 'easeOut' }}
              className="flex items-center gap-3 px-3 py-2 rounded bg-stone-900/60 border border-stone-800"
            >
              <span className="text-sm text-stone-400 w-6">#{i + 1}</span>
              <span className="font-semibold w-32 truncate">{nameOf(id)}</span>
              <div className="flex gap-1">
                {holeCards.map((c, j) => <CardFace key={j} card={c} size="sm" />)}
              </div>
              <span className="text-sm text-stone-300 ml-2">{hand.description}</span>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}
