import { useState, type FormEvent, type ReactNode } from 'react'
import Markdown from 'react-markdown'
import { post, type Ticket } from '../api'

const TONE = {
  good: 'border-green-200 bg-green-50',
  bad: 'border-red-200 bg-red-50',
  warn: 'border-amber-200 bg-amber-50',
  neutral: 'border-gray-200 bg-gray-50',
}

function Banner({ tone, children }: { tone: keyof typeof TONE; children: ReactNode }) {
  return <div className={`mx-6 mb-3 space-y-2 rounded-md border px-4 py-3 text-sm ${TONE[tone]}`}>{children}</div>
}

/** The one thing to know or do about the ticket now: answer, merge, or retry. */
export function Banners({ t }: { t: Ticket }) {
  if (t.stage === 'question') return <AnswerForm id={t.id} questions={t.questions ?? []} />
  if (t.stage === 'done' && t.mr)
    return (
      <Banner tone="good">
        <strong>Ready to merge.</strong>{' '}
        <a className="underline" href={t.mr} target="_blank" rel="noreferrer">
          Open the merge request
        </a>{' '}
        (branch <code className="font-mono">{t.branch}</code>).
      </Banner>
    )
  if (t.stage === 'done' && t.branch)
    return (
      <Banner tone="good">
        <strong>Ready to merge.</strong> The changes are on branch <code className="font-mono">{t.branch}</code> of{' '}
        {t.project}. To inspect them there:{' '}
        <code className="font-mono">
          git diff {t.base ?? 'main'}...{t.branch}
        </code>
      </Banner>
    )
  if (t.stage === 'failed')
    return (
      <Banner tone="bad">
        <div className="flex items-center justify-between gap-3">
          <strong>Stopped.</strong>
          <Retry id={t.id} />
        </div>
        <pre className="overflow-x-auto font-mono text-xs whitespace-pre-wrap">{t.error}</pre>
      </Banner>
    )
  if (t.stage === 'rejected')
    return (
      <Banner tone="neutral">
        <div className="flex items-center justify-between gap-3">
          <strong>Ticket rejected.</strong>
          <Retry id={t.id} />
        </div>
        {t.triage && (
          <div className="md">
            <Markdown>{t.triage.summary}</Markdown>
          </div>
        )}
        {t.error && <pre className="overflow-x-auto font-mono text-xs whitespace-pre-wrap">{t.error}</pre>}
      </Banner>
    )
  return null
}

/** POSTs once. After a success the button stays disabled until the next poll replaces the banner. */
function usePost(url: string) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const send = async (body?: unknown) => {
    setBusy(true)
    const err = await post(url, body)
    setError(err)
    if (err) setBusy(false)
  }
  return { busy, error, send }
}

function AnswerForm({ id, questions }: { id: string; questions: string[] }) {
  const [text, setText] = useState('')
  const { busy, error, send } = usePost(`/api/tickets/${id}/answer`)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    send({ text })
  }

  return (
    <Banner tone="warn">
      <form className="space-y-2" onSubmit={submit}>
        <strong>The agent has questions before it starts:</strong>
        <ol className="list-decimal space-y-1 pl-5">
          {questions.map((q, i) => (
            <li key={i} className="md">
              <Markdown>{q}</Markdown>
            </li>
          ))}
        </ol>
        <label className="block font-medium" htmlFor="answer">
          Your answer
        </label>
        <textarea
          id="answer"
          className="block w-full rounded-md border border-gray-300 bg-white p-2"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Answer all the questions in one text. It is added to the ticket, and the ticket is triaged again."
        />
        {error && (
          <p className="text-red-700" role="alert">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <button className={BUTTON} disabled={busy || !text.trim()}>
            Send and continue
          </button>
        </div>
      </form>
    </Banner>
  )
}

function Retry({ id }: { id: string }) {
  const { busy, error, send } = usePost(`/api/tickets/${id}/retry`)
  return (
    <span className="flex items-center gap-3">
      {error && (
        <span className="text-red-700" role="alert">
          {error}
        </span>
      )}
      <button className={BUTTON} disabled={busy} onClick={() => send()}>
        Retry
      </button>
    </span>
  )
}

const BUTTON =
  'rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-40'
