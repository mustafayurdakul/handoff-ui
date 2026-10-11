import { ACTIVE, STAGE_LABEL, type Stage, type Summary } from '../api'
import { duration, tokens, tokensTitle, useNow } from '../lib/format'

const GROUPS: { title: string; stages: Stage[] }[] = [
  { title: 'Running', stages: ACTIVE },
  { title: 'Needs answer', stages: ['question'] },
  { title: 'Queued', stages: ['queued'] },
  { title: 'Done', stages: ['done'] },
  { title: 'Rejected and failed', stages: ['rejected', 'failed'] },
]

type Props = { tickets: Summary[]; selected?: string | null; onPick: (id: string) => void }

/** The sidebar: tickets grouped by stage. */
export function TicketList({ tickets, selected, onPick }: Props) {
  return (
    <aside className="sidebar" aria-label="Tickets">
      {GROUPS.map((g) => {
        const items = tickets.filter((t) => g.stages.includes(t.stage))
        if (!items.length) return null
        return (
          <section key={g.title} className="group">
            <h2>
              {g.title} <span className="group-count">{items.length}</span>
            </h2>
            {items.map((t) => (
              <TicketItem key={t.id} t={t} selected={t.id === selected} onClick={() => onPick(t.id)} />
            ))}
          </section>
        )
      })}
      <p className="sidebar-hint">
        To add a ticket, drop a <code>.md</code> file into the inbox folder (<code>HANDOFF_INBOX</code>).
      </p>
    </aside>
  )
}

function TicketItem({ t, selected, onClick }: { t: Summary; selected: boolean; onClick: () => void }) {
  const now = useNow()
  const live = ACTIVE.includes(t.stage)
  return (
    <button className="item" aria-current={selected || undefined} onClick={onClick}>
      <span className="item-top">
        <span className="item-id mono">
          {t.id}
          {t.project && <span className="item-project"> · {t.project}</span>}
        </span>
        <span className={`pill small stage-${t.stage}`}>
          {live && <span className="dot-pulse" />}
          {STAGE_LABEL[t.stage]}
        </span>
      </span>
      <span className="item-title">{t.title}</span>
      <span className="item-meta" title={tokensTitle(t.tokens)}>
        {live && `${duration(now / 1000 - t.since)} · `}
        {t.round > 0 && `round ${t.round} · `}
        {tokens(t.tokens)}
      </span>
    </button>
  )
}
