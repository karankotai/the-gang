'use client'
import { use } from 'react'
import { useGameSocket } from '@/lib/client/useGameSocket'
import { useGameStore } from '@/lib/client/store'
import { Lobby } from '@/components/Lobby'
import { Table } from '@/components/Table'

export default function RoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = use(params)
  const { send } = useGameSocket(roomCode)
  const state = useGameStore(s => s.state)
  const status = useGameStore(s => s.connectionStatus)

  if (!state) {
    const msg =
      status === 'open' ? 'Joining room…' :
      status === 'closed' ? 'Connection closed. Reload to try again.' :
      status === 'error' ? 'Connection error. Check the server URL or your network and reload.' :
      'Connecting…'
    return (
      <main className="min-h-screen grid place-items-center bg-stone-900 text-stone-100">
        <div className="text-center space-y-2 max-w-md p-6">
          <div className="text-lg font-semibold">{msg}</div>
          <div className="text-xs text-stone-500">Room {roomCode}</div>
          {status === 'error' && (
            <div className="text-xs text-rose-400 mt-3">
              If you&apos;re the host, check that the PartyKit server is deployed and the
              <code className="mx-1 px-1 bg-stone-800 rounded">NEXT_PUBLIC_PARTYKIT_HOST</code>
              env var is set in your Vercel project, then trigger a redeploy.
            </div>
          )}
        </div>
      </main>
    )
  }
  if (state.phase === 'lobby') return <Lobby send={send} />
  return <Table send={send} />
}
