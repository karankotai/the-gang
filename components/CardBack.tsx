'use client'

type Props = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE = {
  sm: 'w-10 h-14',
  md: 'w-14 h-20',
  lg: 'w-20 h-28',
} as const

export function CardBack({ size = 'md', className = '' }: Props) {
  return (
    <div
      className={
        'relative rounded-md shadow-md border border-amber-900 overflow-hidden ' +
        SIZE[size] + ' ' + className
      }
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, #7a1f1f 0, #7a1f1f 6px, #5c1414 6px, #5c1414 12px),' +
          'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.18))',
        backgroundBlendMode: 'overlay, normal',
      }}
      aria-label="Card back"
    >
      <div className="absolute inset-1 rounded border border-amber-200/40" />
    </div>
  )
}
