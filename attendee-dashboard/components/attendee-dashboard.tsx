'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowUpRight, Bell, CalendarDays, Check, ChevronRight,
  CreditCard, Download, LayoutDashboard, Menu, MoreHorizontal,
  QrCode, Search, Settings, Ticket, Users, X,
  TrendingUp, Clock, MapPin, Sparkles, LogOut, AlertCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import type { Profile, TicketWithEvent, OrderWithEvent, RSVPWithEvent, Notification, Transfer } from '@/lib/supabase'

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function useAuth() {
  const [user, setUser] = useState<{ id: string; email: string | undefined } | null | undefined>(undefined)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => {
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null)
      if (data.user) {
        sb.from('profiles').select('*').eq('id', data.user.id).single()
          .then(({ data: p }) => setProfile(p as Profile | null))
      }
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return { user, profile }
}

// ─── Greeting helper ──────────────────────────────────────────────────────────
function getGreeting(name: string | null) {
  const h = new Date().getHours()
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${g}, ${name?.split(' ')[0] ?? 'there'}`
}

// ─── Color by event id ────────────────────────────────────────────────────────
const artColors = ['event-violet', 'event-amber', 'event-teal', 'event-rose', 'event-indigo', 'event-sage']
function getColor(id: string) {
  const s = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return artColors[s % artColors.length]
}

// ─── Currency formatter ───────────────────────────────────────────────────────
function fmtCurrency(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100)
}

// ─── Date formatter ───────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Initials ─────────────────────────────────────────────────────────────────
function initials(name: string | null | undefined) {
  if (!name) return '?'
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
const nav = [
  { href: '/',          label: 'Overview',   icon: LayoutDashboard },
  { href: '/tickets',   label: 'My tickets', icon: Ticket          },
  { href: '/orders',    label: 'Orders',     icon: CreditCard      },
  { href: '/rsvps',     label: 'RSVPs',      icon: CalendarDays    },
  { href: '/transfers', label: 'Transfers',  icon: Users           },
]

// ─── Status badge ─────────────────────────────────────────────────────────────
function Status({ children, tone = 'success' }: { children: React.ReactNode; tone?: 'success' | 'neutral' | 'warning' }) {
  return <span className={`status status-${tone}`}><span className="status-dot" />{children}</span>
}

// ─── Event art ───────────────────────────────────────────────────────────────
function EventArt({ eventId, title, small = false }: { eventId: string; title: string; small?: boolean }) {
  const color = getColor(eventId)
  const abbr = title.split(' ').slice(0, 3).map(w => w[0]).join('')
  return (
    <div className={`event-art ${color} ${small ? 'event-art-small' : ''}`}>
      <span>{abbr}</span>
    </div>
  )
}

// ─── Notification icon ────────────────────────────────────────────────────────
function notifIcon(type: string) {
  if (type.includes('ticket'))   return <Check size={14} aria-hidden="true" />
  if (type.includes('payment') || type.includes('order')) return <CreditCard size={14} aria-hidden="true" />
  if (type.includes('transfer')) return <Users size={14} aria-hidden="true" />
  if (type.includes('rsvp'))     return <CalendarDays size={14} aria-hidden="true" />
  return <Bell size={14} aria-hidden="true" />
}

function notifAccent(type: string) {
  if (type.includes('ticket'))  return 'var(--success)'
  if (type.includes('payment') || type.includes('order')) return 'var(--primary)'
  if (type.includes('rsvp'))    return '#6baee0'
  return 'var(--muted-foreground)'
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton({ width = '100%', height = 14, radius = 6 }: { width?: string | number; height?: number; radius?: number }) {
  return <div className="skeleton skeleton-text" style={{ width, height, borderRadius: radius }} />
}

// ─── Sign-in prompt ───────────────────────────────────────────────────────────
function SignInPrompt() {
  return (
    <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="panel" style={{ maxWidth: 400, width: '90%', textAlign: 'center', padding: '40px 32px' }}>
        <div style={{ display: 'grid', placeItems: 'center', width: 56, height: 56, borderRadius: 14, background: 'rgba(215,243,106,0.08)', color: 'var(--primary)', margin: '0 auto 20px' }}>
          <Ticket size={24} aria-hidden="true" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 400, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
          northstar
        </h2>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
          Sign in to see your tickets, orders, and upcoming events.
        </p>
        <a href="/login" className="button button-light" style={{ width: '100%', justifyContent: 'center', minHeight: 42 }}>
          Sign in
        </a>
        <a href="/register" className="button button-outline" style={{ width: '100%', justifyContent: 'center', marginTop: 10, minHeight: 42 }}>
          Create account
        </a>
      </div>
    </div>
  )
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ profile, ticketCount }: { profile: Profile | null; ticketCount: number }) {
  const pathname = usePathname()

  async function handleSignOut() {
    const sb = createClient()
    await sb.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">N</span>
        <span>northstar</span>
      </div>
      <div className="workspace-label">Personal Space</div>
      <nav className="side-nav" aria-label="Primary navigation">
        {nav.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} prefetch className={`nav-item${active ? ' nav-item-active' : ''}`}>
              <Icon aria-hidden="true" />
              {item.label}
              {item.href === '/tickets' && ticketCount > 0 && (
                <span className="nav-count">{ticketCount}</span>
              )}
            </Link>
          )
        })}
      </nav>
      <div className="sidebar-bottom">
        <Link href="/settings" prefetch className="nav-item"><Settings aria-hidden="true" />Settings</Link>
        <div className="profile">
          <div className="avatar" aria-hidden="true">{initials(profile?.full_name)}</div>
          <div>
            <strong>{profile?.full_name ?? <Skeleton width={100} />}</strong>
            <span style={{ color: 'var(--muted-foreground)', fontSize: 11, marginTop: 2, display: 'block' }}>
              {profile ? `role: ${profile.role}` : <Skeleton width={80} />}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            style={{ marginLeft: 'auto', background: 'none', border: 0, color: 'var(--muted-foreground)', cursor: 'pointer', padding: 4 }}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}

// ─── TOPBAR ───────────────────────────────────────────────────────────────────
function Header({ title, eyebrow, subtitle, profile, unreadCount = 0 }: {
  title: string; eyebrow?: string; subtitle?: string
  profile: Profile | null; unreadCount?: number
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()

  return (
    <header className="topbar">
      <button className="mobile-menu" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}>
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <div style={{ flex: 1 }}>
        <div className="eyebrow" style={{ marginBottom: 2 }}>{eyebrow || today}</div>
        <h1>{title}</h1>
        {subtitle && <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '6px 0 0' }}>{subtitle}</p>}
      </div>
      <div className="top-actions">
        <label className="search" aria-label="Search">
          <Search aria-hidden="true" />
          <input placeholder="Search events…" aria-label="Search events" />
        </label>
        <button className="icon-button" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
          <Bell aria-hidden="true" />
          {unreadCount > 0 && <i aria-hidden="true" />}
        </button>
        <div className="avatar avatar-top" aria-label={profile?.full_name ?? 'Profile'} role="img">
          {initials(profile?.full_name)}
        </div>
      </div>
      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation" style={{ top: 72 }}>
          {nav.map(item => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>
          ))}
          <Link href="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>
        </nav>
      )}
    </header>
  )
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
function Overview({ profile, userId }: { profile: Profile | null; userId: string }) {
  const [tickets, setTickets] = useState<TicketWithEvent[] | null>(null)
  const [orders, setOrders] = useState<OrderWithEvent[] | null>(null)
  const [notifications, setNotifications] = useState<Notification[] | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const sb = createClient()
    const now = new Date().toISOString()

    Promise.all([
      sb.from('tickets').select(`
        id, ticket_code, status, qr_token, created_at,
        event:events(id, title, slug, start_at, end_at, venue_name, venue_address, city,
          category:event_categories(name, slug)),
        ticket_type:ticket_types(id, name, price, currency)
      `).eq('user_id', userId).neq('status', 'cancelled').order('created_at', { ascending: false }),

      sb.from('orders').select(`
        id, status, subtotal, fees, total_amount, currency, created_at,
        event:events(id, title, slug, start_at)
      `).eq('user_id', userId).order('created_at', { ascending: false }).limit(5),

      sb.from('notifications').select('*').eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(5),

      sb.from('notifications').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).is('read_at', null),
    ]).then(([t, o, n, uc]) => {
      setTickets((t.data ?? []) as unknown as TicketWithEvent[])
      setOrders((o.data ?? []) as unknown as OrderWithEvent[])
      setNotifications((n.data ?? []) as Notification[])
      setUnreadCount(uc.count ?? 0)
    })
  }, [userId])

  const now = new Date()
  const activeTickets = tickets?.filter(t => t.status === 'active') ?? []
  const nextTicket = activeTickets
    .filter(t => new Date(t.event.start_at) > now)
    .sort((a, b) => new Date(a.event.start_at).getTime() - new Date(b.event.start_at).getTime())[0]
  const upcomingCount = activeTickets.filter(t => new Date(t.event.start_at) > now).length
  const totalSpent = orders?.filter(o => o.status === 'paid').reduce((s, o) => s + o.total_amount, 0) ?? 0
  const paidOrders = orders?.filter(o => o.status === 'paid').length ?? 0

  const nextDate = nextTicket ? new Date(nextTicket.event.start_at) : null

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <>
      <Header
        title={`${greeting}, ${firstName}`}
        subtitle={upcomingCount > 0 ? `You have ${upcomingCount} upcoming event${upcomingCount !== 1 ? 's' : ''}.` : 'No upcoming events right now.'}
        profile={profile}
        unreadCount={unreadCount}
      />
      <main className="content">

        {/* Hero — next event */}
        {tickets === null ? (
          <div className="hero-ticket"><div><Skeleton height={12} width={80} /><div style={{ marginTop: 12 }}><Skeleton height={36} width={240} /></div></div></div>
        ) : nextTicket ? (
          <section className="hero-ticket" aria-label={`Your next event: ${nextTicket.event.title}`}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="eyebrow light" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Sparkles size={10} aria-hidden="true" /> YOUR NEXT EVENT
              </div>
              <h2>{nextTicket.event.title}</h2>
              <p className="hero-meta">
                <CalendarDays aria-hidden="true" />
                {fmtDate(nextTicket.event.start_at)}
                {nextTicket.event.venue_name && (
                  <><span aria-hidden="true" style={{ opacity: 0.5 }}>·</span><MapPin size={12} aria-hidden="true" />{nextTicket.event.venue_name}{nextTicket.event.city ? `, ${nextTicket.event.city}` : ''}</>
                )}
              </p>
              <div className="hero-actions">
                <Link className="button button-light" href={`/tickets/${nextTicket.id}`} prefetch>
                  <QrCode aria-hidden="true" /> View ticket
                </Link>
              </div>
            </div>
            {nextDate && (
              <div className="hero-date" aria-hidden="true">
                <strong>{nextDate.getDate()}</strong>
                <span>{nextDate.toLocaleString('en-US', { month: 'short' }).toUpperCase()}<br />{nextDate.getFullYear()}</span>
              </div>
            )}
          </section>
        ) : (
          <section className="hero-ticket" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <p style={{ color: '#b8c88a', fontSize: 13, margin: '0 0 16px' }}>No upcoming events</p>
              <Link href="/events" className="button button-light" style={{ display: 'inline-flex' }}>
                Browse events
              </Link>
            </div>
          </section>
        )}

        {/* Stats */}
        <div className="stats-row" role="region" aria-label="Your stats">
          <div className="stat-card accent-green">
            <div className="stat-label">Tickets owned</div>
            <div className="stat-value">{tickets === null ? <Skeleton height={28} width={32} /> : activeTickets.length}</div>
            <div className="stat-sub up" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={10} aria-hidden="true" /> Active this season
            </div>
          </div>
          <div className="stat-card accent-amber">
            <div className="stat-label">Upcoming events</div>
            <div className="stat-value">{tickets === null ? <Skeleton height={28} width={24} /> : upcomingCount}</div>
            <div className="stat-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={10} aria-hidden="true" />
              {nextDate ? `Next ${nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No upcoming'}
            </div>
          </div>
          <div className="stat-card accent-blue">
            <div className="stat-label">Total spent</div>
            <div className="stat-value">{orders === null ? <Skeleton height={28} width={60} /> : fmtCurrency(totalSpent)}</div>
            <div className="stat-sub">Across {paidOrders} order{paidOrders !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* Tickets */}
        <div className="section-heading">
          <div><div className="eyebrow">YOUR TICKETS</div><h2>Ready when you are</h2></div>
          <Link href="/tickets" className="text-link" prefetch>View all <ArrowUpRight size={12} aria-hidden="true" /></Link>
        </div>

        {tickets === null ? (
          <div className="ticket-grid"><Skeleton height={194} radius={14} /><Skeleton height={194} radius={14} /></div>
        ) : activeTickets.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '0 0 16px' }}>No tickets yet.</p>
            <Link href="/events" className="button button-light" style={{ display: 'inline-flex', gap: 8 }}>
              <Ticket size={14} /> Browse events
            </Link>
          </div>
        ) : (
          <section className="ticket-grid" aria-label="Your tickets">
            {activeTickets.slice(0, 2).map((t, i) => (
              <Link key={t.id} href={`/tickets/${t.id}`} className={`ticket-card${i === 0 ? ' ticket-featured' : ''}`} prefetch>
                <EventArt eventId={t.event.id} title={t.event.title} />
                <div className="ticket-info">
                  <Status tone={i === 0 ? 'success' : 'neutral'}>{i === 0 ? 'Confirmed' : 'Active'}</Status>
                  <h3>{t.event.title}</h3>
                  <p>{fmtDateShort(t.event.start_at)}<br />{t.event.venue_name ?? t.event.city ?? '—'}</p>
                </div>
                <QrCode className="ticket-qr" aria-hidden="true" />
              </Link>
            ))}
          </section>
        )}

        {/* Bottom grid */}
        <section className="dashboard-grid" aria-label="Dashboard overview">
          {/* Upcoming events list */}
          <div className="panel">
            <div className="panel-heading">
              <div><div className="eyebrow">UPCOMING EVENTS</div><h2>Your schedule</h2></div>
              <Link href="/rsvps" className="text-link" prefetch>Browse <ArrowUpRight size={12} aria-hidden="true" /></Link>
            </div>
            <div className="event-list">
              {tickets === null ? (
                [1,2,3].map(i => <div key={i} className="event-row"><Skeleton height={42} /></div>)
              ) : activeTickets.filter(t => new Date(t.event.start_at) > now).length === 0 ? (
                <p style={{ color: 'var(--muted-foreground)', fontSize: 12, padding: '16px 0' }}>No upcoming events.</p>
              ) : (
                activeTickets
                  .filter(t => new Date(t.event.start_at) > now)
                  .slice(0, 4)
                  .map(t => (
                    <Link key={t.id} href={`/tickets/${t.id}`} className="event-row" prefetch>
                      <EventArt eventId={t.event.id} title={t.event.title} small />
                      <div className="event-copy">
                        <strong>{t.event.title}</strong>
                        <span>{fmtDateShort(t.event.start_at)} · {t.event.venue_name ?? t.event.city ?? '—'}</span>
                      </div>
                      {t.event.category && <span className="event-tag">{t.event.category.name}</span>}
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  ))
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="panel activity">
            <div className="panel-heading">
              <div><div className="eyebrow">RECENT ACTIVITY</div><h2>What's happening</h2></div>
              <Link href="/orders" className="plain-button" aria-label="View all orders"><MoreHorizontal aria-hidden="true" /></Link>
            </div>
            <div className="activity" style={{ marginTop: 4 }}>
              {notifications === null ? (
                [1,2,3].map(i => <div key={i} className="activity-item"><Skeleton height={32} radius={8} width={32} /><div style={{ flex: 1 }}><Skeleton height={12} width="70%" /></div></div>)
              ) : notifications.length === 0 ? (
                <p style={{ color: 'var(--muted-foreground)', fontSize: 12, padding: '16px 0' }}>No recent activity.</p>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className="activity-item">
                    <div className="activity-icon" aria-hidden="true" style={{ color: notifAccent(n.type) }}>
                      {notifIcon(n.type)}
                    </div>
                    <div>
                      <strong>{n.title}</strong>
                      <span>{fmtRelative(n.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

// ─── TICKETS PAGE ─────────────────────────────────────────────────────────────
function TicketsPage({ profile, userId }: { profile: Profile | null; userId: string }) {
  const [tickets, setTickets] = useState<TicketWithEvent[] | null>(null)

  useEffect(() => {
    const sb = createClient()
    sb.from('tickets').select(`
      id, ticket_code, status, qr_token, created_at,
      event:events(id, title, slug, start_at, end_at, venue_name, venue_address, city,
        category:event_categories(name, slug)),
      ticket_type:ticket_types(id, name, price, currency)
    `).eq('user_id', userId).order('created_at', { ascending: false })
      .then(({ data }) => setTickets((data ?? []) as unknown as TicketWithEvent[]))
  }, [userId])

  return (
    <>
      <Header title="My tickets" eyebrow="YOUR COLLECTION" subtitle="All your event tickets in one place." profile={profile} />
      <main className="content">
        <div className="page-intro">
          <p>Everything you need for the events you're going to.</p>
          <Link href="/events" className="button button-light" style={{ display: 'inline-flex', gap: 8 }}>
            <Search aria-hidden="true" /> Find events
          </Link>
        </div>

        {tickets === null ? (
          <div className="ticket-grid ticket-grid-wide">{[1,2,3].map(i => <Skeleton key={i} height={194} radius={14} />)}</div>
        ) : tickets.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '0 0 16px' }}>You don't have any tickets yet.</p>
            <Link href="/events" className="button button-light" style={{ display: 'inline-flex', gap: 8 }}>Browse events</Link>
          </div>
        ) : (
          <div className="ticket-grid ticket-grid-wide">
            {tickets.map((t, i) => (
              <Link key={t.id} href={`/tickets/${t.id}`} className={`ticket-card${i === 0 ? ' ticket-featured' : ''}`} prefetch>
                <EventArt eventId={t.event.id} title={t.event.title} />
                <div className="ticket-info">
                  <Status tone={t.status === 'active' ? 'success' : t.status === 'used' ? 'neutral' : 'warning'}>
                    {t.status === 'active' ? 'Confirmed' : t.status === 'used' ? 'Used' : t.status}
                  </Status>
                  <h3>{t.event.title}</h3>
                  <p>{fmtDateShort(t.event.start_at)}<br />{t.event.venue_name ?? t.event.city ?? '—'}</p>
                </div>
                <QrCode className="ticket-qr" aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  )
}

// ─── TICKET DETAIL ────────────────────────────────────────────────────────────
function TicketDetail({ profile, userId, ticketId }: { profile: Profile | null; userId: string; ticketId: string }) {
  const [ticket, setTicket] = useState<TicketWithEvent | null | 'loading'>('loading')

  useEffect(() => {
    const sb = createClient()
    sb.from('tickets').select(`
      id, ticket_code, status, qr_token, created_at,
      event:events(id, title, slug, start_at, end_at, venue_name, venue_address, city,
        category:event_categories(name, slug)),
      ticket_type:ticket_types(id, name, price, currency)
    `).eq('id', ticketId).eq('user_id', userId).single()
      .then(({ data }) => setTicket(data as unknown as TicketWithEvent | null))
  }, [userId, ticketId])

  if (ticket === 'loading') {
    return <><Header title="Loading…" profile={profile} /><main className="content"><Skeleton height={400} radius={18} /></main></>
  }
  if (!ticket) {
    return <><Header title="Ticket not found" profile={profile} /><main className="content detail-content">
      <Link href="/tickets" className="back-link" prefetch>← Back to tickets</Link>
      <div className="panel" style={{ marginTop: 24, textAlign: 'center', padding: '40px 24px' }}>
        <AlertCircle size={32} style={{ color: 'var(--error)', margin: '0 auto 12px', display: 'block' }} />
        <p style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>Ticket not found or you don't have access to it.</p>
      </div>
    </main></>
  }

  const startDate = new Date(ticket.event.start_at)
  const endDate = new Date(ticket.event.end_at)

  return (
    <>
      <Header
        title={ticket.event.title}
        eyebrow={`MY TICKETS / ${ticket.event.title.toUpperCase()}`}
        profile={profile}
      />
      <main className="content detail-content">
        <Link href="/tickets" className="back-link" prefetch>← Back to tickets</Link>
        <section className="digital-ticket" aria-label="Digital ticket">
          <div className="digital-top">
            <div>
              <Status>{ticket.status === 'active' ? 'Confirmed' : ticket.status}</Status>
              <h2>{ticket.event.title}</h2>
              <p>{startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} · {startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}–{endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p>
              {ticket.event.venue_name && <p>{ticket.event.venue_name}{ticket.event.venue_address ? ` · ${ticket.event.venue_address}` : ''}{ticket.event.city ? `, ${ticket.event.city}` : ''}</p>}
            </div>
            <EventArt eventId={ticket.event.id} title={ticket.event.title} small />
          </div>
          <div className="qr-box">
            <div className="qr-pattern"><QrCode aria-label="Ticket QR code" /></div>
            <strong>Scan at entry</strong>
            <span>Ticket ID: {ticket.ticket_code}</span>
          </div>
          <div className="digital-bottom">
            <div><span>Attendee</span><strong>{profile?.full_name ?? '—'}</strong></div>
            <div><span>Type</span><strong>{ticket.ticket_type.name}</strong></div>
            <div><span>Price</span><strong>{ticket.ticket_type.price === 0 ? 'Free' : fmtCurrency(ticket.ticket_type.price, ticket.ticket_type.currency)}</strong></div>
          </div>
        </section>
        <div className="detail-actions">
          <button className="button button-dark"><Download aria-hidden="true" />Add to wallet</button>
        </div>
      </main>
    </>
  )
}

// ─── ORDERS PAGE ──────────────────────────────────────────────────────────────
function OrdersPage({ profile, userId }: { profile: Profile | null; userId: string }) {
  const [orders, setOrders] = useState<OrderWithEvent[] | null>(null)

  useEffect(() => {
    const sb = createClient()
    sb.from('orders').select(`
      id, status, subtotal, fees, total_amount, currency, created_at,
      event:events(id, title, slug, start_at)
    `).eq('user_id', userId).order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data ?? []) as unknown as OrderWithEvent[]))
  }, [userId])

  return (
    <>
      <Header title="Orders" eyebrow="YOUR PURCHASES" subtitle="A record of your ticket purchases and receipts." profile={profile} />
      <main className="content">
        {orders === null ? (
          <div className="panel list-panel">{[1,2,3].map(i => <div key={i} className="order-row"><Skeleton height={40} /></div>)}</div>
        ) : orders.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>No orders yet.</p>
          </div>
        ) : (
          <section className="panel list-panel" aria-label="Orders">
            {orders.map(o => (
              <div key={o.id} className="order-row">
                <div className="order-icon" aria-hidden="true"><CreditCard size={14} /></div>
                <div className="event-copy">
                  <strong>Order #{o.id.slice(0, 8).toUpperCase()}</strong>
                  <span>{o.event.title} · {fmtDateShort(o.created_at)}</span>
                </div>
                <Status tone={o.status === 'paid' ? 'success' : o.status === 'pending' ? 'warning' : 'neutral'}>
                  {fmtCurrency(o.total_amount, o.currency)}
                </Status>
                <ChevronRight size={15} aria-hidden="true" />
              </div>
            ))}
          </section>
        )}
      </main>
    </>
  )
}

// ─── RSVPs PAGE ───────────────────────────────────────────────────────────────
function RSVPsPage({ profile, userId }: { profile: Profile | null; userId: string }) {
  const [rsvps, setRsvps] = useState<RSVPWithEvent[] | null>(null)

  useEffect(() => {
    const sb = createClient()
    sb.from('registrations').select(`
      id, status, created_at,
      event:events(id, title, slug, start_at, end_at, venue_name, city,
        category:event_categories(name, slug))
    `).eq('user_id', userId).order('created_at', { ascending: false })
      .then(({ data }) => setRsvps((data ?? []) as unknown as RSVPWithEvent[]))
  }, [userId])

  return (
    <>
      <Header title="RSVPs" eyebrow="YOUR EVENTS" subtitle="Events you've said yes to." profile={profile} />
      <main className="content">
        {rsvps === null ? (
          <div className="panel list-panel">{[1,2,3].map(i => <div key={i} className="order-row"><Skeleton height={40} /></div>)}</div>
        ) : rsvps.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>No RSVPs yet.</p>
            <Link href="/events" className="button button-light" style={{ display: 'inline-flex', marginTop: 16 }}>Browse events</Link>
          </div>
        ) : (
          <section className="panel list-panel" aria-label="RSVPs">
            {rsvps.map(r => (
              <div key={r.id} className="order-row">
                <div className="order-icon" aria-hidden="true"><CalendarDays size={14} /></div>
                <div className="event-copy">
                  <strong>{r.event.title}</strong>
                  <span>{fmtDateShort(r.event.start_at)} · {r.event.venue_name ?? r.event.city ?? '—'}</span>
                </div>
                <Status tone={r.status === 'confirmed' ? 'success' : r.status === 'waitlisted' ? 'warning' : 'neutral'}>
                  {r.status}
                </Status>
                <ChevronRight size={15} aria-hidden="true" />
              </div>
            ))}
          </section>
        )}
      </main>
    </>
  )
}

// ─── TRANSFERS PAGE ───────────────────────────────────────────────────────────
function TransfersPage({ profile, userId }: { profile: Profile | null; userId: string }) {
  const [transfers, setTransfers] = useState<Transfer[] | null>(null)

  useEffect(() => {
    const sb = createClient()
    sb.from('ticket_transfers').select(`
      id, status, created_at,
      ticket:tickets(id, ticket_code, event:events(id, title, start_at, venue_name)),
      from_user:profiles!ticket_transfers_from_user_id_fkey(id, full_name),
      to_user:profiles!ticket_transfers_to_user_id_fkey(id, full_name)
    `).or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`).order('created_at', { ascending: false })
      .then(({ data }) => setTransfers((data ?? []) as unknown as Transfer[]))
  }, [userId])

  return (
    <>
      <Header title="Transfers" eyebrow="TICKET SHARING" subtitle="Share tickets with friends, without the group chat chaos." profile={profile} />
      <main className="content">
        {transfers === null ? (
          <div className="panel list-panel">{[1,2].map(i => <div key={i} className="order-row"><Skeleton height={40} /></div>)}</div>
        ) : transfers.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '40px 24px' }}>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 13, margin: '0 0 8px' }}>No active transfers.</p>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 12 }}>Tickets you send or receive will appear here.</p>
          </div>
        ) : (
          <section className="panel list-panel" aria-label="Transfers">
            {transfers.map(t => (
              <div key={t.id} className="order-row">
                <div className="order-icon" aria-hidden="true"><Users size={14} /></div>
                <div className="event-copy">
                  <strong>{t.ticket.event.title}</strong>
                  <span>
                    {t.from_user.id === userId ? `To: ${t.to_user.full_name ?? 'Unknown'}` : `From: ${t.from_user.full_name ?? 'Unknown'}`}
                    {' · '}{fmtRelative(t.created_at)}
                  </span>
                </div>
                <Status tone={t.status === 'completed' ? 'success' : t.status === 'pending' ? 'warning' : 'neutral'}>
                  {t.status}
                </Status>
                <ChevronRight size={15} aria-hidden="true" />
              </div>
            ))}
          </section>
        )}
      </main>
    </>
  )
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ profile, userId }: { profile: Profile | null; userId: string }) {
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ''))
  }, [userId])

  async function handleSignOut() {
    const sb = createClient()
    await sb.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      <Header title="Settings" eyebrow="ACCOUNT" subtitle="Manage your account and notification preferences." profile={profile} />
      <main className="content">
        <section className="settings-panel" aria-label="Account settings">
          <div className="setting-row">
            <div>
              <strong>Personal information</strong>
              <span>{profile?.full_name ?? '—'} · {email || '—'}</span>
            </div>
            <button className="button button-outline">Edit</button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Account role</strong>
              <span>{profile?.role ?? '—'}</span>
            </div>
          </div>
          <div className="setting-row">
            <div>
              <strong>Email notifications</strong>
              <span>Receive event reminders and updates</span>
            </div>
            <button className="toggle on" aria-label="Toggle email notifications" role="switch" aria-checked="true">
              <span />
            </button>
          </div>
          <div className="setting-row">
            <div>
              <strong>Privacy</strong>
              <span>Manage your data and connected apps</span>
            </div>
            <ChevronRight size={16} style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
          </div>
          <div className="setting-row" style={{ borderBottom: 0 }}>
            <div>
              <strong>Sign out</strong>
              <span>Sign out of your account on this device</span>
            </div>
            <button className="button button-outline" onClick={handleSignOut} style={{ color: 'var(--error)', borderColor: 'var(--error)' }}>
              Sign out
            </button>
          </div>
        </section>
      </main>
    </>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function AttendeeDashboard() {
  const pathname = usePathname()
  const { user, profile } = useAuth()

  // Still loading auth state
  if (user === undefined) {
    return (
      <div className="app-shell" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="brand-mark" style={{ width: 32, height: 32, fontSize: 18 }}>N</div>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>Loading…</p>
        </div>
      </div>
    )
  }

  // Not signed in
  if (user === null) return <SignInPrompt />

  const userId = user.id

  // Count active tickets for nav badge (derived from overview state — we pass 0 as default,
  // the Overview component itself updates this live)
  let content: React.ReactNode
  let ticketCount = 0

  // Route matching
  const ticketMatch = pathname.match(/^\/tickets\/(.+)$/)

  if (ticketMatch) {
    content = <TicketDetail profile={profile} userId={userId} ticketId={ticketMatch[1]} />
  } else if (pathname === '/tickets') {
    content = <TicketsPage profile={profile} userId={userId} />
  } else if (pathname === '/orders') {
    content = <OrdersPage profile={profile} userId={userId} />
  } else if (pathname === '/rsvps') {
    content = <RSVPsPage profile={profile} userId={userId} />
  } else if (pathname === '/transfers') {
    content = <TransfersPage profile={profile} userId={userId} />
  } else if (pathname === '/settings') {
    content = <SettingsPage profile={profile} userId={userId} />
  } else {
    content = <Overview profile={profile} userId={userId} />
  }

  return (
    <div className="app-shell">
      <Sidebar profile={profile} ticketCount={ticketCount} />
      <div className="main">{content}</div>
    </div>
  )
}

export { AttendeeDashboard }
