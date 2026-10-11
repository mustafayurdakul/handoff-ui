import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import { AnsiLine } from './AnsiLine'
import { CodeLines, EditDiff } from './DiffView'
import type { CmdEvent, FeedEvent, ResultEvent, StageEvent, TextEvent, ToolEvent } from '../api'
import { clock } from '../lib/format'

type Block =
  | { type: 'stage' | 'info'; ev: StageEvent }
  | { type: 'text'; ev: TextEvent }
  | { type: 'tool'; ev: ToolEvent; result?: ResultEvent }
  | { type: 'cmd'; ev: CmdEvent; lines: string[]; ok?: boolean }

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

const STAGE_NAME: Record<string, string> = {
  queued: 'Queue',
  triage: 'Triage',
  coding: 'Coding',
  checking: 'Checks',
  review: 'Review',
  delivering: 'Delivery',
  done: 'Done',
  question: 'Question',
  rejected: 'Rejected',
  failed: 'Failed',
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
    <div className="feed-wrap">
      <div className="feed" ref={ref} onScroll={onScroll} role="log" aria-live="polite" aria-label="Live feed">
        {blocks.length === 0 && <p className="feed-empty">No events yet.</p>}
        {blocks.map((b, i) => (
          <FeedBlock key={i} block={b} live={live} />
        ))}
        {live && (
          <div className="feed-cursor" aria-hidden>
            <span className="dot-pulse" /> working
          </div>
        )}
      </div>
      {!pinned && (
        <button className="to-bottom" onClick={() => setPinned(true)}>
          ↓ Latest events
        </button>
      )}
    </div>
  )
}

function Time({ ts }: { ts: number }) {
  return <time className="ev-time">{clock(ts)}</time>
}

function FeedBlock({ block: b, live }: { block: Block; live: boolean }) {
  switch (b.type) {
    case 'stage':
      return (
        <div className="ev-stage">
          <span className="ev-stage-label">{STAGE_NAME[b.ev.stage] ?? b.ev.stage}</span>
          <span className="ev-stage-msg">{b.ev.msg}</span>
          <Time ts={b.ev.ts} />
        </div>
      )
    case 'info':
      return (
        <div className="ev-row muted">
          <Time ts={b.ev.ts} />
          <span>{b.ev.msg}</span>
        </div>
      )
    case 'text':
      return (
        <div className="ev-text">
          <span className="avatar" aria-hidden>
            C
          </span>
          <div className="md">
            <Markdown>{b.ev.text}</Markdown>
          </div>
        </div>
      )
    case 'tool':
      return <ToolBlock ev={b.ev} result={b.result} live={live} />
    case 'cmd':
      return <CmdBlock ev={b.ev} lines={b.lines} ok={b.ok} live={live} />
  }
}

const TAIL = 40

function ToolBlock({ ev, result, live }: { ev: ToolEvent; result?: ResultEvent; live: boolean }) {
  const i = ev.input
  const target = i.file_path ?? i.command ?? i.pattern ?? ''
  const pending = !result && live
  const status = pending ? (
    <span className="ev-status pending">running…</span>
  ) : result?.is_error ? (
    <span className="ev-status bad">error</span>
  ) : ev.name === 'Read' || ev.name === 'Glob' || ev.name === 'Grep' ? (
    <span className="ev-status">{summary(ev.name, result?.output)}</span>
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
  const showError = result?.is_error && ev.name !== 'Bash'

  return (
    <div className="ev-tool">
      <div className="ev-row">
        <Time ts={ev.ts} />
        <span className={`badge tool-${ev.name.toLowerCase()}`}>{ev.name}</span>
        <span className="ev-target mono">
          {ev.name === 'Bash' && <span className="prompt">$ </span>}
          {target}
        </span>
        {status}
      </div>
      {ev.name === 'Bash' && i.description && <div className="ev-desc">{i.description}</div>}
      {body && <div className="ev-body">{body}</div>}
      {showError && (
        <div className="ev-body">
          <Output lines={result.output.split('\n')} bad />
        </div>
      )}
    </div>
  )
}

function summary(name: string, output?: string) {
  if (!output) return ''
  if (name === 'Read') return output
  const n = output.trim() ? output.trim().split('\n').length : 0
  return n === 0 ? 'no results' : n === 1 ? '1 result' : `${n} results`
}

function CmdBlock({ ev, lines, ok, live }: { ev: CmdEvent; lines: string[]; ok?: boolean; live: boolean }) {
  return (
    <div className="ev-cmd">
      <div className="ev-row">
        <Time ts={ev.ts} />
        <span className="badge tool-pipeline">{ev.label ?? (ev.stage === 'checking' ? 'Check' : 'Setup')}</span>
        <span className="ev-target mono">
          <span className="prompt">$ </span>
          {ev.cmd}
        </span>
        {ok === undefined ? (
          live && <span className="ev-status pending">running…</span>
        ) : ev.expect_fail ? (
          ok ? (
            <span className="ev-status warn">⚠ also passed on the base code</span>
          ) : (
            <span className="ev-status good">✓ failed as expected</span>
          )
        ) : ok ? (
          <span className="ev-status good">✓ passed</span>
        ) : (
          <span className="ev-status bad">✗ failed</span>
        )}
      </div>
      {lines.length > 0 && (
        <div className="ev-body">
          <Output lines={lines} ansi />
        </div>
      )}
    </div>
  )
}

function Output({ lines, bad, ansi }: { lines: string[]; bad?: boolean; ansi?: boolean }) {
  const [all, setAll] = useState(false)
  const hidden = all ? 0 : Math.max(0, lines.length - TAIL)
  return (
    <div className={`term mono${bad ? ' bad' : ''}`}>
      {hidden > 0 && (
        <button className="term-more" onClick={() => setAll(true)}>
          Show {hidden} more lines
        </button>
      )}
      {lines.slice(hidden).map((l, i) => (
        <div key={i} className="term-line">
          {ansi ? <AnsiLine text={l} /> : l || ' '}
        </div>
      ))}
    </div>
  )
}
