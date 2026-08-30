import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/header'
import { StatCard } from '@/components/ui/stat-card'
import {
  UserGrowthChart,
  RevenueOverTimeChart,
  OrdersBarChart,
  EventsByStatusChart,
} from '@/components/admin/platform-charts'
import { getPlatformStats, getPlatformAnalytics } from '@/services/admin'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { Users, BarChart2, CalendarDays, TrendingUp } from 'lucide-react'
import type { Profile } from '@/types/database'

export const metadata: Metadata = { title: 'Admin — Analytics' }

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const [stats, analytics] = await Promise.all([
    getPlatformStats(),
    getPlatformAnalytics(),
  ])

  return (
    <>
      <AdminHeader title="Analytics" eyebrow="PLATFORM ANALYTICS" profile={profile} />

      <main className="content">

        {/* ── KPI summary ─────────────────────────────────────── */}
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <StatCard label="Total users"    value={formatNumber(stats.totalUsers)}       icon={<Users size={16} />} />
          <StatCard label="Total events"   value={formatNumber(stats.totalEvents)}      icon={<CalendarDays size={16} />} />
          <StatCard label="Gross revenue"  value={formatCurrency(stats.grossRevenue)}   icon={<BarChart2 size={16} />} />
          <StatCard label="Tickets sold"   value={formatNumber(stats.totalTicketsSold)} icon={<TrendingUp size={16} />} />
        </div>

        {/* ── User growth ──────────────────────────────────────── */}
        <div className="panel" style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>USER GROWTH</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
              Users &amp; organizers over time
            </h2>
          </div>
          <UserGrowthChart data={analytics.userGrowth} />
        </div>

        {/* ── Two-column: revenue + orders ─────────────────────── */}
        <div className="chart-grid-2col">
          <div className="panel">
            <div style={{ marginBottom: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>REVENUE</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
                Monthly revenue
              </h2>
            </div>
            <RevenueOverTimeChart data={analytics.revenueOverTime} />
          </div>

          <div className="panel">
            <div style={{ marginBottom: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>ORDERS</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
                Orders per month
              </h2>
            </div>
            <OrdersBarChart data={analytics.revenueOverTime} />
          </div>
        </div>

        {/* ── Events by status ─────────────────────────────────── */}
        <div className="chart-grid-2col">
          <div className="panel">
            <div style={{ marginBottom: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>EVENTS</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
                Events by status
              </h2>
            </div>
            <EventsByStatusChart data={analytics.eventsByStatus} />
          </div>

          {/* Event status breakdown table */}
          <div className="panel">
            <div style={{ marginBottom: 16 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>BREAKDOWN</div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
                Status summary
              </h2>
            </div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Count</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.eventsByStatus.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted-foreground)', fontSize: 13 }}>
                        No data
                      </td>
                    </tr>
                  ) : (
                    analytics.eventsByStatus.map((row) => {
                      const total = analytics.eventsByStatus.reduce((s, r) => s + r.count, 0)
                      const pct   = total > 0 ? Math.round((row.count / total) * 100) : 0
                      return (
                        <tr key={row.status}>
                          <td style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{row.status}</td>
                          <td style={{ fontSize: 13 }}>{row.count}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 4, background: 'var(--muted)', borderRadius: 99 }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--admin-accent)', borderRadius: 99 }} />
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--muted-foreground)', flexShrink: 0 }}>{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
