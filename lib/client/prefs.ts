'use client'

const KEY_SOUND = 'the-gang:soundEnabled'
const KEY_HINT = 'the-gang:strengthHintEnabled'
const KEY_DISPLAY_NAME = 'the-gang:displayName'

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

export function loadDisplayName(): string {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(KEY_DISPLAY_NAME) ?? ''
}

export function saveDisplayName(name: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(KEY_DISPLAY_NAME, name)
}
