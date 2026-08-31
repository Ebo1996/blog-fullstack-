'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronRight, X } from 'lucide-react'
import { rsvpApi } from '@/lib/api/tickets'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, getEventColorClass } from '@/lib/utils'
import { toast } from 'sonner'

export default function RSVPsPage() {
  const [rsvps, setRsvps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    rsvpApi.myRsvps()
      .then((r) => setRsvps(r.data?.registrations ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCancel = async (eventId: string) => {
    setCancelling(eventId)
    try {
      await rsvpApi.cancel(eventId)
      toast.success('RSVP cancelled')
      setRsvps((prev) => prev.filter((r) => r.eventId?._id !== eventId))
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to cancel RSVP')
    } finally {
      setCancelling(null)
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">YOUR EVENTS</div>
          <h1>RSVPs</h1>
        </div>
      </header>

      <div className="page-content">
        <p className="text-xs text-[var(--muted-foreground)] mb-6">Events you've said yes to.</p>

        {loading ? (
          <div className="panel space-y-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-[var(--border)]">
                <div className="skeleton w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2"><div className="skeleton h-3 w-48" /><div className="skeleton h-2.5 w-32" /></div>
              </div>
            ))}
          </div>
        ) : rsvps.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No RSVPs yet"
            description="RSVP to free events and they'll appear here."
            action={{ label: 'Browse events', href: '/events' }}
          />
        ) : (
          <div className="panel">
            {rsvps.map((rsvp, i) => {
              const event = rsvp.eventId ?? {}
              const colorClass = getEventColorClass(i)
              const isPast = event.startAt && new Date(event.startAt) < new Date()
              return (
                <div key={rsvp._id} className={`flex items-center gap-4 py-4 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                  <div className={`event-art w-12 h-12 rounded-lg text-sm font-bold flex-shrink-0 ${colorClass}`}>
                    <span className="relative z-10">{event.title?.slice(0, 2).toUpperCase() ?? 'EV'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{event.title ?? 'Event'}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {event.startAt ? formatDate(event.startAt) : '—'}
                      {event.venue?.city && ` · ${event.venue.city}`}
                    </p>
                  </div>
                  <Badge variant={isPast ? 'neutral' : 'success'} dot>
                    {isPast ? 'Past' : 'Going'}
                  </Badge>
                  {!isPast && (
                    <button
                      onClick={() => handleCancel(event._id)}
                      disabled={cancelling === event._id}
                      className="icon-btn text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                      aria-label="Cancel RSVP"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <Link href={`/events/${event.slug}`} className="btn btn-outline btn-sm flex-shrink-0">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
