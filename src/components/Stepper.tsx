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
// `say` is the state for screen readers, which skip the icon
const LOOK: Record<StepState, { icon: string; dot: string; text: string; say: string }> = {
  done: { icon: '✓', dot: 'bg-green-600 text-white', text: 'text-gray-900', say: 'done' },
  active: { icon: '', dot: 'bg-blue-600 animate-pulse', text: 'font-medium text-gray-900', say: 'in progress' },
  pending: { icon: '', dot: 'border border-gray-300', text: 'text-gray-400', say: 'not started' },
  wait: { icon: '?', dot: 'bg-amber-500 text-white', text: 'font-medium text-gray-900', say: 'waiting for an answer' },
  stop: { icon: '✕', dot: 'bg-gray-500 text-white', text: 'font-medium text-gray-900', say: 'stopped' },
  fail: { icon: '!', dot: 'bg-red-600 text-white', text: 'font-medium text-gray-900', say: 'failed' },
}

/** The state of each step for the ticket's current stage. */
function stepStates(t: Ticket): StepState[] {
  const upTo = (i: number, last: StepState) => ORDER.map((_, j) => (j < i ? 'done' : j === i ? last : 'pending'))
  // where a failed or rejected ticket stopped; triage rejections carry no failed_stage
  const stoppedAt = Math.max(0, ORDER.indexOf(t.failed_stage ?? 'triage'))
  switch (t.stage) {
    case 'queued':
      return ORDER.map(() => 'pending')
    case 'done':
      return ORDER.map(() => 'done')
    case 'question':
      return upTo(0, 'wait')
    case 'rejected':
      return upTo(stoppedAt, 'stop')
    case 'failed':
      return upTo(stoppedAt, 'fail')
    default:
      return upTo(ORDER.indexOf(t.stage), 'active')
  }
}

/** Progress through the five pipeline steps. */
export function Stepper({ t }: { t: Ticket }) {
  const states = stepStates(t)
  return (
    <ol className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
      {STEPS.map((s, i) => {
        const look = LOOK[states[i]]
        return (
          <li key={s.stage} className={`flex items-center gap-1.5 ${look.text}`}>
            <span className={`grid size-4 place-items-center rounded-full text-[10px] ${look.dot}`} aria-hidden>
              {look.icon}
            </span>
            {s.label}
            <span className="sr-only">: {look.say}</span>
            {s.stage === 'coding' && t.round > 0 && (
              <span className="text-gray-500">
                {' '}
                {t.round}/{t.rounds}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
