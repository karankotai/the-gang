'use client'

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
    if (!Ctor) return null
    try { ctx = new Ctor() } catch { return null }
  }
  if (ctx.state === 'suspended') { void ctx.resume() }
  return ctx
}

type ToneOpts = {
  frequency: number
  durationMs: number
  type?: OscillatorType
  startGain?: number
  endGain?: number
  delayMs?: number
}

function playTone(opts: ToneOpts) {
  const c = getContext()
  if (!c) return
  const start = c.currentTime + (opts.delayMs ?? 0) / 1000
  const end = start + opts.durationMs / 1000
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.value = opts.frequency
  gain.gain.setValueAtTime(opts.startGain ?? 0.2, start)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, opts.endGain ?? 0.001), end)
  osc.connect(gain).connect(c.destination)
  osc.start(start)
  osc.stop(end + 0.02)
}

export function playChip() {
  playTone({ frequency: 880, durationMs: 80, type: 'triangle', startGain: 0.18 })
}

export function playFlip() {
  playTone({ frequency: 260, durationMs: 130, type: 'sawtooth', startGain: 0.12 })
  playTone({ frequency: 520, durationMs: 70, type: 'sine', startGain: 0.08, delayMs: 60 })
}

export function playReady() {
  playTone({ frequency: 660, durationMs: 110, type: 'sine', startGain: 0.16 })
}

export function playWin() {
  playTone({ frequency: 523.25, durationMs: 140, type: 'triangle', startGain: 0.2 })
  playTone({ frequency: 659.25, durationMs: 140, type: 'triangle', startGain: 0.2, delayMs: 120 })
  playTone({ frequency: 783.99, durationMs: 280, type: 'triangle', startGain: 0.22, delayMs: 240 })
}

export function playLoss() {
  // Soft, low "fwoom" — single sine tone with slow fade
  playTone({ frequency: 196.0, durationMs: 600, type: 'sine', startGain: 0.22, endGain: 0.001 })
  // Subtle low-octave undertone for body
  playTone({ frequency: 98.0,  durationMs: 700, type: 'sine', startGain: 0.12, endGain: 0.001, delayMs: 40 })
}
