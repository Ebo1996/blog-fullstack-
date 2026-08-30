'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { OrderStatusBadge } from '@/components/ui/badge'
import { formatDate, formatCurrency, formatOrderId } from '@/lib/utils/format'
import type { AdminOrderRow } from '@/services/admin'
import type { OrderStatus } from '@/types/database'

interface OrdersClientProps {
  orders: AdminOrderRow[]
  totalPages: number
  currentPage: number
  currentStatus?: OrderStatus
}

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '',                   label: 'All statuses' },
  { value: 'pending',            label: 'Pending' },
  { value: 'paid',               label: 'Paid' },
  { value: 'failed',             label: 'Failed' },
  { value: 'cancelled',          label: 'Cancelled' },
  { value: 'refunded',           label: 'Refunded' },
  { value: 'partially_refunded', label: 'Partial refund' },
]

export function OrdersClient({
  orders,
  totalPages,
  currentPage,
  currentStatus,
}: OrdersClientProps) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch]   = useState('')
  const [, startTransition]   = useTransition()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) { params.set(key, value) } else { params.delete(key) }
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }))
  }

  const filtered = search.trim()
    ? orders.filter((o) =>
        o.buyer_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.event_title.toLowerCase().includes(search.toLowerCase()) ||
        o.id.toLowerCase().includes(search.toLowerCase()),
      )
    : orders

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
            placeholder="Search buyer, event, order ID…"
            className="form-input"
            style={{ paddingLeft: 36 }}
            aria-label="Search orders"
          />
        </div>
        <select
          value={currentStatus ?? ''}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="form-select"
          style={{ width: 'auto', minWidth: 160 }}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Buyer</th>
              <th>Event</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-foreground)', fontSize: 13 }}>
                  No orders found
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted-foreground)' }}>
                      {formatOrderId(order.id)}
                    </span>
                  </td>
                  <td style={{ fontSize: 13 }}>{order.buyer_name ?? '—'}</td>
                  <td>
                    <p style={{ fontSize: 12, margin: 0, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.event_title}
                    </p>
                  </td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>
                    {formatCurrency(order.total_amount, order.currency)}
                  </td>
                  <td><OrderStatusBadge status={order.status} /></td>
                  <td style={{ fontSize: 11, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                    {formatDate(order.created_at, 'MMM d, yyyy')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Pagination" style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/orders?${new URLSearchParams({ ...(currentStatus ? { status: currentStatus } : {}), page: String(p) }).toString()}`}
              aria-label={`Page ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
              style={{
                display: 'grid', placeItems: 'center', width: 34, height: 34,
                borderRadius: 'var(--radius-md)', border: '1px solid',
                borderColor: p === currentPage ? 'var(--admin-accent)' : 'var(--border)',
                background:  p === currentPage ? 'var(--admin-accent)' : 'transparent',
                color:       p === currentPage ? '#fff' : 'var(--foreground)',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}
            >
              {p}
            </a>
          ))}
        </nav>
      )}
    </div>
  )
}
