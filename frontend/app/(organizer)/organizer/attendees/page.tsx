'use client'

import { useEffect, useState } from 'react'
import { Users, Search, QrCode, Download } from 'lucide-react'
import { ordersApi } from '@/lib/api/orders'
import { eventsApi } from '@/lib/api/events'
import { ticketsApi } from '@/lib/api/tickets'
import { EmptyState } from '@/components/ui/empty-state'
import { Badge } from '@/components/ui/badge'
import { formatDate, getTicketStatusBadge } from '@/lib/utils'

export default function OrganizerAttendeesPage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [attendees, setAttendees] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    eventsApi.myEvents({ limit: 100 })
      .then((r) => {
        const evs = r.data?.events ?? r.data ?? []
        console.log('[Attendees] Loaded events:', evs)
        setEvents(evs)
        if (evs.length > 0) {
          console.log('[Attendees] Setting selected event to:', evs[0]._id)
          setSelectedEvent(evs[0]._id)
        }
      })
      .catch((err) => {
        console.error('[Attendees] Error loading events:', err)
      })
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    console.log('[Attendees] Fetching tickets for event:', selectedEvent)
    setLoading(true)
    ticketsApi.byEvent(selectedEvent, { limit: 1000 })
      .then((r) => {
        console.log('[Attendees] Tickets response:', r)
        const tickets = r.data?.tickets ?? r.data ?? []
        setAttendees(Array.isArray(tickets) ? tickets : [])
      })
      .catch((err) => {
        console.error('[Attendees] Error fetching tickets:', err)
        setAttendees([])
      })
      .finally(() => setLoading(false))
  }, [selectedEvent])

  const filtered = Array.isArray(attendees) ? attendees.filter((a) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      a.ownerId?.name?.toLowerCase().includes(q) ||
      a.ownerId?.email?.toLowerCase().includes(q) ||
      a.ticketCode?.toLowerCase().includes(q)
    )
  }) : []

  const exportCSV = () => {
    if (filtered.length === 0) return
    const rows = [
      ['Name', 'Email', 'Ticket Type', 'Ticket #', 'Purchase Date', 'Status', 'Check-in'],
      ...filtered.map((t) => [
        t.ownerId?.name ?? '',
        t.ownerId?.email ?? '',
        t.ticketTypeName ?? '',
        t.ticketCode ?? '',
        t.createdAt ? formatDate(t.createdAt) : '',
        t.status ?? '',
        t.status === 'used' ? 'Yes' : 'No',
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `attendees-${selectedEvent}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ORGANIZER</div>
          <h1>Attendees</h1>
        </div>
      </header>

      <div className="page-content">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {events.length > 0 && (
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="input-field text-xs"
              style={{ height: 42, minWidth: 220 }}
            >
              {events.map((e) => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2 input-field flex-1" style={{ height: 42 }}>
            <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search attendees…"
              className="flex-1 bg-transparent outline-none text-xs"
            />
          </label>
        </div>

        {loading ? (
          <div className="panel">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--border)]">
                <div className="skeleton w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-40" />
                  <div className="skeleton h-2.5 w-28" />
                </div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No attendees found" description="Ticket holders for this event will appear here." />
        ) : (
          <div className="panel overflow-x-auto">
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-xs text-[var(--muted-foreground)]">{filtered.length} attendee{filtered.length !== 1 ? 's' : ''}</p>
              <button
                onClick={exportCSV}
                className="btn btn-outline btn-sm gap-2"
                aria-label="Export attendees as CSV"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Attendee</th>
                  <th>Ticket type</th>
                  <th>Ticket #</th>
                  <th>Purchase date</th>
                  <th>Status</th>
                  <th>Check-in</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => {
                  const statusBadge = getTicketStatusBadge(ticket.status)
                  return (
                    <tr key={ticket._id}>
                      <td>
                        <p className="text-xs font-medium">{ticket.ownerId?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{ticket.ownerId?.email}</p>
                      </td>
                      <td className="text-xs">{ticket.ticketTypeName ?? ticket.ticketTypeId?.name ?? '—'}</td>
                      <td className="font-mono text-xs">{ticket.ticketCode}</td>
                      <td className="text-xs text-[var(--muted-foreground)]">
                        {ticket.createdAt ? formatDate(ticket.createdAt) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${statusBadge.cls}`}>
                          <span className="badge-dot" />{statusBadge.label}
                        </span>
                      </td>
                      <td>
                        {ticket.status === 'used' ? (
                          <span className="badge badge-success">
                            <QrCode className="w-3 h-3 mr-1" /> Checked in
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--muted-foreground)]">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
