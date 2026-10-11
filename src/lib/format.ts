// Display helpers: token counts, times and a ticking clock.
import { useEffect, useState } from 'react'
import type { Tokens } from '../api'

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

/** For example "1.2M in · 18K out". */
export const tokens = (t?: Tokens) => `${compact.format(t?.input ?? 0)} in · ${compact.format(t?.output ?? 0)} out`

export const tokensTitle = (t?: Tokens) => {
  const n = (x = 0) => x.toLocaleString('en-US')
  return `Input: ${n(t?.input)} tokens (${n(t?.cache_read)} read from cache)\nOutput: ${n(t?.output)} tokens`
}

/** A unix time in seconds as HH:MM:SS. */
export const clock = (ts: number) => new Date(ts * 1000).toLocaleTimeString('en-GB')

/** Seconds as M:SS, or H:MM:SS from one hour on. */
export function duration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const pad = (n: number) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`
}

/** The current time in milliseconds, updated every `ms`. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(h)
  }, [ms])
  return now
}
