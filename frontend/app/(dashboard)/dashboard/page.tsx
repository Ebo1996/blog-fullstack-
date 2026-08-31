'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight, CalendarDays, CreditCard, QrCode, ChevronRight,
  Bell, Ticket, Users, Check,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { ticketsApi } from '@/lib/api/tickets'
import { ordersApi } from '@/lib/api/orders'
import { Badge } from '@/components/ui/badge'
import { formatDate, formatDateTime, getInitials, getOrderStatusBadge, getTicketStatusBadge, getEventColorClass, formatCurrency } from '@/lib/utils'

export default function DashboardOverviewPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      ticketsApi.list({ limit: 3, status: 'active' }),
      ordersApi.list({ limit: 5 }),
    ]).then(([tRes, oRes]) => {
      const td = tRes.data as any
      const od = oRes.data as any
      setTickets(td?.tickets ?? td ?? [])
      setOrders(od?.orders ?? od ?? [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const nextTicket = tickets[0]
  const greetHour = new Date().getHours()
  const greeting = greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      {/* Topbar */}
      <header className="topbar">
        <div>
          <div className="eyebrow">{new Date().toLocaleDateString('en-ET', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</div>
          <h1>{greeting}, {user?.name.split(' ')[0]}</h1>
        </div>
        <div className="topbar-actions">
          <Link href="/dashboard/notifications" className="icon-btn relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            <span className="notification-dot" />
          </Link>
          <span className="avatar w-9 h-9 text-sm">{getInitials(user?.name ?? '')}</span>
        </div>
      </header>

      <div className="page-content">
        {/* Hero next event */}
        {nextTicket && (
          <section
            className="rounded-[var(--radius-lg)] p-8 mb-8 flex justify-between items-end overflow-hidden relative"
            style={{ background: '#30342a', minHeight: 220 }}
            aria-label="Your next event"
          >
            <div aria-hidden className="absolute inset-0 pointer-events-none">
              <div style={{ position: 'absolute', right: '8%', top: -60, width: 260, height: 260, borderRadius: '50%', border: '1px solid #82934f', boxShadow: '0 0 0 28px #30342a, 0 0 0 29px #697641, 0 0 0 58px #30342a, 0 0 0 59px #697641', opacity: 0.5 }} />
            </div>
            <div className="relative z-10">
              <span className="eyebrow" style={{ color: '#c2cb9d' }}>YOUR NEXT EVENT</span>
              <h2 className="text-serif" style={{ fontSize: 36, marginTop: 6, marginBottom: 8 }}>
                {nextTicket.eventId?.title ?? 'Upcoming event'}
              </h2>
              <p style={{ color: '#c2c7b1', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <CalendarDays className="w-3.5 h-3.5" />
                {nextTicket.eventId?.startAt ? formatDateTime(nextTicket.eventId.startAt) : '—'}
                {nextTicket.eventId?.venue?.name && <><span>·</span> {nextTicket.eventId.venue.name}</>}
              </p>
              <div className="flex gap-2 mt-6">
                <Link href={`/dashboard/tickets/${nextTicket._id}`} className="btn btn-primary btn-sm">
                  <QrCode className="w-3.5 h-3.5" /> View ticket
                </Link>
              </div>
            </div>
            {nextTicket.eventId?.startAt && (
              <div className="relative z-10 text-right flex-shrink-0" style={{ color: '#c3ce91' }}>
                <span style={{ fontSize: 60, fontWeight: 300, lineHeight: 0.7, display: 'block' }}>
                  {new Date(nextTicket.eventId.startAt).getDate()}
                </span>
                <span style={{ fontSize: 11, letterSpacing: '0.12em', marginTop: 8, display: 'block' }}>
                  {new Date(nextTicket.eventId.startAt).toLocaleDateString('en', { month: 'short' }).toUpperCase()}<br />
                  {new Date(nextTicket.eventId.startAt).getFullYear()}
                </span>
              </div>
            )}
          </section>
        )}

        {/* Tickets section */}
        <div className="section-heading">
          <div>
            <span className="eyebrow">YOUR TICKETS</span>
            <h2 className="text-serif" style={{ fontSize: 24 }}>Ready when you are</h2>
          </div>
          <Link href="/dashboard/tickets" className="text-link">
            View all <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="ticket-card"><div className="skeleton ticket-card-art" /><div className="ticket-card-info space-y-3"><div className="skeleton h-3 w-16" /><div className="skeleton h-6 w-40" /><div className="skeleton h-3 w-32" /></div></div>
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">No active tickets yet.</p>
            <Link href="/events" className="btn btn-outline btn-sm mt-4">Browse events</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tickets.map((ticket, i) => (
              <TicketCard key={ticket._id} ticket={ticket} featured={i === 0} />
            ))}
          </div>
        )}

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mt-10">
          {/* Recent orders */}
          <div className="panel lg:col-span-3">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">RECENT ACTIVITY</span>
                <h2>Orders</h2>
              </div>
              <Link href="/dashboard/orders" className="text-link">View all <ArrowUpRight className="w-3 h-3" /></Link>
            </div>
            {orders.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)] py-4">No orders yet.</p>
            ) : (
              <div>
                {orders.map((order) => {
                  const badge = getOrderStatusBadge(order.status)
                  return (
                    <Link key={order._id} href={`/dashboard/orders/${order._id}`} className="flex items-center gap-3 py-3.5 border-t border-[var(--border)] hover:bg-[var(--muted)] -mx-4 px-4 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                        <CreditCard className="w-3.5 h-3.5 text-[var(--primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{order.eventId?.title ?? 'Order'}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">{formatDate(order.createdAt)}</p>
                      </div>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                      <ChevronRight className="w-4 h-4 text-[var(--muted-foreground)]" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="lg:col-span-2 space-y-4">
            <StatPanel icon={Ticket} label="Active tickets" value={tickets.length} href="/dashboard/tickets" />
            <StatPanel icon={CreditCard} label="Total orders" value={orders.length} href="/dashboard/orders" />
            <StatPanel icon={Users} label="Transfers" value={0} href="/dashboard/transfers" />
          </div>
        </div>
      </div>
    </>
  )
}

function TicketCard({ ticket, featured }: { ticket: any; featured: boolean }) {
  const colorClass = getEventColorClass(featured ? 0 : 1)
  return (
    <Link href={`/dashboard/tickets/${ticket._id}`} className="ticket-card">
      <div className={`ticket-card-art event-art ${colorClass}`} style={{ fontSize: featured ? 40 : 24 }}>
        <span className="relative z-10">
          {ticket.eventId?.title?.split(' ').map((w: string) => w[0]).join('').slice(0, 3) ?? 'EV'}
        </span>
      </div>
      <div className="ticket-card-info">
        <Badge variant="success" dot>
          {ticket.status === 'active' ? 'Confirmed' : ticket.status}
        </Badge>
        <h3 className="ticket-card-title line-clamp-2">{ticket.eventId?.title ?? 'Event'}</h3>
        <p className="ticket-card-meta">
          {ticket.eventId?.startAt ? formatDate(ticket.eventId.startAt) : '—'}<br />
          {ticket.eventId?.venue?.name ?? ticket.eventId?.venue?.city ?? ''}
        </p>
      </div>
      <QrCode className="absolute bottom-4 right-4 w-5 h-5 text-[var(--muted-foreground)] opacity-60" />
    </Link>
  )
}

function StatPanel({ icon: Icon, label, value, href }: { icon: any; label: string; value: number; href: string }) {
  return (
    <Link href={href} className="panel stat-card flex items-center gap-4 hover:border-[var(--primary)] transition-colors">
      <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
        <Icon className="w-4.5 h-4.5 text-[var(--primary)]" />
      </div>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
      </div>
    </Link>
  )
}
