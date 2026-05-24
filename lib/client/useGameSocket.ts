'use client'
import { useEffect, useRef } from 'react'
import PartySocket from 'partysocket'
import type { ClientMessage, ServerMessage } from '../types'
import { useGameStore } from './store'

function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'the-gang:playerId'
  let id = window.sessionStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    window.sessionStorage.setItem(key, id)
  }
  return id
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

  useEffect(() => {
    const playerId = getOrCreatePlayerId()
    setMyPlayerId(playerId)
    const sock = new PartySocket({
      host: process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999',
      room: roomCode,
      query: { playerId },
    })
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
  }, [roomCode, setState, setHoleCards, setMyPlayerId, addEvent, addError, setMyAbility, setScoutPeek, setMolePeek])

  function send(msg: ClientMessage) {
    ref.current?.send(JSON.stringify(msg))
  }
  return { send }
}
