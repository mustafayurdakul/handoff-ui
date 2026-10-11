// The handoff API: types, polling and the live feed. Requests go to /api, which Vite proxies to HANDOFF_API.
import { useEffect, useState } from 'react'

export type Stage =
  | 'queued'
  | 'triage'
  | 'coding'
  | 'checking'
  | 'review'
  | 'delivering'
  | 'done'
  | 'question'
  | 'rejected'
  | 'failed'

export const STAGE_LABEL: Record<Stage, string> = {
  queued: 'Queued',
  triage: 'Triaging',
  coding: 'Coding',
  checking: 'Checking',
  review: 'In review',
  delivering: 'Delivering',
  done: 'Done',
  question: 'Needs answer',
  rejected: 'Rejected',
  failed: 'Failed',
}

export const ACTIVE: Stage[] = ['triage', 'coding', 'checking', 'review', 'delivering']

export type Tokens = { input: number; cache_read: number; output: number }

export type Summary = {
  id: string
  title: string
  project: string
  stage: Stage
  round: number
  tokens?: Tokens
  since: number
  updated: number
}

export type Finding = { severity: 'blocker' | 'minor'; file: string; message: string }

export type Ticket = Summary & {
  created: number
  text: string
  rounds: number
  agent: { model: string; effort: string }
  base?: string
  models?: string[]
  triage?: { decision: 'go' | 'question' | 'reject'; summary: string; questions: string[]; plan: string }
  questions?: string[]
  check?: string
  diff?: string
  tests?: string
  work?: string
  review?: { approved: boolean; summary: string; findings: Finding[] }
  branch?: string
  mr?: string
  jira?: string
  jira_url?: string
  error?: string
  failed_stage?: Stage
}

type Base = { ts: number; stage: Stage }
export type StageEvent = Base & { kind: 'stage' | 'info'; msg: string }
export type TextEvent = Base & { kind: 'text'; text: string }
export type ToolEvent = Base & { kind: 'tool'; id: string; name: string; input: Record<string, string | undefined> }
export type ResultEvent = Base & { kind: 'result'; id: string; output: string; is_error: boolean }
export type CmdEvent = Base & { kind: 'cmd'; cmd: string; label?: string; expect_fail?: boolean }
export type OutEvent = Base & { kind: 'out'; text: string }
export type ExitEvent = Base & { kind: 'exit'; ok: boolean }
export type FeedEvent = StageEvent | TextEvent | ToolEvent | ResultEvent | CmdEvent | OutEvent | ExitEvent

/** Fetches `url` now and every `ms`. Keeps the last data while the server is down. */
export function usePoll<T>(url: string, ms = 1500): T | null {
  const [data, setData] = useState<T | null>(null)
  useEffect(() => {
    let alive = true
    const load = () =>
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => alive && d && setData(d))
        .catch(() => {})
    load()
    const h = setInterval(load, ms)
    return () => {
      alive = false
      clearInterval(h)
    }
  }, [url, ms])
  return data
}

/** A ticket's live feed. The server sends batches of events; a dropped connection resumes where it stopped. */
export function useEvents(id: string): FeedEvent[] {
  const [events, setEvents] = useState<FeedEvent[]>([])
  useEffect(() => {
    const es = new EventSource(`/api/tickets/${id}/events`)
    es.onmessage = (m) => {
      try {
        const batch = JSON.parse(m.data) as FeedEvent[]
        setEvents((prev) => prev.concat(batch))
      } catch (e) {
        console.error('bad event batch', e) // skip it: the server has already moved past it
      }
    }
    return () => es.close()
  }, [id])
  return events
}

/** POSTs and returns null on success, else a message for the user. */
export async function post(url: string, body?: unknown): Promise<string | null> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).catch(() => null)
  if (!r) return 'The server cannot be reached.'
  if (r.ok) return null
  const d = await r.json().catch(() => null)
  return typeof d?.detail === 'string' ? d.detail : `Request failed (${r.status})`
}
