import { ACTIVE, STAGE_LABEL, type Stage } from '../api'

const COLOR: Record<Stage, string> = {
  queued: 'bg-gray-100 text-gray-600',
  triage: 'bg-blue-50 text-blue-700',
  coding: 'bg-blue-50 text-blue-700',
  checking: 'bg-blue-50 text-blue-700',
  review: 'bg-blue-50 text-blue-700',
  delivering: 'bg-blue-50 text-blue-700',
  done: 'bg-green-50 text-green-700',
  question: 'bg-amber-50 text-amber-800',
  rejected: 'bg-gray-100 text-gray-600',
  failed: 'bg-red-50 text-red-700',
}

/** The stage as a small colored label, with a pulsing dot while the ticket runs. */
export function StagePill({ stage }: { stage: Stage }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${COLOR[stage]}`}>
      {ACTIVE.includes(stage) && <span className="size-1.5 animate-pulse rounded-full bg-current" />}
      {STAGE_LABEL[stage]}
    </span>
  )
}
