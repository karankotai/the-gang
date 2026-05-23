'use client'
import type { Card } from '@/lib/types'
import { formatRank, SUIT_GLYPH, SUIT_IS_RED } from '@/lib/client/format'

type Props = {
  card: Card
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE: Record<NonNullable<Props['size']>, { w: string; h: string; rank: string; corner: string; pip: string }> = {
  sm: { w: 'w-10', h: 'h-14', rank: 'text-sm', corner: 'text-[10px]', pip: 'text-xl' },
  md: { w: 'w-14', h: 'h-20', rank: 'text-base', corner: 'text-xs', pip: 'text-3xl' },
  lg: { w: 'w-20', h: 'h-28', rank: 'text-lg', corner: 'text-sm', pip: 'text-5xl' },
}

export function CardFace({ card, size = 'md', className = '' }: Props) {
  const s = SIZE[size]
  const colorClass = SUIT_IS_RED(card.suit) ? 'text-rose-600' : 'text-stone-900'
  const rankText = formatRank(card.rank)
  const suitGlyph = SUIT_GLYPH[card.suit]

  return (
    <div
      className={
        'card-face relative bg-stone-50 rounded-md shadow-md border border-stone-300 ' +
        'flex flex-col justify-between p-1.5 select-none ' +
        s.w + ' ' + s.h + ' ' + colorClass + ' ' + className
      }
    >
      <div className={'flex flex-col items-start leading-none ' + s.corner}>
        <span className="font-semibold">{rankText}</span>
        <span>{suitGlyph}</span>
      </div>
      <div className={'absolute inset-0 grid place-items-center ' + s.pip}>
        <span>{suitGlyph}</span>
      </div>
      <div className={'flex flex-col items-end leading-none rotate-180 ' + s.corner}>
        <span className="font-semibold">{rankText}</span>
        <span>{suitGlyph}</span>
      </div>
    </div>
  )
}
