import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import { STAGE_LABEL, type CmdEvent, type FeedEvent, type ResultEvent, type StageEvent, type TextEvent, type ToolEvent } from '../api'
import { clock } from '../lib/format'
import { AnsiLine } from './AnsiLine'
import { CodeLines, EditDiff } from './DiffView'

type Block =
  | { type: 'stage' | 'info'; ev: StageEvent }
  | { type: 'text'; ev: TextEvent }
  | { type: 'tool'; ev: ToolEvent; result?: ResultEvent }
  | { type: 'cmd'; ev: CmdEvent; lines: string[]; ok?: boolean }

/** Groups the events: a tool call with its result, a command with its output lines and exit. */
function toBlocks(events: FeedEvent[]): Block[] {
  const blocks: Block[] = []
  const tools = new Map<string, Extract<Block, { type: 'tool' }>>()
  let cmd: Extract<Block, { type: 'cmd' }> | null = null
  for (const e of events) {
    if (e.kind === 'out') cmd?.lines.push(e.text)
    else if (e.kind === 'exit') {
      if (cmd) cmd.ok = e.ok
      cmd = null
    } else if (e.kind === 'cmd') {
      cmd = { type: 'cmd', ev: e, lines: [] }
      blocks.push(cmd)
    } else if (e.kind === 'result') {
      const b = tools.get(e.id)
      if (b) b.result = e
    } else if (e.kind === 'tool') {
      const b = { type: 'tool' as const, ev: e }
      tools.set(e.id, b)
      blocks.push(b)
    } else if (e.kind === 'text') blocks.push({ type: 'text', ev: e })
    else blocks.push({ type: e.kind, ev: e })
  }
  return blocks
}

export function LiveFeed({ events, live }: { events: FeedEvent[]; live: boolean }) {
  const blocks = useMemo(() => toBlocks(events), [events])
  const ref = useRef<HTMLDivElement>(null)
  const [pinned, setPinned] = useState(true) // scrolled to the bottom: keep following new events

  useLayoutEffect(() => {
    if (pinned) ref.current?.scrollTo({ top: ref.current.scrollHeight })
  }, [blocks, pinned])

  const onScroll = () => {
    const el = ref.current
    if (el) setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 60)
  }

  return (
    <div className="relative h-full">
      {/* aria-live off: a screen reader would read every output line; the stage pill announces progress */}
      <div
        className="h-full space-y-3 overflow-y-auto px-6 py-4 text-sm"
        ref={ref}
        onScroll={onScroll}
        role="log"
        aria-live="off"
        aria-label="Live feed"
      >
        {blocks.length === 0 && <p className="text-gray-500">No events yet.</p>}
        {blocks.map((b, i) => (
          <FeedBlock key={i} block={b} live={live} />
        ))}
        {live && <p className="animate-pulse text-gray-400">working…</p>}
      </div>
      {!pinned && (
        <button
          className="absolute right-6 bottom-4 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs shadow-sm"
          onClick={() => setPinned(true)}
        >
          ↓ Latest events
        </button>
      )}
    </div>
  )
}

function Row({ ts, children }: { ts: number; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <time className="shrink-0 font-mono text-xs text-gray-400">{clock(ts)}</time>
      {children}
    </div>
  )
}

function Badge({ children }: { children: ReactNode }) {
  return <span className="shrink-0 rounded bg-gray-100 px-1.5 text-xs font-medium text-gray-700">{children}</span>
}

const STATUS = { pending: 'text-gray-400', good: 'text-green-700', bad: 'text-red-700', warn: 'text-amber-700' }

function Status({ tone, children }: { tone: keyof typeof STATUS; children: ReactNode }) {
  return <span className={`shrink-0 text-xs ${STATUS[tone]}`}>{children}</span>
}

function FeedBlock({ block: b, live }: { block: Block; live: boolean }) {
  switch (b.type) {
    case 'stage':
      return (
        <div className="flex items-baseline gap-2 border-t border-gray-200 pt-3 first:border-0 first:pt-0">
          <span className="font-semibold">{STAGE_LABEL[b.ev.stage]}</span>
          <span className="flex-1 text-gray-600">{b.ev.msg}</span>
          <time className="font-mono text-xs text-gray-400">{clock(b.ev.ts)}</time>
        </div>
      )
    case 'info':
      return (
        <Row ts={b.ev.ts}>
          <span className="text-gray-500">{b.ev.msg}</span>
        </Row>
      )
    case 'text':
      return (
        <div className="md text-gray-800">
          <Markdown>{b.ev.text}</Markdown>
        </div>
      )
    case 'tool':
      return <ToolBlock ev={b.ev} result={b.result} live={live} />
    case 'cmd':
      return <CmdBlock ev={b.ev} lines={b.lines} ok={b.ok} live={live} />
  }
}

function ToolBlock({ ev, result, live }: { ev: ToolEvent; result?: ResultEvent; live: boolean }) {
  const i = ev.input
  const target = i.file_path ?? i.command ?? i.pattern ?? ''
  const status =
    !result && live ? (
      <Status tone="pending">running…</Status>
    ) : result?.is_error ? (
      <Status tone="bad">error</Status>
    ) : ev.name === 'Read' || ev.name === 'Glob' || ev.name === 'Grep' ? (
      <Status tone="pending">{summary(ev.name, result?.output)}</Status>
    ) : null

  let body = null
  if (ev.name === 'Edit' && i.old_string !== undefined) {
    body = <EditDiff before={i.old_string} after={i.new_string ?? ''} />
  } else if (ev.name === 'Write' && i.content !== undefined) {
    const lines = i.content.replace(/\n$/, '').split('\n')
    body = <CodeLines lines={lines.slice(0, 80).map((text) => ({ kind: 'add', text }))} more={lines.length - 80} />
  } else if (ev.name === 'Bash' && result?.output) {
    body = <Output lines={result.output.replace(/\n$/, '').split('\n')} bad={result.is_error} />
  }
  // a failed Edit or Read says why below its input; Bash shows its error output as the body
  const error = result?.is_error && ev.name !== 'Bash' && <Output lines={result.output.split('\n')} bad />

  return (
    <div className="space-y-1.5">
      <Row ts={ev.ts}>
        <Badge>{ev.name}</Badge>
        <span className="min-w-0 flex-1 truncate font-mono text-xs">
          {ev.name === 'Bash' && <span className="text-gray-400">$ </span>}
          {target}
        </span>
        {status}
      </Row>
      {ev.name === 'Bash' && i.description && <p className="text-xs text-gray-500">{i.description}</p>}
      {body}
      {error}
    </div>
  )
}

function summary(name: string, output?: string) {
  if (!output) return ''
  if (name === 'Read') return output
  const n = output.trim() ? output.trim().split('\n').length : 0
  return n === 0 ? 'no results' : n === 1 ? '1 result' : `${n} results`
}

/** expect_fail: the new tests run on the code before the change, where failing is the good outcome. */
function cmdStatus(ev: CmdEvent, ok: boolean | undefined, live: boolean) {
  if (ok === undefined) return live && <Status tone="pending">running…</Status>
  if (ev.expect_fail)
    return ok ? (
      <Status tone="warn">⚠ also passed on the base code</Status>
    ) : (
      <Status tone="good">✓ failed as expected</Status>
    )
  return ok ? <Status tone="good">✓ passed</Status> : <Status tone="bad">✗ failed</Status>
}

function CmdBlock({ ev, lines, ok, live }: { ev: CmdEvent; lines: string[]; ok?: boolean; live: boolean }) {
  return (
    <div className="space-y-1.5">
      <Row ts={ev.ts}>
        <Badge>{ev.label ?? (ev.stage === 'checking' ? 'Check' : 'Setup')}</Badge>
        <span className="min-w-0 flex-1 truncate font-mono text-xs">
          <span className="text-gray-400">$ </span>
          {ev.cmd}
        </span>
        {cmdStatus(ev, ok, live)}
      </Row>
      {lines.length > 0 && <Output lines={lines} ansi />}
    </div>
  )
}

const TAIL = 40 // output lines shown until "Show more"

function Output({ lines, bad, ansi }: { lines: string[]; bad?: boolean; ansi?: boolean }) {
  const [all, setAll] = useState(false)
  const hidden = all ? 0 : Math.max(0, lines.length - TAIL)
  return (
    <div
      className={`overflow-x-auto rounded-md border bg-gray-50 p-3 font-mono text-xs leading-5 ${
        bad ? 'border-red-200 text-red-800' : 'border-gray-200'
      }`}
    >
      {hidden > 0 && (
        <button className="mb-1 text-gray-500 underline" onClick={() => setAll(true)}>
          Show {hidden} more lines
        </button>
      )}
      {lines.slice(hidden).map((l, i) => (
        <div key={i} className="whitespace-pre">
          {ansi ? <AnsiLine text={l} /> : l || ' '}
        </div>
      ))}
    </div>
  )
}
