import type { Stage, Ticket } from '../api'

const STEPS: { stage: Stage; label: string }[] = [
  { stage: 'triage', label: 'Triage' },
  { stage: 'coding', label: 'Coding' },
  { stage: 'checking', label: 'Checks' },
  { stage: 'review', label: 'Review' },
  { stage: 'delivering', label: 'Delivery' },
]
const ORDER = STEPS.map((s) => s.stage)

type StepState = 'done' | 'active' | 'pending' | 'wait' | 'stop' | 'fail'
const ICON: Record<StepState, string> = { done: '✓', active: '', pending: '', wait: '?', stop: '✕', fail: '!' }

/** The state of each step for the ticket's current stage. */
function stepStates(t: Ticket): StepState[] {
  const upTo = (i: number, last: StepState) => ORDER.map((_, j) => (j < i ? 'done' : j === i ? last : 'pending'))
  switch (t.stage) {
    case 'queued':
      return ORDER.map(() => 'pending')
    case 'done':
      return ORDER.map(() => 'done')
    case 'question':
      return upTo(0, 'wait')
    case 'rejected':
      return upTo(0, 'stop')
    case 'failed':
      return upTo(Math.max(0, ORDER.indexOf(t.failed_stage ?? 'triage')), 'fail')
    default:
      return upTo(ORDER.indexOf(t.stage), 'active')
  }
}

/** Progress through the five pipeline steps. */
export function Stepper({ t }: { t: Ticket }) {
  const states = stepStates(t)
  return (
    <ol className="stepper">
      {STEPS.map((s, i) => (
        <li key={s.stage} className={`step ${states[i]}`}>
          <span className="step-dot" aria-hidden>
            {ICON[states[i]]}
          </span>
          <span className="step-label">
            {s.label}
            {s.stage === 'coding' && t.round > 0 && (
              <span className="step-sub">
                {' '}
                round {t.round}/{t.rounds}
              </span>
            )}
          </span>
        </li>
      ))}
    </ol>
  )
}
