'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit, Eye, MoreHorizontal, Zap, ZapOff, XCircle, Copy } from 'lucide-react'
import { eventsApi } from '@/lib/api/events'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, getEventStatusBadge } from '@/lib/utils'
import { toast } from 'sonner'

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    eventsApi.myEvents({ limit: 50, sort: 'newest' })
      .then((r) => setEvents(r.data?.events ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handlePublish = async (id: string) => {
    setActionId(id)
    try { await eventsApi.publish(id); load(); toast.success('Event published!') }
    catch (err: any) { toast.error(err?.message ?? 'Failed to publish') }
    finally { setActionId(null) }
  }

  const handleUnpublish = async (id: string) => {
    setActionId(id)
    try { await eventsApi.unpublish(id); load(); toast.success('Event unpublished') }
    catch (err: any) { toast.error(err?.message ?? 'Failed') }
    finally { setActionId(null) }
  }

  const handleDuplicate = async (id: string) => {
    setActionId(id)
    try { await eventsApi.duplicate(id); load(); toast.success('Event duplicated') }
    catch (err: any) { toast.error(err?.message ?? 'Failed') }
    finally { setActionId(null) }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this event? This will notify all ticket holders.')) return
    setActionId(id)
    try { await eventsApi.cancel(id); load(); toast.success('Event cancelled') }
    catch (err: any) { toast.error(err?.message ?? 'Failed') }
    finally { setActionId(null) }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ORGANIZER</div>
          <h1>My events</h1>
        </div>
        <div className="topbar-actions">
          <Link href="/organizer/events/new" className="btn btn-primary btn-sm gap-2">
            <Plus className="w-4 h-4" /> Create event
          </Link>
        </div>
      </header>

      <div className="page-content">
        {loading ? (
          <div className="panel space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-[var(--border)]">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2"><div className="skeleton h-3 w-48" /><div className="skeleton h-2.5 w-32" /></div>
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            icon={Zap}
            title="No events yet"
            description="Create your first event and start selling tickets."
            action={{ label: 'Create event', href: '/organizer/events/new' }}
          />
        ) : (
          <div className="panel">
            {events.map((event, i) => {
              const badge = getEventStatusBadge(event.status)
              return (
                <div key={event._id} className={`flex items-center gap-4 py-4 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                  <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {event.title?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{event.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {event.startAt ? formatDate(event.startAt) : '—'}
                      {event.venue?.city && ` · ${event.venue.city}`}
                      {event.soldCount != null && ` · ${event.soldCount} sold`}
                    </p>
                  </div>
                  <span className={`badge ${badge.cls} flex-shrink-0`}><span className="badge-dot" />{badge.label}</span>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/events/${event.slug}`} className="icon-btn" title="View public page">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link href={`/organizer/events/${event._id}/edit`} className="icon-btn" title="Edit">
                      <Edit className="w-4 h-4" />
                    </Link>
                    {event.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(event._id)}
                        disabled={actionId === event._id}
                        className="btn btn-primary btn-sm"
                        title="Publish"
                      >
                        <Zap className="w-3.5 h-3.5" /> Publish
                      </button>
                    )}
                    {event.status === 'published' && (
                      <button
                        onClick={() => handleUnpublish(event._id)}
                        disabled={actionId === event._id}
                        className="btn btn-outline btn-sm gap-1.5"
                        title="Unpublish"
                      >
                        <ZapOff className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDuplicate(event._id)}
                      disabled={actionId === event._id}
                      className="icon-btn"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {event.status !== 'cancelled' && event.status !== 'completed' && (
                      <button
                        onClick={() => handleCancel(event._id)}
                        disabled={actionId === event._id}
                        className="icon-btn hover:text-[var(--destructive)]"
                        title="Cancel event"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
