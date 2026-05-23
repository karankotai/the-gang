'use client'
import { useGameStore } from '@/lib/client/store'

export function EventLog() {
  const events = useGameStore(s => s.events)
  if (events.length === 0) {
    return (
      <div className="text-stone-500 text-xs italic px-2 py-1">
        Events will appear here
      </div>
    )
  }
  return (
    <ul className="text-xs space-y-0.5 max-h-64 overflow-y-auto px-2">
      {events.map((e, i) => (
        <li key={i} className="text-stone-300">{e}</li>
      ))}
    </ul>
  )
}
