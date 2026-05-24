'use client'

type Props = { used?: boolean }

export function AbilityBadge({ used }: Props) {
  return (
    <span
      title={used ? 'Ability used this heist' : 'Has an unused ability this heist'}
      className={
        'text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ' +
        (used
          ? 'bg-stone-800/60 text-stone-500 border-stone-700'
          : 'bg-violet-900/40 text-violet-200 border-violet-700/60')
      }
    >
      {used ? 'used' : 'ability'}
    </span>
  )
}
