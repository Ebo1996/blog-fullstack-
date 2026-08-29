import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  SalesOverTimeChart,
  SalesByTypeChart,
  RevenueByTypeChart,
} from '@/components/organizer/analytics-charts'
import { getOrganizerEventById, getEventAnalytics } from '@/services/organizer'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils/format'
import { BarChart2, Ticket, Users, TrendingUp } from 'lucide-react'
import type { Profile } from '@/types/database'

export const metadata: Metadata = { title: 'Analytics' }

interface Props { params: Promise<{ eventId: string }> }

export default async function AnalyticsPage({ params }: Props) {
  const { eventId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role === 'attendee') redirect('/dashboard')

  const [event, analytics] = await Promise.all([
    getOrganizerEventById(eventId, user.id),
    getEventAnalytics(eventId, user.id),
  ])
  if (!event) notFound()

  const hasData = analytics.ticketsSold > 0

  return (
    <>
      <OrganizerHeader title="Analytics" eyebrow="EVENT PERFORMANCE" profile={profile} />

      <main className="content">

        {/* ── KPI row ────────────────────────────────────────── */}
        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <StatCard
            label="Revenue"
            value={analytics.totalRevenue > 0 ? formatCurrency(analytics.totalRevenue) : '—'}
            icon={<BarChart2 size={16} />}
          />
          <StatCard
            label="Tickets sold"
            value={formatNumber(analytics.ticketsSold)}
            icon={<Ticket size={16} />}
            delta={analytics.ticketsRemaining > 0
              ? `${formatNumber(analytics.ticketsRemaining)} remaining`
              : 'Sold out'}
            deltaDirection="neutral"
          />
          <StatCard
            label="Avg. order value"
            value={analytics.averageOrderValue > 0
              ? formatCurrency(analytics.averageOrderValue)
              : '—'}
            icon={<TrendingUp size={16} />}
          />
          <StatCard
            label="Check-in rate"
            value={formatPercent(analytics.checkInRate)}
            icon={<Users size={16} />}
            delta={`${formatNumber(analytics.ticketsSold)} sold`}
            deltaDirection="neutral"
          />
        </div>

        {!hasData ? (
          <EmptyState
            icon={<BarChart2 size={24} />}
            title="No sales data yet"
            description="Analytics will appear here once tickets are purchased."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* ── Sales over time ──────────────────────────────── */}
            <div className="panel">
              <div className="panel-heading" style={{ marginBottom: 20 }}>
                <div>
                  <div className="eyebrow">REVENUE OVER TIME</div>
                  <h2 style={{ fontSize: 20 }}>Sales trend</h2>
                </div>
              </div>
              <SalesOverTimeChart data={analytics.salesOverTime} />
            </div>

            {/* ── Two-column charts ────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

              {/* Tickets by type */}
              <div className="panel">
                <div style={{ marginBottom: 16 }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>BY TICKET TYPE</div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
                    Sold vs remaining
                  </h2>
                </div>
                <SalesByTypeChart data={analytics.salesByType} />
              </div>

              {/* Revenue by type */}
              <div className="panel">
                <div style={{ marginBottom: 16 }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>REVENUE SPLIT</div>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
                    Revenue by type
                  </h2>
                </div>
                <RevenueByTypeChart data={analytics.salesByType} />
              </div>
            </div>

            {/* ── Ticket type breakdown table ──────────────────── */}
            <div className="panel">
              <div style={{ marginBottom: 16 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>BREAKDOWN</div>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}>
                  Ticket type detail
                </h2>
              </div>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Sold</th>
                      <th>Remaining</th>
                      <th>Revenue</th>
                      <th>Fill rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.salesByType.map((t) => {
                      const total    = t.sold + t.remaining
                      const fillRate = total > 0 ? Math.round((t.sold / total) * 100) : 0
                      return (
                        <tr key={t.name}>
                          <td style={{ fontWeight: 600, fontSize: 13 }}>{t.name}</td>
                          <td style={{ fontSize: 12 }}>
                            {t.price === 0 ? 'Free' : formatCurrency(t.price)}
                          </td>
                          <td style={{ fontSize: 13 }}>{formatNumber(t.sold)}</td>
                          <td style={{ fontSize: 13, color: t.remaining === 0 ? 'var(--warning)' : 'var(--foreground)' }}>
                            {t.remaining === 0 ? 'Sold out' : formatNumber(t.remaining)}
                          </td>
                          <td style={{ fontSize: 13, fontWeight: 600 }}>
                            {t.revenue > 0 ? formatCurrency(t.revenue) : '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 4, background: 'var(--muted)', borderRadius: 99, minWidth: 60 }}>
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${fillRate}%`,
                                    background: fillRate >= 90 ? 'var(--warning)' : 'var(--organizer-accent)',
                                    borderRadius: 99,
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: 11, color: 'var(--muted-foreground)', flexShrink: 0 }}>
                                {fillRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
