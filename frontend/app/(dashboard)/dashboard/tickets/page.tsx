'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { QrCode, Search } from 'lucide-react'
import { ticketsApi } from '@/lib/api/tickets'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, getTicketStatusBadge, getEventColorClass } from '@/lib/utils'

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ticketsApi.list({ limit: 50 })
      .then((r) => {
        const d = r.data as any
        setTickets(d?.tickets ?? d ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">YOUR COLLECTION</div>
          <h1>My tickets</h1>
        </div>
      </header>
      <div className="page-content">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs text-[var(--muted-foreground)]">Everything you need for the events you're going to.</p>
          <Link href="/events" className="btn btn-outline btn-sm gap-2">
            <Search className="w-3.5 h-3.5" /> Find events
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ticket-card">
                <div className="skeleton ticket-card-art" />
                <div className="ticket-card-info space-y-3"><div className="skeleton h-3 w-16" /><div className="skeleton h-6 w-40" /></div>
              </div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState icon={QrCode} title="No tickets yet" description="Purchase tickets to events and they'll appear here." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tickets.map((ticket, i) => {
              const badge = getTicketStatusBadge(ticket.status)
              const colorClass = getEventColorClass(i)
              return (
                <Link key={ticket._id} href={`/dashboard/tickets/${ticket._id}`} className="ticket-card relative">
                  <div className={`ticket-card-art event-art ${colorClass}`} style={{ fontSize: 32 }}>
                    <span className="relative z-10">{ticket.eventId?.title?.split(' ').map((w: string) => w[0]).join('').slice(0, 3) ?? 'EV'}</span>
                  </div>
                  <div className="ticket-card-info">
                    <span className={`badge ${badge.cls}`}><span className="badge-dot" />{badge.label}</span>
                    <h3 className="ticket-card-title line-clamp-2">{ticket.eventId?.title ?? 'Event'}</h3>
                    <p className="ticket-card-meta">
                      {ticket.eventId?.startAt ? formatDate(ticket.eventId.startAt) : '—'}<br />
                      {ticket.ticketTypeName ?? ticket.ticketTypeId?.name}<br />
                      <span className="font-mono text-[10px]">{ticket.ticketCode}</span>
                    </p>
                  </div>
                  <QrCode className="absolute bottom-4 right-4 w-5 h-5 text-[var(--muted-foreground)] opacity-60" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
