'use client'

import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { ordersApi } from '@/lib/api/orders'
import { eventsApi } from '@/lib/api/events'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatCurrency, getOrderStatusBadge } from '@/lib/utils'

export default function OrganizerOrdersPage() {
  const [events, setEvents] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    eventsApi.myEvents({ limit: 100 })
      .then((r) => {
        const evs = r.data?.events ?? r.data ?? []
        setEvents(evs)
        if (evs.length > 0) setSelectedEvent(evs[0]._id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedEvent) return
    setLoading(true)
    ordersApi.eventOrders(selectedEvent)
      .then((r) => setOrders(r.data?.orders ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedEvent])

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ORGANIZER</div>
          <h1>Orders</h1>
        </div>
      </header>

      <div className="page-content">
        {/* Event selector */}
        {events.length > 0 && (
          <div className="mb-6">
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="input-field max-w-xs"
              aria-label="Select event"
            >
              {events.map((e) => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <div className="panel space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-[var(--border)]">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2"><div className="skeleton h-3 w-48" /><div className="skeleton h-2.5 w-32" /></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon={CreditCard} title="No orders yet" description="Orders for this event will appear here." />
        ) : (
          <div className="panel overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Tickets</th>
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
                        <p className="text-xs font-medium">{order.userId?.name ?? 'User'}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{order.userId?.email}</p>
                      </td>
                      <td className="text-xs">
                        {order.items?.map((item: any) => (
                          <div key={item.ticketTypeId}>{item.quantity}× {item.ticketTypeName}</div>
                        ))}
                      </td>
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
