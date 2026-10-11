import { diffLines } from 'diff'
import { parse, type Line } from '../lib/parseDiff'

const SIGN = { add: '+', del: '−', ctx: ' ', hunk: '' }
const ROW = { add: 'bg-green-50', del: 'bg-red-50', ctx: '', hunk: 'bg-gray-50 text-gray-500' }

/** Shows git diff output file by file, with line numbers. */
export function DiffView({ diff }: { diff: string }) {
  return (
    <div className="space-y-4">
      {parse(diff).map((f) => (
        <section key={f.path} className="overflow-hidden rounded-md border border-gray-200">
          <header className="flex justify-between gap-3 border-b border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs">
            <span className="truncate">{f.path}</span>
            <span>
              <span className="text-green-700">+{f.add}</span> <span className="text-red-700">−{f.del}</span>
            </span>
          </header>
          <div className="overflow-x-auto font-mono text-xs leading-5">
            {f.lines.map((l, i) => (
              <DiffRow key={i} line={l} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function DiffRow({ line: l }: { line: Line }) {
  if (l.kind === 'hunk') return <div className={`px-3 ${ROW.hunk}`}>{l.text}</div>
  return (
    <div className={`grid min-w-max grid-cols-[3rem_3rem_1.5rem_1fr] ${ROW[l.kind]}`}>
      <span className="pr-2 text-right text-gray-400 select-none">{l.old ?? ''}</span>
      <span className="pr-2 text-right text-gray-400 select-none">{l.new ?? ''}</span>
      <span className="text-center text-gray-500 select-none">{SIGN[l.kind]}</span>
      <span className="pr-3 whitespace-pre">{l.text || ' '}</span>
    </div>
  )
}

/** Shows an Edit tool call's old and new text as a line diff. */
export function EditDiff({ before, after }: { before: string; after: string }) {
  const lines = diffLines(before, after).flatMap((part) =>
    part.value
      .replace(/\n$/, '')
      .split('\n')
      .map((text) => ({ kind: part.added ? 'add' : part.removed ? 'del' : 'ctx', text }) as const),
  )
  return <CodeLines lines={lines} />
}

/** Lines with a +/− sign and no line numbers: Edit and Write tool calls. */
export function CodeLines({ lines, more = 0 }: { lines: readonly { kind: 'add' | 'del' | 'ctx'; text: string }[]; more?: number }) {
  return (
    <div className="overflow-x-auto rounded-md border border-gray-200 font-mono text-xs leading-5">
      {lines.map((l, i) => (
        <div key={i} className={`grid min-w-max grid-cols-[1.5rem_1fr] ${ROW[l.kind]}`}>
          <span className="text-center text-gray-500 select-none">{SIGN[l.kind]}</span>
          <span className="pr-3 whitespace-pre">{l.text || ' '}</span>
        </div>
      ))}
      {more > 0 && <div className="px-3 text-gray-500">… {more} more lines</div>}
    </div>
  )
}
