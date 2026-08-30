'use client'

import { useState, useTransition, useMemo } from 'react'
import Link from 'next/link'
import { Search, ExternalLink, Eye, EyeOff, XCircle, CheckCircle } from 'lucide-react'
import { EventStatusBadge } from '@/components/ui/badge'
import { formatDate, formatCurrency, formatNumber } from '@/lib/utils/format'
import type { AdminEventRow } from '@/services/admin'
import type { AdminActionResult } from '@/app/admin/actions'
import type { EventStatus } from '@/types/database'

interface EventsClientProps {
  events: AdminEventRow[]
  setStatusAction: (id: string, status: EventStatus) => Promise<AdminActionResult>
}

const STATUS_ACTIONS: Array<{
  status: EventStatus
  label: string
  icon: React.ReactNode
  style: React.CSSProperties
  show: (current: EventStatus) => boolean
}> = [
  {
    status: 'published',
    label: 'Publish',
    icon: <CheckCircle size={12} />,
    style: { background: 'var(--success-bg)', color: 'var(--success)', borderColor: 'rgba(200,231,107,0.25)' },
    show: (s) => s === 'draft',
  },
  {
    status: 'draft',
    label: 'Unpublish',
    icon: <EyeOff size={12} />,
    style: { background: 'var(--muted)', color: 'var(--foreground)', borderColor: 'transparent' },
    show: (s) => s === 'published',
  },
  {
    status: 'cancelled',
    label: 'Cancel',
    icon: <XCircle size={12} />,
    style: { background: 'var(--error-bg)', color: 'var(--error)', borderColor: 'rgba(224,107,107,0.25)' },
    show: (s) => s === 'published' || s === 'draft',
  },
]

export function EventsClient({ events, setStatusAction }: EventsClientProps) {
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all')

  const filtered = useMemo(() => {
    let rows = events
    if (statusFilter !== 'all') rows = rows.filter((e) => e.status === statusFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.organizer_name?.toLowerCase().includes(q) ||
          e.city?.toLowerCase().includes(q),
      )
    }
    return rows
  }, [events, search, statusFilter])

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }} aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, organizer, city…"
            className="form-input"
            style={{ paddingLeft: 36 }}
            aria-label="Search events"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as EventStatus | 'all')}
          className="form-select"
          style={{ width: 'auto', minWidth: 150 }}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 12 }}>
        {filtered.length} event{filtered.length !== 1 ? 's' : ''}
      </p>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Organizer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Sold</th>
              <th>Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)', fontSize: 13 }}>
                  No events found
                </td>
              </tr>
            ) : (
              filtered.map((event) => (
                <EventRow key={event.id} event={event} setStatusAction={setStatusAction} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EventRow({
  event,
  setStatusAction,
}: {
  event: AdminEventRow
  setStatusAction: (id: string, status: EventStatus) => Promise<AdminActionResult>
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError]          = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<EventStatus>(event.status)

  function handleStatus(status: EventStatus) {
    setError(null)
    startTransition(async () => {
      const res = await setStatusAction(event.id, status)
      if (res.error) { setError(res.error); return }
      setCurrentStatus(status)
    })
  }

  const availableActions = STATUS_ACTIONS.filter((a) => a.show(currentStatus))

  return (
    <tr style={{ opacity: currentStatus === 'cancelled' ? 0.6 : 1 }}>
      <td>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.title}
          </p>
          {event.city && (
            <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>{event.city}</p>
          )}
          {error && (
            <p style={{ fontSize: 11, color: 'var(--error)', margin: '2px 0 0' }} role="alert">{error}</p>
          )}
        </div>
      </td>
      <td style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
        {event.organizer_name ?? '—'}
      </td>
      <td style={{ fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
        {formatDate(event.start_at, 'MMM d, yyyy')}
      </td>
      <td><EventStatusBadge status={currentStatus} /></td>
      <td style={{ fontSize: 13 }}>{formatNumber(event.tickets_sold)}</td>
      <td style={{ fontSize: 13, fontWeight: 600 }}>
        {event.revenue > 0 ? formatCurrency(event.revenue) : '—'}
      </td>
      <td>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {/* View public page */}
          <Link
            href={`/events/${event.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`View ${event.title} public page`}
            style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', color: 'var(--muted-foreground)', transition: 'color var(--transition-fast)' }}
          >
            <ExternalLink size={12} aria-hidden="true" />
          </Link>

          {/* Status change buttons */}
          {availableActions.map((action) => (
            <button
              key={action.status}
              onClick={() => handleStatus(action.status)}
              disabled={pending}
              aria-busy={pending}
              aria-label={`${action.label} ${event.title}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 9px', borderRadius: 6, fontSize: 11,
                fontWeight: 600, cursor: 'pointer', border: '1px solid',
                opacity: pending ? 0.5 : 1,
                transition: 'opacity var(--transition-fast)',
                ...action.style,
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </td>
    </tr>
  )
}

void Eye
