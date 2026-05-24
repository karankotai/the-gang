'use client'
import type { ClientMessage, HeistVariant } from '@/lib/types'
import { VARIANT_INFO } from '@/lib/types'

type Props = {
  variant: HeistVariant
  disabled?: boolean
  send: (m: ClientMessage) => void
}

export function VariantPicker({ variant, disabled, send }: Props) {
  const info = VARIANT_INFO[variant]
  return (
    <div className="space-y-2">
      <label className="block text-sm text-stone-400">Heist variant</label>
      {disabled ? (
        <div className="px-3 py-2 rounded bg-stone-900/60 border border-stone-800">
          <div className="font-semibold">{info.label}</div>
          <div className="text-xs text-stone-400">{info.description}</div>
        </div>
      ) : (
        <>
          <select
            value={variant}
            onChange={e => send({ t: 'setVariant', variant: e.target.value as HeistVariant })}
            className="w-full px-3 py-2 rounded bg-stone-800 border border-stone-700 focus:border-amber-500 outline-none"
          >
            {(Object.keys(VARIANT_INFO) as HeistVariant[]).map(v => (
              <option key={v} value={v}>{VARIANT_INFO[v].label}</option>
            ))}
          </select>
          <div className="text-xs text-stone-400">{info.description}</div>
        </>
      )}
    </div>
  )
}
