'use client'
import { useEffect, useState } from 'react'
import { loadSoundEnabled, saveSoundEnabled } from '@/lib/client/prefs'

type Props = {
  onChange?: (enabled: boolean) => void
  className?: string
}

export function SoundToggle({ onChange, className = '' }: Props) {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    const v = loadSoundEnabled()
    setEnabled(v)
    onChange?.(v)
    // We deliberately omit onChange from deps — we only want to read the persisted value once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = () => {
    const v = !enabled
    setEnabled(v)
    saveSoundEnabled(v)
    onChange?.(v)
  }

  return (
    <button
      type="button"
      aria-label={enabled ? 'Mute sounds' : 'Unmute sounds'}
      aria-pressed={enabled}
      title={enabled ? 'Sounds on — click to mute' : 'Sounds muted — click to enable'}
      onClick={toggle}
      className={
        'inline-flex items-center justify-center w-7 h-7 rounded text-xs ' +
        (enabled
          ? 'bg-stone-800 text-amber-300 border border-stone-700 hover:bg-stone-700'
          : 'bg-stone-900 text-stone-500 border border-stone-800 hover:bg-stone-800') +
        ' ' + className
      }
    >
      {enabled ? '♪' : '○'}
    </button>
  )
}
