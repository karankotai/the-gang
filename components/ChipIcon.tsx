'use client'
import type { ChipColor, ChipValue } from '@/lib/types'

type Props = {
  value: ChipValue | number
  color?: ChipColor | 'unclaimed' | 'mine' | 'other'
  size?: number
  initial?: string
  onClick?: () => void
  title?: string
  ariaLabel?: string
}

const COLOR: Record<string, { face: string; rim: string; text: string }> = {
  white:     { face: '#f4f4ed', rim: '#222222', text: '#111111' },
  yellow:    { face: '#f7d35c', rim: '#222222', text: '#111111' },
  orange:    { face: '#e08442', rim: '#222222', text: '#111111' },
  red:       { face: '#c83a3a', rim: '#222222', text: '#ffffff' },
  unclaimed: { face: '#e6e6df', rim: '#222222', text: '#111111' },
  mine:      { face: '#f59e0b', rim: '#7c2d12', text: '#111111' },
  other:     { face: '#e11d48', rim: '#3b0a0a', text: '#ffffff' },
}

export function ChipIcon({
  value, color = 'unclaimed', size = 56, initial, onClick, title, ariaLabel,
}: Props) {
  const c = COLOR[color]
  const radius = size / 2
  const inner = radius * 0.7
  const segments = 8
  const slicePaths: string[] = []
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2
    const a1 = ((i + 1) / segments) * Math.PI * 2
    const x0 = radius + Math.cos(a0) * radius
    const y0 = radius + Math.sin(a0) * radius
    const x1 = radius + Math.cos(a1) * radius
    const y1 = radius + Math.sin(a1) * radius
    const xi0 = radius + Math.cos(a0) * inner
    const yi0 = radius + Math.sin(a0) * inner
    const xi1 = radius + Math.cos(a1) * inner
    const yi1 = radius + Math.sin(a1) * inner
    slicePaths.push(
      `M ${x0} ${y0} A ${radius} ${radius} 0 0 1 ${x1} ${y1} L ${xi1} ${yi1} A ${inner} ${inner} 0 0 0 ${xi0} ${yi0} Z`
    )
  }

  const button = !!onClick
  const Wrapper: 'button' | 'div' = button ? 'button' : 'div'
  return (
    <Wrapper
      type={button ? 'button' : undefined}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? `Chip ${value}`}
      className={'relative inline-block ' + (button ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-full' : '')}
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden>
        <ellipse cx={radius} cy={radius + 2} rx={radius - 1} ry={radius - 2} fill="rgba(0,0,0,0.35)" />
        <circle cx={radius} cy={radius} r={radius - 1} fill={c.face} stroke={c.rim} strokeWidth="1.5" />
        {slicePaths.map((d, i) => (
          <path key={i} d={d} fill={i % 2 === 0 ? c.rim : 'transparent'} opacity={i % 2 === 0 ? 0.85 : 0} />
        ))}
        <circle cx={radius} cy={radius} r={inner} fill={c.face} stroke={c.rim} strokeWidth="1" />
        <text
          x={radius} y={radius} fill={c.text}
          textAnchor="middle" dominantBaseline="central"
          fontSize={size * 0.36} fontWeight="700" fontFamily="Georgia, serif"
        >
          {value}
        </text>
      </svg>
      {initial && (
        <span
          className="absolute -bottom-1 -right-1 text-[10px] bg-stone-900 text-stone-100 rounded-full grid place-items-center border border-stone-700"
          style={{ width: 16, height: 16 }}
        >
          {initial}
        </span>
      )}
    </Wrapper>
  )
}
