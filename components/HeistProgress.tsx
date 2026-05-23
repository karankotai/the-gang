'use client'
import type { HeistState } from '@/lib/types'

export function HeistProgress({ heist }: { heist: HeistState }) {
  const dots = Array.from({ length: 4 }, (_, i) => {
    const idx = i
    const isWon = idx < heist.roundsWon
    const isLost = idx >= heist.roundsWon && idx < heist.roundsWon + heist.roundsLost
    return (
      <span
        key={i}
        className={
          'inline-block w-2.5 h-2.5 rounded-full ' +
          (isWon ? 'bg-emerald-400' : isLost ? 'bg-rose-500' : 'bg-stone-600')
        }
        title={isWon ? 'Won' : isLost ? 'Lost' : 'Pending'}
        aria-label={isWon ? 'Won' : isLost ? 'Lost' : 'Pending'}
      />
    )
  })

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-stone-300">Heist {heist.number}/4</span>
      <span className="flex gap-1">{dots}</span>
      <span className="text-stone-500 text-xs">· cleared {heist.totalHeistsWon}</span>
    </div>
  )
}
