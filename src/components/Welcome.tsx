/** Shown when there are no tickets yet. */
export function Welcome() {
  return (
    <div className="welcome">
      <h1>The queue is empty</h1>
      <p>
        Drop a ticket file into the inbox folder. handoff triages it, writes the code, tests it, reviews it and delivers
        it on a branch. You can follow every step here, live.
      </p>
      <ol>
        <li>
          Write a markdown file. The <code>project:</code> line in its front matter names the repository it belongs to.
        </li>
        <li>
          Save it in the inbox folder, <code>HANDOFF_INBOX</code> (default: <code>inbox/</code> in the handoff folder).
        </li>
      </ol>
      <pre className="mono">cp demo/tickets/APP-1.md inbox/</pre>
    </div>
  )
}
