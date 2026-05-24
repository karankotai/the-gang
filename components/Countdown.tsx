'use client'
import { useEffect, useState } from 'react'

type Props = {
  deadlineMs?: number
  className?: string
}

function formatMmSs(remainingMs: number): string {
  if (remainingMs <= 0) return '0:00'
  const total = Math.ceil(remainingMs / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Countdown({ deadlineMs, className = '' }: Props) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!deadlineMs) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [deadlineMs])

  if (!deadlineMs) return null
  const remaining = deadlineMs - now
  const isUrgent = remaining < 15_000
  return (
    <span
      className={
        'tabular-nums text-xs ' +
        (isUrgent ? 'text-rose-400 font-semibold' : 'text-stone-400') + ' ' + className
      }
      aria-label={`Time remaining ${formatMmSs(remaining)}`}
    >
      {formatMmSs(remaining)}
    </span>
  )
}
