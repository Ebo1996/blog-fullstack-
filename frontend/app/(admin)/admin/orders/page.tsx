'use client'

import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { adminApi } from '@/lib/api/analytics'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatCurrency, getOrderStatusBadge } from '@/lib/utils'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  const load = (s?: string) => {
    setLoading(true)
    adminApi.listOrders({ status: s ?? status, limit: 100 })
      .then((r) => setOrders(r.data?.orders ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ADMIN</div>
          <h1>Orders</h1>
        </div>
      </header>

      <div className="page-content">
        <div className="flex justify-end mb-6">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); load(e.target.value) }}
            className="input-field text-xs"
            style={{ height: 42, minWidth: 140 }}
          >
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="panel">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-[var(--border)]">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2"><div className="skeleton h-3 w-48" /><div className="skeleton h-2.5 w-32" /></div>
                <div className="skeleton h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon={CreditCard} title="No orders found" />
        ) : (
          <div className="panel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Event</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const badge = getOrderStatusBadge(order.status)
                  return (
                    <tr key={order._id}>
                      <td className="font-mono text-xs">{order._id.slice(-8).toUpperCase()}</td>
                      <td>
                        <p className="text-xs font-medium">{order.userId?.name ?? '—'}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{order.userId?.email}</p>
                      </td>
                      <td className="text-xs max-w-[160px] truncate">{order.eventId?.title ?? '—'}</td>
                      <td className="text-xs font-semibold">{formatCurrency(order.totalAmount, order.currency)}</td>
                      <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                      <td className="text-xs text-[var(--muted-foreground)]">{formatDate(order.createdAt)}</td>
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
