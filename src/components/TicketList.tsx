import { ACTIVE, type Stage, type Summary } from '../api'
import { duration, tokens, tokensTitle, useNow } from '../lib/format'
import { StagePill } from './StagePill'

const GROUPS: { title: string; stages: Stage[] }[] = [
  { title: 'Running', stages: ACTIVE },
  { title: 'Needs answer', stages: ['question'] },
  { title: 'Queued', stages: ['queued'] },
  { title: 'Done', stages: ['done'] },
  { title: 'Rejected and failed', stages: ['rejected', 'failed'] },
]

type Props = { className: string; tickets: Summary[]; selected?: string | null; onPick: (id: string) => void }

/** The sidebar: tickets grouped by stage. */
export function TicketList({ className, tickets, selected, onPick }: Props) {
  const now = useNow() // one clock for every running ticket in the list
  return (
    <aside className={`shrink-0 overflow-y-auto border-r border-gray-200 ${className}`} aria-label="Tickets">
      {GROUPS.map((g) => {
        const items = tickets.filter((t) => g.stages.includes(t.stage))
        if (!items.length) return null
        return (
          <section key={g.title}>
            <h2 className="px-4 pt-4 pb-1 text-xs font-medium text-gray-500">
              {g.title} <span className="text-gray-400">{items.length}</span>
            </h2>
            {items.map((t) => (
              <TicketItem key={t.id} t={t} now={now} selected={t.id === selected} onClick={() => onPick(t.id)} />
            ))}
          </section>
        )
      })}
      <p className="p-4 text-xs text-gray-400">
        To add a ticket, drop a <code className="font-mono">.md</code> file into the inbox folder (
        <code className="font-mono">HANDOFF_INBOX</code>).
      </p>
    </aside>
  )
}

function TicketItem(props: { t: Summary; now: number; selected: boolean; onClick: () => void }) {
  const { t, now, selected, onClick } = props
  const live = ACTIVE.includes(t.stage)
  return (
    <button
      className={`block w-full px-4 py-2.5 text-left hover:bg-gray-50 ${selected ? 'bg-gray-100' : ''}`}
      aria-current={selected || undefined}
      onClick={onClick}
    >
      <span className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate font-mono text-gray-500">
          {t.id}
          {t.project && ` · ${t.project}`}
        </span>
        <StagePill stage={t.stage} />
      </span>
      <span className="mt-1 block truncate text-sm">{t.title}</span>
      <span className="mt-0.5 block text-xs text-gray-500" title={tokensTitle(t.tokens)}>
        {live && `${duration(now / 1000 - t.since)} · `}
        {t.round > 0 && `round ${t.round} · `}
        {tokens(t.tokens)}
      </span>
    </button>
  )
}
