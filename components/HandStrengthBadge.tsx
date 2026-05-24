'use client'
import type { HandStrengthTier } from '@/lib/handStrength'

type Props = { tier: HandStrengthTier }

const STYLE: Record<HandStrengthTier, { label: string; classes: string }> = {
  weak:   { label: 'Likely weak',   classes: 'bg-rose-900/40 text-rose-200 border-rose-700/60' },
  medium: { label: 'Likely medium', classes: 'bg-amber-900/40 text-amber-200 border-amber-700/60' },
  strong: { label: 'Likely strong', classes: 'bg-emerald-900/40 text-emerald-200 border-emerald-700/60' },
}

export function HandStrengthBadge({ tier }: Props) {
  const s = STYLE[tier]
  return (
    <span
      title="Rough self-assessment based on your hole cards + visible community."
      className={'text-xs uppercase tracking-wide px-2 py-0.5 rounded border ' + s.classes}
    >
      {s.label}
    </span>
  )
}
