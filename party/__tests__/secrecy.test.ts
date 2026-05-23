import { describe, it, expect } from 'vitest'
import {
  initialRoomState, addPlayer, setReady, startHeist,
} from '../../lib/stateMachine'

describe('secrecy invariant', () => {
  it('RoomState never contains hole cards before showdown', () => {
    let s = initialRoomState('R')
    for (const id of ['a','b','c']) { s = addPlayer(s, { id, name:id, avatar:'' }); s = setReady(s, id, true) }
    s = startHeist(s, { seed: 'fixed' })

    const serialized = JSON.stringify(s)
    expect(serialized).not.toMatch(/holeCards/)
    for (const p of s.players) {
      expect((p as any).holeCards).toBeUndefined()
    }
  })
})
