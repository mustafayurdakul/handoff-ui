import Markdown from 'react-markdown'
import type { Ticket } from '../api'

const DECISION = { go: 'Ready to implement', question: 'Has questions', reject: 'Rejected' }

/** Triage's decision and plan, the agent's summary of its changes, and the review. */
export function PlanReview({ t }: { t: Ticket }) {
  return (
    <div className="scroll pad stack">
      {t.triage && (
        <section className="card">
          <header className="card-head">
            <h2>Triage</h2>
            <span className={`pill decision-${t.triage.decision}`}>{DECISION[t.triage.decision]}</span>
          </header>
          <div className="md">
            <Markdown>{t.triage.summary}</Markdown>
          </div>
          {t.triage.plan && (
            <>
              <h3>Plan</h3>
              <div className="md">
                <Markdown>{t.triage.plan}</Markdown>
              </div>
            </>
          )}
        </section>
      )}
      {t.work && (
        <section className="card">
          <header className="card-head">
            <h2>Changes</h2>
          </header>
          <div className="md">
            <Markdown>{t.work}</Markdown>
          </div>
        </section>
      )}
      {t.review && (
        <section className="card">
          <header className="card-head">
            <h2>Review</h2>
            <span className={`pill ${t.review.approved ? 'decision-go' : 'decision-reject'}`}>
              {t.review.approved ? 'Approved' : 'Changes requested'}
            </span>
          </header>
          <div className="md">
            <Markdown>{t.review.summary}</Markdown>
          </div>
          {t.tests && (
            <p className="tests-note">
              <strong>Test validity:</strong> {t.tests}
            </p>
          )}
          {t.review.findings.length > 0 && (
            <ul className="findings">
              {t.review.findings.map((f, i) => (
                <li key={i}>
                  <span className={`badge sev-${f.severity}`}>{f.severity}</span>
                  <code>{f.file}</code>
                  <div className="md">
                    <Markdown>{f.message}</Markdown>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
