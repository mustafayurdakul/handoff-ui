/** Shown when there are no tickets yet. */
export function Welcome() {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-6 py-16 text-sm text-gray-600">
      <h1 className="text-xl font-semibold text-gray-900">The queue is empty</h1>
      <p>
        Drop a ticket file into the inbox folder. handoff triages it, writes the code, tests it, reviews it and delivers
        it on a branch. You can follow every step here, live.
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        <li>
          Write a markdown file. The <code className="font-mono">project:</code> line in its front matter names the
          repository it belongs to.
        </li>
        <li>
          Save it in the inbox folder, <code className="font-mono">HANDOFF_INBOX</code> (default:{' '}
          <code className="font-mono">inbox/</code> in the handoff folder).
        </li>
      </ol>
      <pre className="rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs">cp demo/tickets/APP-1.md inbox/</pre>
    </div>
  )
}
