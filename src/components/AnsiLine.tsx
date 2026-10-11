import type { ReactNode } from 'react'

// eslint-disable-next-line no-control-regex -- matches the ESC sequences in terminal output
const CSI = /\x1b\[([0-9;?]*)([A-Za-z])/g
const COLORS = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']

/** Renders a terminal line with its SGR colors; other control sequences are dropped. */
export function AnsiLine({ text }: { text: string }) {
  const parts: ReactNode[] = []
  let fg = ''
  let bold = false
  let dim = false
  let last = 0
  const push = (s: string) => {
    if (!s) return
    const cls = [fg && `ansi-${fg}`, bold && 'ansi-bold', dim && 'ansi-dim'].filter(Boolean).join(' ')
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
      else if (c >= 30 && c <= 37) fg = COLORS[c - 30]
      else if (c >= 90 && c <= 97) fg = `bright-${COLORS[c - 90]}`
    }
  }
  push(text.slice(last))
  return <>{parts}</>
}
