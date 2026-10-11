import { useState, type FormEvent } from 'react'
import Markdown from 'react-markdown'
import { post, type Ticket } from '../api'

/** The one thing to know or do about the ticket now: answer, merge, or retry. */
export function Banners({ t }: { t: Ticket }) {
  if (t.stage === 'question') return <AnswerForm id={t.id} questions={t.questions ?? []} />
  if (t.stage === 'done' && t.mr)
    return (
      <div className="banner good">
        <strong>Ready to merge.</strong>{' '}
        <a href={t.mr} target="_blank" rel="noreferrer">
          Open the merge request
        </a>{' '}
        (branch <code>{t.branch}</code>).
      </div>
    )
  if (t.stage === 'done' && t.branch)
    return (
      <div className="banner good">
        <strong>Ready to merge.</strong> The changes are on branch <code>{t.branch}</code> of {t.project}. To inspect
        them there: <code>git diff {t.base ?? 'main'}...{t.branch}</code>
      </div>
    )
  if (t.stage === 'failed')
    return (
      <div className="banner bad">
        <div className="banner-row">
          <strong>Stopped.</strong>
          <Retry id={t.id} />
        </div>
        <pre className="mono">{t.error}</pre>
      </div>
    )
  if (t.stage === 'rejected')
    return (
      <div className="banner neutral">
        <div className="banner-row">
          <strong>Ticket rejected.</strong>
          <Retry id={t.id} />
        </div>
        {t.triage && (
          <div className="md">
            <Markdown>{t.triage.summary}</Markdown>
          </div>
        )}
        {t.error && <pre className="mono">{t.error}</pre>}
      </div>
    )
  return null
}

function AnswerForm({ id, questions }: { id: string; questions: string[] }) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(await post(`/api/tickets/${id}/answer`, { text }))
    setBusy(false)
  }

  return (
    <form className="banner warn answer" onSubmit={submit}>
      <strong>The agent has questions before it starts:</strong>
      <ol className="md">
        {questions.map((q, i) => (
          <li key={i}>
            <Markdown>{q}</Markdown>
          </li>
        ))}
      </ol>
      <label htmlFor="answer">Your answer</label>
      <textarea
        id="answer"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Answer all the questions in one text. It is added to the ticket, and the ticket is triaged again."
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="banner-row">
        <span />
        <button className="btn primary" disabled={busy || !text.trim()}>
          Send and continue
        </button>
      </div>
    </form>
  )
}

function Retry({ id }: { id: string }) {
  const [error, setError] = useState<string | null>(null)
  return (
    <span className="retry">
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
      <button className="btn" onClick={async () => setError(await post(`/api/tickets/${id}/retry`))}>
        Retry
      </button>
    </span>
  )
}
