'use client'

import { useEffect, useState } from 'react'
import { Search, Star, StarOff } from 'lucide-react'
import { adminApi } from '@/lib/api/analytics'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, getEventStatusBadge } from '@/lib/utils'
import { toast } from 'sonner'
import { CalendarDays } from 'lucide-react'
import Link from 'next/link'

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)

  const load = (q?: string, s?: string) => {
    setLoading(true)
    adminApi.listEvents({ search: q ?? search, status: s ?? status, limit: 100 })
      .then((r) => setEvents(r.data?.events ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleFeature = async (id: string, isFeatured: boolean) => {
    setActionId(id)
    try {
      isFeatured ? await adminApi.unfeatureEvent(id) : await adminApi.featureEvent(id)
      load()
      toast.success(isFeatured ? 'Removed from featured' : 'Event featured!')
    } catch (err: any) { toast.error(err?.message ?? 'Failed') }
    finally { setActionId(null) }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ADMIN</div>
          <h1>Events</h1>
        </div>
      </header>

      <div className="page-content">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={(e) => { e.preventDefault(); load() }} className="flex gap-2 flex-1">
            <label className="flex items-center gap-2 input-field flex-1" style={{ height: 42 }}>
              <Search className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events…"
                className="flex-1 bg-transparent outline-none text-xs"
              />
            </label>
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); load(search, e.target.value) }}
            className="input-field text-xs"
            style={{ height: 42, minWidth: 140 }}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {loading ? (
          <div className="panel">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--border)]">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2"><div className="skeleton h-3 w-48" /><div className="skeleton h-2.5 w-32" /></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No events found" />
        ) : (
          <div className="panel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Organizer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const badge = getEventStatusBadge(ev.status)
                  return (
                    <tr key={ev._id}>
                      <td>
                        <p className="text-xs font-medium max-w-[200px] truncate">{ev.title}</p>
                        {ev.venue?.city && <p className="text-xs text-[var(--muted-foreground)]">{ev.venue.city}</p>}
                      </td>
                      <td>
                        <p className="text-xs">{ev.organizerId?.name ?? '—'}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{ev.organizerId?.email}</p>
                      </td>
                      <td className="text-xs text-[var(--muted-foreground)]">
                        {ev.startAt ? formatDate(ev.startAt) : '—'}
                      </td>
                      <td>
                        <span className={`badge ${badge.cls}`}><span className="badge-dot" />{badge.label}</span>
                      </td>
                      <td>
                        {ev.isFeatured
                          ? <Badge variant="warning">Featured</Badge>
                          : <span className="text-xs text-[var(--muted-foreground)]">—</span>
                        }
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Link href={`/events/${ev.slug}`} className="btn btn-outline btn-sm">View</Link>
                          <button
                            onClick={() => handleFeature(ev._id, ev.isFeatured)}
                            disabled={actionId === ev._id}
                            className="btn btn-outline btn-sm gap-1.5"
                            title={ev.isFeatured ? 'Remove from featured' : 'Feature event'}
                          >
                            {ev.isFeatured
                              ? <StarOff className="w-3.5 h-3.5" />
                              : <Star className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>
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
