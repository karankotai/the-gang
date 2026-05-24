'use client'

const KEY_SOUND = 'the-gang:soundEnabled'
const KEY_HINT = 'the-gang:strengthHintEnabled'
const KEY_DISPLAY_NAME = 'the-gang:displayName'

function safeGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  try { return window.localStorage.getItem(key) } catch { return null }
}

function safeSet(key: string, value: string): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(key, value) } catch { /* ignore */ }
}

export function loadSoundEnabled(): boolean {
  const v = safeGet(KEY_SOUND)
  return v == null ? true : v === 'true'
}

export function saveSoundEnabled(enabled: boolean) {
  safeSet(KEY_SOUND, String(enabled))
}

export function loadHintEnabled(): boolean {
  const v = safeGet(KEY_HINT)
  return v == null ? false : v === 'true'
}

export function saveHintEnabled(enabled: boolean) {
  safeSet(KEY_HINT, String(enabled))
}

export function loadDisplayName(): string {
  return safeGet(KEY_DISPLAY_NAME) ?? ''
}

export function saveDisplayName(name: string) {
  safeSet(KEY_DISPLAY_NAME, name)
}
