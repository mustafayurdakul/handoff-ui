import { useState, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import { ACTIVE, useEvents, usePoll, type Ticket } from '../api'
import { duration, tokens, tokensTitle, useNow } from '../lib/format'
import { diffStats } from '../lib/parseDiff'
import { Banners } from './Banners'
import { DiffView } from './DiffView'
import { LiveFeed } from './LiveFeed'
import { PlanReview } from './PlanReview'
import { StagePill } from './StagePill'
import { Stepper } from './Stepper'

type Tab = 'live' | 'diff' | 'plan' | 'ticket'

/** One ticket: header, progress, banner, and the live feed, changes, plan and ticket text as tabs. */
export function TicketView({ id, onBack }: { id: string; onBack: () => void }) {
  const t = usePoll<Ticket>(`/api/tickets/${id}`, 1000)
  const events = useEvents(id)
  const now = useNow()
  const [picked, setTab] = useState<Tab>('live')

  if (!t) return <p className="p-6 text-sm text-gray-500">Loading…</p>
  const live = ACTIVE.includes(t.stage)
  const stats = t.diff ? diffStats(t.diff) : null
  // a retry clears the diff and the plan: show the live feed instead of an empty panel under a disabled tab
  const tab = (picked === 'diff' && !stats) || (picked === 'plan' && !t.triage) ? 'live' : picked

  return (
    <div className="flex h-full flex-col">
      <header className="space-y-3 px-6 pt-4 pb-3">
        <button className="text-sm text-gray-500 hover:text-gray-900 md:hidden" onClick={onBack}>
          ← Tickets
        </button>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
          <span className="font-mono text-gray-900">{t.id}</span>
          {t.project && <span className="font-mono">{t.project}</span>}
          {t.jira && (
            <a className="font-mono underline" href={t.jira_url} target="_blank" rel="noreferrer">
              Jira {t.jira}
            </a>
          )}
          {/* announces stage changes to screen readers; the feed itself stays quiet */}
          <span aria-live="polite">
            <StagePill stage={t.stage} />
          </span>
          <span className="flex-1" />
          {t.stage !== 'queued' && (
            <span title={live ? 'Time in this step' : 'Total time'}>
              {duration(live ? now / 1000 - t.since : t.since - t.created)}
            </span>
          )}
          <span className="font-mono" title="The models that ran for this ticket, and the effort level">
            {(t.models?.length ? t.models : [t.agent.model]).join(', ')} · {t.agent.effort}
          </span>
          <span title={tokensTitle(t.tokens)}>{tokens(t.tokens)}</span>
        </div>
        <h1 className="text-xl font-semibold">{t.title}</h1>
        <Stepper t={t} />
      </header>

      <Banners t={t} />

      <nav className="flex gap-5 overflow-x-auto border-b border-gray-200 px-6" role="tablist">
        <TabButton id="live" tab={tab} setTab={setTab}>
          Live feed
        </TabButton>
        <TabButton id="diff" tab={tab} setTab={setTab} disabled={!stats}>
          Changes
          {stats && (
            <span className="ml-1.5 font-mono text-xs">
              <span className="text-green-700">+{stats.add}</span> <span className="text-red-700">−{stats.del}</span>
            </span>
          )}
        </TabButton>
        <TabButton id="plan" tab={tab} setTab={setTab} disabled={!t.triage}>
          Plan &amp; Review
        </TabButton>
        <TabButton id="ticket" tab={tab} setTab={setTab}>
          Ticket
        </TabButton>
      </nav>

      <div className="min-h-0 flex-1" role="tabpanel">
        {tab === 'live' && <LiveFeed events={events} live={live} />}
        {tab === 'diff' && t.diff && (
          <Scroll>
            <DiffView diff={t.diff} />
          </Scroll>
        )}
        {tab === 'plan' && (
          <Scroll>
            <PlanReview t={t} />
          </Scroll>
        )}
        {tab === 'ticket' && (
          <Scroll>
            {/* the front matter (project: ...) is shown in the header */}
            <article className="md max-w-3xl text-sm">
              <Markdown>{t.text.replace(/^---\n[\s\S]*?\n---\n/, '')}</Markdown>
            </article>
          </Scroll>
        )}
      </div>
    </div>
  )
}

function Scroll({ children }: { children: ReactNode }) {
  return <div className="h-full overflow-y-auto px-6 py-4">{children}</div>
}

function TabButton(props: { id: Tab; tab: Tab; setTab: (t: Tab) => void; disabled?: boolean; children: ReactNode }) {
  const selected = props.tab === props.id
  return (
    <button
      role="tab"
      aria-selected={selected}
      className={`-mb-px border-b-2 py-2.5 text-sm whitespace-nowrap disabled:opacity-40 ${
        selected ? 'border-gray-900 font-medium text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900'
      }`}
      disabled={props.disabled}
      onClick={() => props.setTab(props.id)}
    >
      {props.children}
    </button>
  )
}
