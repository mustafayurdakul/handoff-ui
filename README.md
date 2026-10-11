# handoff-ui

The web UI for [handoff](../handoff): the ticket queue, each ticket's live feed (agent notes, files read, edits,
command output), its changes, plan and review. It answers the agent's questions and retries failed tickets.

React + TypeScript + Vite. It talks only to the handoff API, under `/api`, which Vite forwards to `HANDOFF_API`.

## Running

Start the handoff server first (`.venv/bin/handoff` in the handoff repository), then:

```sh
npm ci
cp .env.example .env     # HANDOFF_API, default http://127.0.0.1:8765
npm run dev              # http://127.0.0.1:5173, reloads on change
```

For a demo without the dev server: `npm run build && npm run preview` (same address, same forwarding).

## Layout

```
src/
  main.tsx              entry: fonts, styles, <App/>
  App.tsx               layout: ticket list beside the selected ticket; one screen at a time on phones
  api.ts                API types, polling, the live feed (SSE), POST
  styles.css            the whole stylesheet: one dark theme, phone layout below 760px
  components/
    TicketList.tsx      the sidebar, tickets grouped by stage
    TicketView.tsx      one ticket: header, tabs
    Stepper.tsx         progress through the five steps
    Banners.tsx         answer form, ready-to-merge note, error with Retry
    LiveFeed.tsx        the live feed
    DiffView.tsx        diffs: the Changes tab and Edit tool calls
    PlanReview.tsx      triage, the agent's summary, review
    AnsiLine.tsx        terminal colors in command output
    Welcome.tsx         the empty state
  lib/
    format.ts           token counts, times, a ticking clock
    parseDiff.ts        `git diff` output to files and numbered lines
```

## Checks

```sh
npm run lint
npm run build            # type-checks, then bundles into dist/
```
