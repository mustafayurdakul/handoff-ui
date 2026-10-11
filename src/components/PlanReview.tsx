import type { ReactNode } from 'react'
import Markdown from 'react-markdown'
import type { Ticket } from '../api'

const DECISION = {
  go: { label: 'Ready to implement', color: 'bg-green-50 text-green-700' },
  question: { label: 'Has questions', color: 'bg-amber-50 text-amber-800' },
  reject: { label: 'Rejected', color: 'bg-gray-100 text-gray-600' },
}
const SEVERITY = { blocker: 'bg-red-50 text-red-700', minor: 'bg-gray-100 text-gray-600' }

/** Triage's decision and plan, the agent's summary of its changes, and the review. */
export function PlanReview({ t }: { t: Ticket }) {
  const decision = t.triage && DECISION[t.triage.decision]
  return (
    <div className="max-w-3xl space-y-4 text-sm">
      {t.triage && decision && (
        <Card title="Triage" pill={<Pill color={decision.color}>{decision.label}</Pill>}>
          <Md>{t.triage.summary}</Md>
          {t.triage.plan && (
            <>
              <h3 className="font-semibold">Plan</h3>
              <Md>{t.triage.plan}</Md>
            </>
          )}
        </Card>
      )}
      {t.work && (
        <Card title="Changes">
          <Md>{t.work}</Md>
        </Card>
      )}
      {t.review && (
        <Card
          title="Review"
          pill={
            t.review.approved ? (
              <Pill color={DECISION.go.color}>Approved</Pill>
            ) : (
              <Pill color={SEVERITY.blocker}>Changes requested</Pill>
            )
          }
        >
          <Md>{t.review.summary}</Md>
          {t.tests && (
            <p className="whitespace-pre-wrap text-gray-600">
              <strong className="text-gray-900">Test validity:</strong> {t.tests}
            </p>
          )}
          {t.review.findings.length > 0 && (
            <ul className="space-y-2">
              {t.review.findings.map((f, i) => (
                <li key={i} className="space-y-1">
                  <Pill color={SEVERITY[f.severity]}>{f.severity}</Pill> <code className="font-mono text-xs">{f.file}</code>
                  <Md>{f.message}</Md>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}

function Card({ title, pill, children }: { title: string; pill?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-md border border-gray-200 p-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{title}</h2>
        {pill}
      </header>
      {children}
    </section>
  )
}

function Pill({ color, children }: { color: string; children: ReactNode }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{children}</span>
}

function Md({ children }: { children: string }) {
  return (
    <div className="md">
      <Markdown>{children}</Markdown>
    </div>
  )
}
