'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, DollarSign, Ticket, Users, Calendar, QrCode, AlertCircle } from 'lucide-react'
import { adminApi, analyticsApi } from '@/lib/api/analytics'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function AdminReportsPage() {
  const [platform, setPlatform] = useState<any>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.platformOverview(),
      adminApi.listOrders({ limit: 10, sort: 'newest' }),
    ]).then(([pRes, oRes]) => {
      setPlatform(pRes.data)
      setRecentOrders(oRes.data?.orders ?? oRes.data ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const paid = platform?.orders?.paid ?? { count: 0, revenue: 0 }
  const failed = platform?.orders?.failed ?? { count: 0 }
  const pending = platform?.orders?.pending ?? { count: 0 }
  const conversionRate = (paid.count + failed.count) > 0
    ? Math.round((paid.count / (paid.count + failed.count)) * 100)
    : 0

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ADMIN</div>
          <h1>Reports</h1>
        </div>
      </header>

      <div className="page-content">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="panel stat-card">
                <div className="skeleton w-8 h-8 rounded-full mb-3" />
                <div className="skeleton h-7 w-16 mb-2" />
                <div className="skeleton h-3 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* ── Platform health metrics ───────────────────────── */}
            <section className="mb-10">
              <h2 className="text-xs font-bold text-[var(--muted-foreground)] tracking-widest mb-4">PLATFORM OVERVIEW</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Users, label: 'Total users', value: (platform?.users?.total ?? 0).toLocaleString(), color: 'text-blue-400' },
                  { icon: Calendar, label: 'Total events', value: (platform?.events?.total ?? 0).toLocaleString(), color: 'text-purple-400' },
                  { icon: Ticket, label: 'Tickets issued', value: (platform?.tickets?.total ?? 0).toLocaleString(), color: 'text-[var(--primary)]' },
                  { icon: QrCode, label: 'Check-ins', value: (platform?.checkIns ?? 0).toLocaleString(), color: 'text-green-400' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="panel stat-card">
                    <div className={`w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center mb-3 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="stat-value">{value}</p>
                    <p className="stat-label">{label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Revenue & payments ────────────────────────────── */}
            <section className="mb-10">
              <h2 className="text-xs font-bold text-[var(--muted-foreground)] tracking-widest mb-4">REVENUE & PAYMENTS</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: DollarSign, label: 'Gross revenue', value: formatCurrency(paid.revenue ?? 0, 'ETB'), color: 'text-[var(--primary)]', small: true },
                  { icon: TrendingUp, label: 'Successful orders', value: (paid.count ?? 0).toLocaleString(), color: 'text-green-400' },
                  { icon: AlertCircle, label: 'Failed orders', value: (failed.count ?? 0).toLocaleString(), color: 'text-red-400' },
                  { icon: BarChart3, label: 'Conversion rate', value: `${conversionRate}%`, color: 'text-blue-400' },
                ].map(({ icon: Icon, label, value, color, small }) => (
                  <div key={label} className="panel stat-card">
                    <div className={`w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center mb-3 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="stat-value" style={{ fontSize: small ? 18 : 32 }}>{value}</p>
                    <p className="stat-label">{label}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Order status breakdown ────────────────────────── */}
            <section className="mb-10">
              <h2 className="text-xs font-bold text-[var(--muted-foreground)] tracking-widest mb-4">ORDER STATUS BREAKDOWN</h2>
              <div className="panel">
                {['paid', 'pending', 'failed', 'cancelled', 'refunded'].map((status) => {
                  const d = platform?.orders?.[status] ?? { count: 0, revenue: 0 }
                  const total = Object.values(platform?.orders ?? {}).reduce((s: number, v: any) => s + (v?.count ?? 0), 0) as number
                  const pct = total > 0 ? Math.round((d.count / total) * 100) : 0
                  const colors: Record<string, string> = {
                    paid: 'bg-green-500',
                    pending: 'bg-yellow-500',
                    failed: 'bg-red-500',
                    cancelled: 'bg-gray-500',
                    refunded: 'bg-blue-500',
                  }
                  return (
                    <div key={status} className="py-3 border-b border-[var(--border)] last:border-0">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="font-medium capitalize">{status}</span>
                        <span className="text-[var(--muted-foreground)]">{d.count} orders ({pct}%){d.revenue > 0 ? ` · ETB ${d.revenue.toLocaleString()}` : ''}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--muted)] overflow-hidden">
                        <div className={`h-full rounded-full ${colors[status]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* ── Recent orders ─────────────────────────────────── */}
            {recentOrders.length > 0 && (
              <section>
                <h2 className="text-xs font-bold text-[var(--muted-foreground)] tracking-widest mb-4">RECENT ORDERS</h2>
                <div className="panel overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Event</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o) => (
                        <tr key={o._id}>
                          <td>
                            <p className="text-xs font-medium">{o.userId?.name ?? '—'}</p>
                            <p className="text-xs text-[var(--muted-foreground)]">{o.userId?.email}</p>
                          </td>
                          <td className="text-xs font-medium max-w-[180px] truncate">{o.eventId?.title ?? '—'}</td>
                          <td className="text-xs font-bold">{formatCurrency(o.totalAmount, o.currency)}</td>
                          <td>
                            <span className={`badge ${
                              o.status === 'paid' ? 'badge-success' :
                              o.status === 'pending' ? 'badge-warning' :
                              o.status === 'failed' ? 'badge-danger' : 'badge-neutral'
                            }`}>
                              <span className="badge-dot" />{o.status}
                            </span>
                          </td>
                          <td className="text-xs text-[var(--muted-foreground)]">{formatDate(o.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  )
}
