'use client'

const KEY_SOUND = 'the-gang:soundEnabled'
const KEY_HINT = 'the-gang:strengthHintEnabled'

export function loadSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const v = window.localStorage.getItem(KEY_SOUND)
  return v == null ? true : v === 'true'
}

export function saveSoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY_SOUND, String(enabled))
}

export function loadHintEnabled(): boolean {
  if (typeof window === 'undefined') return false
  const v = window.localStorage.getItem(KEY_HINT)
  return v == null ? false : v === 'true'
}

export function saveHintEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY_HINT, String(enabled))
}
