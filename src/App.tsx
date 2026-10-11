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
  const listView = showList || !selected

  return (
    <div className="flex h-dvh flex-col bg-white text-gray-900 antialiased">
      <header className="flex h-12 shrink-0 items-center border-b border-gray-200 px-4 font-semibold">handoff</header>
      <div className="flex min-h-0 flex-1">
        <TicketList
          className={listView ? 'w-full md:w-80' : 'hidden md:block md:w-80'}
          tickets={list}
          selected={selected}
          onPick={(id) => {
            setPicked(id)
            setShowList(false)
          }}
        />
        <main className={`min-w-0 flex-1 ${listView ? 'hidden md:block' : ''}`}>
          {tickets === null ? (
            <p className="p-6 text-sm text-gray-500">Connecting to the server…</p>
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
