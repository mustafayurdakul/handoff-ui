import { diffLines } from 'diff'
import { parse } from '../lib/parseDiff'

const SIGN = { add: '+', del: '−', ctx: ' ', hunk: '' }

/** Shows git diff output file by file, with line numbers. */
export function DiffView({ diff }: { diff: string }) {
  return (
    <div className="diff-files">
      {parse(diff).map((f) => (
        <section key={f.path} className="diff-file">
          <header>
            <span className="mono">{f.path}</span>
            <span className="diff-count">
              <span className="plus">+{f.add}</span> <span className="minus">−{f.del}</span>
            </span>
          </header>
          <div className="diff-body mono">
            {f.lines.map((l, i) =>
              l.kind === 'hunk' ? (
                <div key={i} className="dl hunk">
                  {l.text}
                </div>
              ) : (
                <div key={i} className={`dl ${l.kind}`}>
                  <span className="ln">{l.old ?? ''}</span>
                  <span className="ln">{l.new ?? ''}</span>
                  <span className="sign">{SIGN[l.kind]}</span>
                  <span className="code">{l.text || ' '}</span>
                </div>
              ),
            )}
          </div>
        </section>
      ))}
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

export function CodeLines({ lines, more = 0 }: { lines: readonly { kind: 'add' | 'del' | 'ctx'; text: string }[]; more?: number }) {
  return (
    <div className="diff-body mono compact">
      {lines.map((l, i) => (
        <div key={i} className={`dl ${l.kind}`}>
          <span className="sign">{SIGN[l.kind]}</span>
          <span className="code">{l.text || ' '}</span>
        </div>
      ))}
      {more > 0 && <div className="dl more">… {more} more lines</div>}
    </div>
  )
}
