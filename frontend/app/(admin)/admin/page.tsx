'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, CalendarDays, Ticket, DollarSign, TrendingUp, ShieldCheck, ArrowUpRight } from 'lucide-react'
import { analyticsApi } from '@/lib/api/analytics'
import { formatCurrency } from '@/lib/utils'

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi.platformOverview()
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const stats = [
    { icon: Users, label: 'Total users', value: (data?.users?.total ?? 0).toLocaleString(), sub: `${data?.users?.attendees ?? 0} attendees · ${data?.users?.organizers ?? 0} organizers`, href: '/admin/users', color: 'text-blue-400' },
    { icon: CalendarDays, label: 'Total events', value: (data?.events?.total ?? 0).toLocaleString(), sub: `${data?.events?.published ?? 0} published`, href: '/admin/events', color: 'text-purple-400' },
    { icon: Ticket, label: 'Tickets issued', value: (data?.tickets?.total ?? 0).toLocaleString(), sub: `${data?.checkIns ?? 0} check-ins`, href: '/admin/orders', color: 'text-green-400' },
    { icon: DollarSign, label: 'Gross revenue', value: formatCurrency(data?.revenue?.gross ?? 0, 'ETB'), sub: `${(data?.orders?.paid?.count ?? 0).toLocaleString()} paid orders`, href: '/admin/orders', color: 'text-[var(--primary)]', isString: true },
    { icon: TrendingUp, label: 'Paid orders', value: (data?.orders?.paid?.count ?? 0).toLocaleString(), sub: `${(data?.orders?.failed?.count ?? 0)} failed`, href: '/admin/orders', color: 'text-orange-400' },
    { icon: ShieldCheck, label: 'Total check-ins', value: (data?.checkIns ?? 0).toLocaleString(), sub: 'Platform-wide', href: '/admin/analytics', color: 'text-cyan-400' },
  ]

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">PLATFORM</div>
          <h1>Admin overview</h1>
        </div>
      </header>

      <div className="page-content">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {stats.map(({ icon: Icon, label, value, sub, href, color, isString }) => (
            <Link key={label} href={href} className="panel stat-card hover:border-[var(--primary)] transition-colors">
              <div className={`w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="stat-value" style={{ fontSize: isString ? 18 : 32 }}>
                {loading ? '—' : value}
              </p>
              <p className="stat-label">{label}</p>
              <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 3 }}>{sub}</p>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div className="panel">
          <div className="panel-heading"><div><span className="eyebrow">QUICK ACTIONS</span><h2>Manage platform</h2></div></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/admin/users', label: 'Manage users', icon: Users },
              { href: '/admin/events', label: 'Manage events', icon: CalendarDays },
              { href: '/admin/orders', label: 'View orders', icon: DollarSign },
              { href: '/admin/audit-logs', label: 'Audit logs', icon: ShieldCheck },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="card card-hover p-4 flex flex-col items-center gap-3 text-center transition-all">
                <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center">
                  <Icon className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <span className="text-xs font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
