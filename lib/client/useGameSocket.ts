'use client'
import { useEffect, useRef } from 'react'
import PartySocket from 'partysocket'
import type { ClientMessage, ServerMessage } from '../types'
import { useGameStore } from './store'

function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'the-gang:playerId'
  try {
    let id = window.sessionStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      window.sessionStorage.setItem(key, id)
    }
    return id
  } catch {
    // sessionStorage blocked (e.g., Safari private mode) — use a per-page-load id.
    // This means refresh = new identity, no reconnect-with-same-id. Acceptable degradation.
    return crypto.randomUUID()
  }
}

export function useGameSocket(roomCode: string) {
  const ref = useRef<PartySocket | null>(null)
  const setState = useGameStore(s => s.setState)
  const setHoleCards = useGameStore(s => s.setHoleCards)
  const setMyPlayerId = useGameStore(s => s.setMyPlayerId)
  const addEvent = useGameStore(s => s.addEvent)
  const addError = useGameStore(s => s.addError)
  const setMyAbility = useGameStore(s => s.setMyAbility)
  const setScoutPeek = useGameStore(s => s.setScoutPeek)
  const setMolePeek = useGameStore(s => s.setMolePeek)
  const setConnectionStatus = useGameStore(s => s.setConnectionStatus)

  useEffect(() => {
    const playerId = getOrCreatePlayerId()
    setMyPlayerId(playerId)
    setConnectionStatus('connecting')
    const sock = new PartySocket({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999',
      room: roomCode,
      query: { playerId },
    })
    sock.addEventListener('open', () => setConnectionStatus('open'))
    sock.addEventListener('close', () => setConnectionStatus('closed'))
    sock.addEventListener('error', () => setConnectionStatus('error'))
    sock.addEventListener('message', (ev) => {
      try {
        const msg: ServerMessage = JSON.parse(ev.data)
        switch (msg.t) {
          case 'state': setState(msg.state); break
          case 'private': setHoleCards(msg.holeCards); break
          case 'event': addEvent(msg.text); break
          case 'error': addError(msg.code + ': ' + msg.msg); break
          case 'ability': setMyAbility(msg.ability); break
          case 'peek': setScoutPeek(msg.card); break
          case 'molePeek': setMolePeek({ targetId: msg.targetId, holeCard: msg.holeCard }); break
        }
      } catch {}
    })
    ref.current = sock
    return () => { sock.close() }
  }, [roomCode, setState, setHoleCards, setMyPlayerId, addEvent, addError, setMyAbility, setScoutPeek, setMolePeek, setConnectionStatus])

  function send(msg: ClientMessage) {
    ref.current?.send(JSON.stringify(msg))
  }
  return { send }
}
