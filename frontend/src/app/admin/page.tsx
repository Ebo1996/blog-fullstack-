import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Users, CalendarDays, Ticket, BarChart2,
  TrendingUp, TrendingDown, ArrowUpRight,
  ShoppingBag, Flag, Building2,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/header'
import { StatCard } from '@/components/ui/stat-card'
import { OrderStatusBadge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { getPlatformStats, getRecentPlatformOrders } from '@/services/admin'
import { formatCurrency, formatNumber, formatRelative } from '@/lib/utils/format'
import type { Profile } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Platform Overview' }

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const [stats, recentOrders] = await Promise.all([
    getPlatformStats(),
    getRecentPlatformOrders(8),
  ])

  const refundRate = stats.grossRevenue > 0
    ? ((stats.totalRefunds / stats.grossRevenue) * 100).toFixed(1)
    : '0'

  return (
    <>
      <AdminHeader
        title="Platform overview"
        eyebrow="ADMIN"
        profile={profile}
      />

      <main className="content">

        {/* ── Primary KPI grid ─────────────────────────────── */}
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <StatCard
            label="Total users"
            value={formatNumber(stats.totalUsers)}
            icon={<Users size={16} />}
            delta={`+${stats.newUsersThisWeek} this week`}
            deltaDirection={stats.newUsersThisWeek > 0 ? 'up' : 'neutral'}
          />
          <StatCard
            label="Organizers"
            value={formatNumber(stats.totalOrganizers)}
            icon={<Building2 size={16} />}
          />
          <StatCard
            label="Total events"
            value={formatNumber(stats.totalEvents)}
            icon={<CalendarDays size={16} />}
            delta={`+${stats.newEventsThisWeek} this week`}
            deltaDirection={stats.newEventsThisWeek > 0 ? 'up' : 'neutral'}
          />
          <StatCard
            label="Published events"
            value={formatNumber(stats.publishedEvents)}
            icon={<TrendingUp size={16} />}
            delta={`${stats.activeEvents} upcoming`}
            deltaDirection="neutral"
          />
        </div>

        <div className="stats-grid" style={{ marginBottom: 28 }}>
          <StatCard
            label="Tickets sold"
            value={formatNumber(stats.totalTicketsSold)}
            icon={<Ticket size={16} />}
          />
          <StatCard
            label="Gross revenue"
            value={formatCurrency(stats.grossRevenue)}
            icon={<BarChart2 size={16} />}
          />
          <StatCard
            label="Total refunds"
            value={formatCurrency(stats.totalRefunds)}
            icon={<TrendingDown size={16} />}
            delta={stats.totalRefunds > 0 ? `${refundRate}% of revenue` : undefined}
            deltaDirection={stats.totalRefunds > 0 ? 'down' : 'neutral'}
          />
          <StatCard
            label="Active events"
            value={formatNumber(stats.activeEvents)}
            icon={<CalendarDays size={16} />}
          />
        </div>

        {/* ── Two-column grid ───────────────────────────────── */}
        <div className="dashboard-grid" style={{ marginTop: 0 }}>

          {/* Recent orders */}
          <div className="panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">PLATFORM SALES</div>
                <h2>Recent orders</h2>
              </div>
              <Link href="/admin/orders" className="text-link">
                All orders <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div style={{ paddingTop: 20 }}>
                <EmptyState
                  icon={<ShoppingBag size={20} />}
                  title="No orders yet"
                  description="Orders will appear here once attendees start purchasing."
                />
              </div>
            ) : (
              <div className="activity" role="list">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders`}
                    className="activity-item"
                    role="listitem"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="activity-icon" aria-hidden="true">
                      <ShoppingBag size={15} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <Avatar
                          src={order.buyer?.avatar_url}
                          name={order.buyer?.full_name}
                          size="sm"
                        />
                        {order.buyer?.full_name ?? 'Attendee'}
                      </strong>
                      <span style={{ marginTop: 3, fontSize: 11, color: 'var(--muted-foreground)' }}>
                        {order.event?.title} · {formatCurrency(order.total_amount, order.currency)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      <OrderStatusBadge status="paid" />
                      <span style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
                        {formatRelative(order.created_at)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Platform health */}
            <div className="panel">
              <div className="eyebrow" style={{ marginBottom: 16 }}>PLATFORM HEALTH</div>
              {[
                { label: 'Users',         value: stats.totalUsers,       href: '/admin/users',      icon: <Users size={14} />,       color: 'var(--admin-accent)' },
                { label: 'Organizers',    value: stats.totalOrganizers,  href: '/admin/organizers', icon: <Building2 size={14} />,   color: 'var(--organizer-accent)' },
                { label: 'Events live',   value: stats.publishedEvents,  href: '/admin/events',     icon: <CalendarDays size={14} />, color: 'var(--success)' },
                { label: 'Tickets sold',  value: stats.totalTicketsSold, href: '/admin/orders',     icon: <Ticket size={14} />,      color: 'var(--primary)' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid var(--border)',
                    fontSize: 13, textDecoration: 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted-foreground)' }}>
                    <span style={{ color: item.color }} aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    {formatNumber(item.value)}
                  </span>
                </Link>
              ))}
            </div>

            {/* Quick links */}
            <div className="panel">
              <div className="eyebrow" style={{ marginBottom: 14 }}>QUICK ACTIONS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { href: '/admin/reports',    label: 'Review reports',       icon: <Flag size={14} /> },
                  { href: '/admin/users',      label: 'Manage users',         icon: <Users size={14} /> },
                  { href: '/admin/categories', label: 'Edit categories',      icon: <CalendarDays size={14} /> },
                  { href: '/admin/analytics',  label: 'Platform analytics',   icon: <BarChart2 size={14} /> },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="button button-muted"
                    style={{ justifyContent: 'flex-start', gap: 10, fontSize: 12 }}
                  >
                    <span style={{ color: 'var(--admin-accent)' }} aria-hidden="true">{item.icon}</span>
                    {item.label}
                    <ArrowUpRight size={12} style={{ marginLeft: 'auto', color: 'var(--muted-foreground)' }} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
