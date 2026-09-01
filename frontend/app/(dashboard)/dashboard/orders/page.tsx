'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CreditCard, ChevronRight, ExternalLink } from 'lucide-react'
import { ordersApi } from '@/lib/api/orders'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { formatDate, formatCurrency, getOrderStatusBadge } from '@/lib/utils'

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersApi.list()
      .then((r) => setOrders(r.data?.orders ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">YOUR PURCHASES</div>
          <h1>Orders</h1>
        </div>
      </header>

      <div className="page-content">
        <p className="text-xs text-[var(--muted-foreground)] mb-6">A record of all your ticket purchases and receipts.</p>

        {loading ? (
          <div className="panel space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-[var(--border)]">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2"><div className="skeleton h-3 w-48" /><div className="skeleton h-2.5 w-32" /></div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState icon={CreditCard} title="No orders yet" description="Your ticket purchases will appear here." action={{ label: 'Browse events', href: '/events' }} />
        ) : (
          <div className="panel">
            {orders.map((order, i) => {
              const badge = getOrderStatusBadge(order.status)
              return (
                <div key={order._id} className={`flex items-center gap-4 py-4 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}>
                  <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{order.eventId?.title ?? 'Order'}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {formatDate(order.createdAt)} ·{' '}
                      {order.items?.length ?? 0} ticket{order.items?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className={`badge ${badge.cls} flex-shrink-0`}>{badge.label}</span>
                  <span className="text-xs font-bold flex-shrink-0">
                    {formatCurrency(order.totalAmount, order.currency)}
                  </span>
                  {order.status === 'paid' && (
                    <Link href={`/dashboard/tickets`} className="btn btn-outline btn-sm flex-shrink-0 gap-1.5">
                      <ExternalLink className="w-3 h-3" /> Tickets
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
