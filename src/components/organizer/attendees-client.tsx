'use client'

import { useState, useMemo } from 'react'
import { Search, Download, CheckCircle, Clock } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { OrderStatusBadge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils/format'
import type { AttendeeRow } from '@/services/organizer'

interface AttendeesClientProps {
  attendees: AttendeeRow[]
  eventTitle: string
}

export function AttendeesClient({ attendees, eventTitle }: AttendeesClientProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return attendees
    const q = search.toLowerCase()
    return attendees.filter(
      (a) =>
        a.full_name?.toLowerCase().includes(q) ||
        a.ticket_code.toLowerCase().includes(q) ||
        a.ticket_type_name.toLowerCase().includes(q),
    )
  }, [attendees, search])

  const checkedIn  = attendees.filter((a) => a.checked_in).length
  const checkInPct = attendees.length > 0 ? Math.round((checkedIn / attendees.length) * 100) : 0

  function exportCSV() {
    const headers = ['Name', 'Ticket code', 'Ticket type', 'Order status', 'Checked in', 'Check-in time', 'Purchase date']
    const rows = attendees.map((a) => [
      a.full_name ?? '',
      a.ticket_code,
      a.ticket_type_name,
      a.order_status,
      a.checked_in ? 'Yes' : 'No',
      a.checked_in_at ? formatDate(a.checked_in_at, 'MMM d yyyy h:mm a') : '',
      formatDate(a.purchased_at, 'MMM d yyyy'),
    ])
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${eventTitle.replace(/\s+/g, '-').toLowerCase()}-attendees.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <CheckCircle size={14} style={{ color: 'var(--success)' }} aria-hidden="true" />
          <span>{checkedIn} checked in</span>
          <span style={{ color: 'var(--muted-foreground)' }}>({checkInPct}%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <Clock size={14} style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
          <span style={{ color: 'var(--muted-foreground)' }}>{attendees.length - checkedIn} not yet checked in</span>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)', pointerEvents: 'none' }}
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or ticket code…"
            className="form-input"
            style={{ paddingLeft: 36 }}
            aria-label="Search attendees"
          />
        </div>
        <button
          className="button button-outline"
          style={{ gap: 7, fontSize: 12, flexShrink: 0 }}
          onClick={exportCSV}
          aria-label="Export attendee list as CSV"
        >
          <Download size={13} aria-hidden="true" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted-foreground)', fontSize: 13 }}>
          {search ? `No attendees matching "${search}"` : 'No attendees yet'}
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Attendee</th>
                <th>Ticket</th>
                <th>Type</th>
                <th>Order</th>
                <th>Check-in</th>
                <th>Purchased</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.ticket_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar src={a.avatar_url} name={a.full_name} size="sm" />
                      <span style={{ fontSize: 13 }}>{a.full_name ?? 'Unknown'}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--muted-foreground)' }}>
                      {a.ticket_code}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{a.ticket_type_name}</td>
                  <td><OrderStatusBadge status={a.order_status} /></td>
                  <td>
                    {a.checked_in ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--success)', fontWeight: 700 }}>
                        <CheckCircle size={12} aria-hidden="true" />
                        {a.checked_in_at ? formatDate(a.checked_in_at, 'h:mm a') : 'Yes'}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Not yet</span>
                    )}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                    {formatDate(a.purchased_at, 'MMM d')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
