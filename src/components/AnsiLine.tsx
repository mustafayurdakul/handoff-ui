import type { ReactNode } from 'react'

// eslint-disable-next-line no-control-regex -- matches the ESC sequences in terminal output
const CSI = /\x1b\[([0-9;?]*)([A-Za-z])/g
// SGR foreground codes 30-37 and 90-97, in colors that read on a white background
const FG: Record<number, string> = {
  30: 'text-gray-900',
  31: 'text-red-700',
  32: 'text-green-700',
  33: 'text-amber-700',
  34: 'text-blue-700',
  35: 'text-fuchsia-700',
  36: 'text-cyan-700',
  37: 'text-gray-500',
  90: 'text-gray-500',
  91: 'text-red-600',
  92: 'text-green-600',
  93: 'text-amber-600',
  94: 'text-blue-600',
  95: 'text-fuchsia-600',
  96: 'text-cyan-600',
  97: 'text-gray-400',
}

/** Renders a terminal line with its SGR colors; other control sequences are dropped. */
export function AnsiLine({ text }: { text: string }) {
  const parts: ReactNode[] = []
  let fg = ''
  let bold = false
  let dim = false
  let last = 0
  const push = (s: string) => {
    if (!s) return
    const cls = [fg, bold && 'font-semibold', dim && 'opacity-60'].filter(Boolean).join(' ')
    parts.push(cls ? <span key={parts.length} className={cls}>{s}</span> : s)
  }
  for (const m of text.matchAll(CSI)) {
    push(text.slice(last, m.index))
    last = m.index + m[0].length
    if (m[2] !== 'm') continue
    for (const c of (m[1] || '0').split(';').map(Number)) {
      if (c === 0) [fg, bold, dim] = ['', false, false]
      else if (c === 1) bold = true
      else if (c === 2) dim = true
      else if (c === 22) [bold, dim] = [false, false]
      else if (c === 39) fg = ''
      else if (FG[c]) fg = FG[c]
    }
  }
  push(text.slice(last))
  return <>{parts}</>
}
