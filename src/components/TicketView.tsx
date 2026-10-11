import { useState, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import { ACTIVE, STAGE_LABEL, useEvents, usePoll, type Ticket } from '../api'
import { duration, tokens, tokensTitle, useNow } from '../lib/format'
import { diffStats } from '../lib/parseDiff'
import { Banners } from './Banners'
import { DiffView } from './DiffView'
import { LiveFeed } from './LiveFeed'
import { PlanReview } from './PlanReview'
import { Stepper } from './Stepper'

type Tab = 'live' | 'diff' | 'plan' | 'ticket'

/** One ticket: header, progress, banner, and the live feed, changes, plan and ticket text as tabs. */
export function TicketView({ id, onBack }: { id: string; onBack: () => void }) {
  const t = usePoll<Ticket>(`/api/tickets/${id}`, 1000)
  const events = useEvents(id)
  const now = useNow()
  const [picked, setTab] = useState<Tab>('live')

  if (!t) return <div className="main-empty">Loading…</div>
  const live = ACTIVE.includes(t.stage)
  const stats = t.diff ? diffStats(t.diff) : null
  // a retry clears the diff and the plan: show the live feed instead of an empty panel under a disabled tab
  const tab = (picked === 'diff' && !stats) || (picked === 'plan' && !t.triage) ? 'live' : picked

  return (
    <div className="ticket">
      <header className="ticket-head">
        <button className="back" onClick={onBack}>
          ← Tickets
        </button>
        <div className="ticket-meta">
          <span className="ticket-id mono">{t.id}</span>
          {t.project && <span className="project-tag mono">{t.project}</span>}
          {t.jira && (
            <a className="project-tag mono" href={t.jira_url} target="_blank" rel="noreferrer">
              Jira {t.jira}
            </a>
          )}
          <span className={`pill stage-${t.stage}`}>
            {live && <span className="dot-pulse" />}
            {STAGE_LABEL[t.stage]}
          </span>
          <span className="spacer" />
          {t.stage !== 'queued' && (
            <span className="meta-item" title={live ? 'Time in this step' : 'Total time'}>
              <ClockIcon /> {duration(live ? now / 1000 - t.since : t.since - t.created)}
            </span>
          )}
          <span className="meta-item mono" title="The models that ran for this ticket, and the effort level">
            {(t.models?.length ? t.models : [t.agent.model]).join(', ')} · {t.agent.effort}
          </span>
          <span className="meta-item" title={tokensTitle(t.tokens)}>
            {tokens(t.tokens)}
          </span>
        </div>
        <h1>{t.title}</h1>
        <Stepper t={t} />
      </header>

      <Banners t={t} />

      <nav className="tabs" role="tablist">
        <TabButton id="live" tab={tab} setTab={setTab}>
          {live && <span className="dot-pulse" />} Live feed
        </TabButton>
        <TabButton id="diff" tab={tab} setTab={setTab} disabled={!stats}>
          Changes
          {stats && (
            <span className="tab-count">
              <span className="plus">+{stats.add}</span> <span className="minus">−{stats.del}</span>
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

      <div className="tab-panel" role="tabpanel">
        {tab === 'live' && <LiveFeed events={events} live={live} />}
        {tab === 'diff' && t.diff && (
          <div className="scroll pad">
            <DiffView diff={t.diff} />
          </div>
        )}
        {tab === 'plan' && <PlanReview t={t} />}
        {tab === 'ticket' && (
          <div className="scroll pad">
            <article className="md card">
              {/* the front matter (project: ...) is shown in the header */}
              <Markdown>{t.text.replace(/^---\n[\s\S]*?\n---\n/, '')}</Markdown>
            </article>
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton(props: { id: Tab; tab: Tab; setTab: (t: Tab) => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      role="tab"
      aria-selected={props.tab === props.id}
      className="tab"
      disabled={props.disabled}
      onClick={() => props.setTab(props.id)}
    >
      {props.children}
    </button>
  )
}

function ClockIcon() {
  return (
    <svg className="icon" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5V8l2.25 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
