'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Users, CalendarDays, Ticket, DollarSign, TrendingUp, QrCode, ShieldCheck } from 'lucide-react'
import { analyticsApi } from '@/lib/api/analytics'
import { formatCurrency } from '@/lib/utils'

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi.platformOverview()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const val = (v: any, isCurrency = false) => {
    if (loading) return '—'
    if (isCurrency) return formatCurrency(v ?? 0, 'ETB')
    return (v ?? 0).toLocaleString()
  }

  const stats = [
    { icon: Users, label: 'Total users', value: val(data?.users?.total), sub: `${val(data?.users?.attendees)} attendees · ${val(data?.users?.organizers)} organizers`, color: 'text-blue-400' },
    { icon: CalendarDays, label: 'Total events', value: val(data?.events?.total), sub: `${val(data?.events?.published)} published · ${val(data?.events?.upcoming)} upcoming`, color: 'text-purple-400' },
    { icon: Ticket, label: 'Tickets issued', value: val(data?.tickets?.total), sub: `${val(data?.tickets?.active)} active`, color: 'text-green-400' },
    { icon: DollarSign, label: 'Gross revenue', value: val(data?.revenue?.gross, true), sub: `${val(data?.orders?.paid?.count)} paid orders`, color: 'text-[var(--primary)]' },
    { icon: TrendingUp, label: 'Successful payments', value: val(data?.orders?.paid?.count), sub: `${val(data?.orders?.failed?.count)} failed payments`, color: 'text-orange-400' },
    { icon: QrCode, label: 'Total check-ins', value: val(data?.checkIns), sub: 'Platform-wide', color: 'text-cyan-400' },
    { icon: ShieldCheck, label: 'Pending orders', value: val(data?.orders?.pending?.count), sub: 'Awaiting payment', color: 'text-yellow-400' },
    { icon: BarChart3, label: 'Cancelled orders', value: val(data?.orders?.cancelled?.count), sub: 'All time', color: 'text-red-400' },
  ]

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ADMIN</div>
          <h1>Platform analytics</h1>
        </div>
      </header>

      <div className="page-content">
        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="panel stat-card">
              <div className={`w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="stat-value" style={{ fontSize: typeof value === 'string' && value.length > 10 ? 16 : 28 }}>
                {value}
              </p>
              <p className="stat-label">{label}</p>
              <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 3 }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Revenue breakdown */}
        {data?.revenue && (
          <div className="panel mb-6">
            <div className="panel-heading">
              <div><span className="eyebrow">REVENUE</span><h2>Financial overview</h2></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
              {[
                { label: 'Gross revenue', value: formatCurrency(data.revenue.gross ?? 0, 'ETB') },
                { label: 'Platform fees (2.5%)', value: formatCurrency((data.revenue.gross ?? 0) * 0.025, 'ETB') },
                { label: 'Net to organizers', value: formatCurrency((data.revenue.gross ?? 0) * 0.975, 'ETB') },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-[var(--radius-md)] border border-[var(--border)] p-5">
                  <p className="text-xs text-[var(--muted-foreground)] mb-2">{label}</p>
                  <p className="text-lg font-bold" style={{ fontFamily: 'var(--font-serif)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users by role */}
        {data?.users && (
          <div className="panel">
            <div className="panel-heading">
              <div><span className="eyebrow">USERS</span><h2>User breakdown</h2></div>
            </div>
            <div className="space-y-4 mt-2">
              {[
                { label: 'Attendees', count: data.users.attendees ?? 0, total: data.users.total ?? 1, color: 'bg-blue-400' },
                { label: 'Organizers', count: data.users.organizers ?? 0, total: data.users.total ?? 1, color: 'bg-purple-400' },
                { label: 'Admins', count: data.users.admins ?? 0, total: data.users.total ?? 1, color: 'bg-red-400' },
              ].map(({ label, count, total, color }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-medium">{label}</span>
                      <span className="text-[var(--muted-foreground)]">{count.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--muted)] overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
