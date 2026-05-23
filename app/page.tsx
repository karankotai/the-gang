'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function genRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

export default function Home() {
  const router = useRouter()
  const [code, setCode] = useState('')

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-900 text-stone-100">
      <div className="max-w-md w-full p-8 space-y-6">
        <h1 className="text-3xl font-bold">The Gang</h1>
        <button
          className="w-full py-3 rounded bg-amber-600 hover:bg-amber-500"
          onClick={() => router.push(`/r/${genRoomCode()}`)}
        >
          Create new room
        </button>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            className="flex-1 px-3 py-2 rounded bg-stone-800 border border-stone-700"
            maxLength={6}
          />
          <button
            className="px-4 py-2 rounded bg-stone-700 hover:bg-stone-600 disabled:opacity-50"
            disabled={code.length < 4}
            onClick={() => router.push(`/r/${code}`)}
          >
            Join
          </button>
        </div>
      </div>
    </main>
  )
}
