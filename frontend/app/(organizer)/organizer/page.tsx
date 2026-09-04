'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ArrowUpRight, Calendar, TrendingUp, Ticket, DollarSign } from 'lucide-react'
import { analyticsApi } from '@/lib/api/analytics'
import { eventsApi } from '@/lib/api/events'
import { useAuth } from '@/lib/auth-context'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatCurrency, getEventStatusBadge } from '@/lib/utils'

export default function OrganizerOverviewPage() {
  const { user } = useAuth()
  const [overview, setOverview] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.organizerOverview(),
      eventsApi.myEvents({ limit: 5, sort: 'newest' }),
    ]).then(([ovRes, evRes]) => {
      setOverview(ovRes.data)
      const ed = evRes.data as any
      setEvents(ed?.events ?? ed ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ORGANIZER DASHBOARD</div>
          <h1>Overview</h1>
        </div>
        <div className="topbar-actions">
          <Link href="/organizer/events/new" className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4" /> Create event
          </Link>
        </div>
      </header>

      <div className="page-content">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Calendar, label: 'Total events', value: overview?.events?.total ?? 0, sub: `${overview?.events?.byStatus?.published ?? 0} published`, color: 'text-[var(--primary)]' },
            { icon: Ticket, label: 'Tickets sold', value: overview?.ticketsSold ?? 0, sub: 'All time', color: 'text-blue-400' },
            { icon: DollarSign, label: 'Gross revenue', value: formatCurrency(overview?.revenue?.gross ?? 0, 'ETB'), sub: 'Paid orders', color: 'text-green-400', isString: true },
            { icon: TrendingUp, label: 'Upcoming events', value: overview?.upcomingEvents?.length ?? 0, sub: 'In the next 30 days', color: 'text-purple-400' },
          ].map(({ icon: Icon, label, value, sub, color, isString }) => (
            <div key={label} className="panel stat-card">
              <div className={`w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="stat-value" style={{ fontSize: isString ? 20 : 36 }}>{isString ? value : loading ? '—' : value}</p>
              <p className="stat-label">{label}</p>
              <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Events table */}
        <div className="panel mb-6">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">YOUR EVENTS</span>
              <h2>Recent events</h2>
            </div>
            <Link href="/organizer/events" className="text-link">View all <ArrowUpRight className="w-3 h-3" /></Link>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 border-t border-[var(--border)] pt-4">
                  <div className="skeleton h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2"><div className="skeleton h-3 w-48" /><div className="skeleton h-2.5 w-32" /></div>
                  <div className="skeleton h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-[var(--muted-foreground)] mb-3">No events yet.</p>
              <Link href="/organizer/events/new" className="btn btn-primary btn-sm">Create your first event</Link>
            </div>
          ) : (
            <div>
              {events.map((event) => {
                const badge = getEventStatusBadge(event.status)
                return (
                  <Link
                    key={event._id}
                    href={`/organizer/events/${event._id}/edit`}
                    className="flex items-center gap-4 py-3.5 border-t border-[var(--border)] hover:bg-[var(--muted)] -mx-6 px-6 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {event.title?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{event.title}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {event.startAt ? formatDate(event.startAt) : '—'}
                        {event.venue?.city && ` · ${event.venue.city}`}
                      </p>
                    </div>
                    <span className={`badge ${badge.cls}`}><span className="badge-dot" />{badge.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
