import { useState } from 'react'
import { ACTIVE, usePoll, type Summary } from './api'
import { TicketList } from './components/TicketList'
import { TicketView } from './components/TicketView'
import { Welcome } from './components/Welcome'

export default function App() {
  const tickets = usePoll<Summary[]>('/api/tickets')
  const [picked, setPicked] = useState<string | null>(null)
  const [showList, setShowList] = useState(false) // narrow screens show either the list or one ticket

  const list = tickets ?? []
  const running = list.find((t) => ACTIVE.includes(t.stage))
  const latest = list.reduce<Summary | undefined>((a, t) => (!a || t.updated > a.updated ? t : a), undefined)
  // until a ticket is picked (or the pick is gone): the running ticket, else the most recently updated one
  const selected = list.some((t) => t.id === picked) ? picked : (running ?? latest)?.id

  return (
    <div className="app" data-view={showList || !selected ? 'list' : 'ticket'}>
      <header className="topbar">
        <span className="brand">
          <span className="logo" aria-hidden />
          handoff
        </span>
      </header>

      <div className="body">
        <TicketList
          tickets={list}
          selected={selected}
          onPick={(id) => {
            setPicked(id)
            setShowList(false)
          }}
        />
        <main className="main">
          {tickets === null ? (
            <div className="main-empty">Connecting to the server…</div>
          ) : selected ? (
            <TicketView key={selected} id={selected} onBack={() => setShowList(true)} />
          ) : (
            <Welcome />
          )}
        </main>
      </div>
    </div>
  )
}
