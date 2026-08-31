'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { QrCode, ArrowRight, Calendar } from 'lucide-react'
import { eventsApi } from '@/lib/api/events'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate } from '@/lib/utils'

export default function OrganizerCheckInPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    eventsApi.myEvents({ status: 'published', limit: 50 })
      .then((r) => setEvents(r.data?.events ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ORGANIZER</div>
          <h1>Check-in</h1>
        </div>
      </header>

      <div className="page-content max-w-2xl">
        <p className="text-sm text-[var(--muted-foreground)] mb-8">
          Select a published event to open its QR scanner. Scan attendee tickets at the door to mark them as checked in.
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="panel flex items-center gap-4">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-48" />
                  <div className="skeleton h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={QrCode}
            title="No published events"
            description="Publish an event first to enable QR check-in."
            action={{ label: 'Create event', href: '/organizer/events/new' }}
          />
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <Link
                key={event._id}
                href={`/organizer/events/${event._id}/scanner`}
                className="panel flex items-center gap-4 hover:border-[var(--primary)] transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0 group-hover:bg-[rgba(215,243,106,0.1)]">
                  <QrCode className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{event.title}</p>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {formatDate(event.startAt)}
                    {event.venue?.city && <span>· {event.venue.city}</span>}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
