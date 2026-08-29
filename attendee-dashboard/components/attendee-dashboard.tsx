'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CreditCard,
  Download,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  QrCode,
  Search,
  Settings,
  Ticket,
  Users,
  X,
  TrendingUp,
  Clock,
  MapPin,
  Sparkles,
} from 'lucide-react'

const events = [
  { id: 'future-sound',  title: 'Future Sound',          date: 'Oct 18, 2025', location: 'Brooklyn Mirage',  tag: 'Music',      color: 'event-violet' },
  { id: 'design-week',   title: 'New York Design Week',   date: 'Nov 04, 2025', location: 'Industry City',    tag: 'Conference', color: 'event-amber'  },
  { id: 'the-long-now',  title: 'The Long Now',           date: 'Dec 12, 2025', location: 'Public Records',   tag: 'Culture',    color: 'event-teal'   },
]

const nav = [
  { href: '/',          label: 'Overview',    icon: LayoutDashboard },
  { href: '/tickets',   label: 'My tickets',  icon: Ticket          },
  { href: '/orders',    label: 'Orders',      icon: CreditCard      },
  { href: '/rsvps',     label: 'RSVPs',       icon: CalendarDays    },
  { href: '/transfers', label: 'Transfers',   icon: Users           },
]

/* ── helpers ─────────────────────────────────────────────────────────────── */
function Status({ children, tone = 'success' }: { children: React.ReactNode; tone?: 'success' | 'neutral' | 'warning' }) {
  return (
    <span className={`status status-${tone}`}>
      <span className="status-dot" />{children}
    </span>
  )
}

function EventArtwork({ event, small = false }: { event: typeof events[number]; small?: boolean }) {
  return (
    <div className={`event-art ${event.color} ${small ? 'event-art-small' : ''}`}>
      <span>{event.title.split(' ').map((w) => w[0]).join('')}</span>
    </div>
  )
}

/* ── SIDEBAR ─────────────────────────────────────────────────────────────── */
function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">N</span>
        <span>northstar</span>
      </div>

      <div className="workspace-label">Personal Space</div>

      {/* Nav */}
      <nav className="side-nav" aria-label="Primary navigation">
        {nav.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className={`nav-item${active ? ' nav-item-active' : ''}`}
            >
              <Icon aria-hidden="true" />
              {item.label}
              {item.href === '/tickets' && <span className="nav-count">2</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <Link href="/settings" prefetch className="nav-item">
          <Settings aria-hidden="true" />
          Settings
        </Link>
        <div className="profile">
          <div className="avatar" aria-hidden="true">JD</div>
          <div>
            <strong>Jordan Davis</strong>
            <span>jordan@email.com</span>
          </div>
          <MoreHorizontal aria-hidden="true" />
        </div>
      </div>
    </aside>
  )
}

/* ── TOPBAR ──────────────────────────────────────────────────────────────── */
function Header({ title, eyebrow, subtitle }: { title: string; eyebrow?: string; subtitle?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="topbar">
      {/* Mobile toggle */}
      <button
        className="mobile-menu"
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      {/* Title area */}
      <div style={{ flex: 1 }}>
        <div className="eyebrow" style={{ marginBottom: 2 }}>
          {eyebrow || 'SATURDAY, SEPTEMBER 20, 2025'}
        </div>
        <h1>{title}</h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '6px 0 0' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="top-actions">
        <label className="search" aria-label="Search">
          <Search aria-hidden="true" />
          <input placeholder="Search events…" aria-label="Search events" />
        </label>
        <button className="icon-button" aria-label="Notifications">
          <Bell aria-hidden="true" />
          <i aria-hidden="true" />
        </button>
        <div className="avatar avatar-top" aria-label="Jordan Davis" role="img">JD</div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav
          className="mobile-nav"
          aria-label="Mobile navigation"
          style={{ top: 72 }}
        >
          {nav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>
        </nav>
      )}
    </header>
  )
}

/* ── OVERVIEW ────────────────────────────────────────────────────────────── */
function Overview() {
  return (
    <>
      <Header
        title="Good morning, Jordan"
        subtitle="You have 2 upcoming events this season."
      />
      <main className="content">

        {/* Hero next event */}
        <section className="hero-ticket" aria-label="Your next event">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="eyebrow light" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Sparkles size={10} aria-hidden="true" />
              YOUR NEXT EVENT
            </div>
            <h2>Future Sound</h2>
            <p className="hero-meta">
              <CalendarDays aria-hidden="true" />
              Saturday, October 18, 2025
              <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
              <MapPin size={12} aria-hidden="true" />
              Brooklyn Mirage
            </p>
            <div className="hero-actions">
              <Link className="button button-light" href="/tickets/future-sound" prefetch>
                <QrCode aria-hidden="true" />
                View ticket
              </Link>
              <button className="button button-ghost">
                <Download aria-hidden="true" />
                Add to wallet
              </button>
            </div>
          </div>
          <div className="hero-date" aria-hidden="true">
            <strong>18</strong>
            <span>OCT<br />2025</span>
          </div>
        </section>

        {/* Stats row */}
        <div className="stats-row" role="region" aria-label="Your stats">
          <div className="stat-card accent-green">
            <div className="stat-label">Tickets owned</div>
            <div className="stat-value">3</div>
            <div className="stat-sub up" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendingUp size={10} aria-hidden="true" /> Active this season
            </div>
          </div>
          <div className="stat-card accent-amber">
            <div className="stat-label">Upcoming events</div>
            <div className="stat-value">2</div>
            <div className="stat-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={10} aria-hidden="true" /> Next in 18 days
            </div>
          </div>
          <div className="stat-card accent-blue">
            <div className="stat-label">Total spent</div>
            <div className="stat-value">$198</div>
            <div className="stat-sub">Across 3 orders</div>
          </div>
        </div>

        {/* Ticket grid */}
        <div className="section-heading">
          <div>
            <div className="eyebrow">YOUR TICKETS</div>
            <h2>Ready when you are</h2>
          </div>
          <Link href="/tickets" className="text-link" prefetch>
            View all <ArrowUpRight size={12} aria-hidden="true" />
          </Link>
        </div>
        <section className="ticket-grid" aria-label="Your tickets">
          <TicketCard event={events[0]} featured />
          <TicketCard event={events[1]} />
        </section>

        {/* Dashboard bottom grid */}
        <section className="dashboard-grid" aria-label="Dashboard overview">
          {/* Upcoming events */}
          <div className="panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">UPCOMING EVENTS</div>
                <h2>Find your next thing</h2>
              </div>
              <Link href="/rsvps" className="text-link" prefetch>
                Browse <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            </div>
            <div className="event-list">
              {events.map((event) => (
                <Link
                  href={`/tickets/${event.id}`}
                  className="event-row"
                  key={event.id}
                  prefetch
                >
                  <EventArtwork event={event} small />
                  <div className="event-copy">
                    <strong>{event.title}</strong>
                    <span>{event.date} · {event.location}</span>
                  </div>
                  <span className="event-tag">{event.tag}</span>
                  <ChevronRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="panel activity">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">RECENT ACTIVITY</div>
                <h2>What's happening</h2>
              </div>
              <button className="plain-button" aria-label="More activity">
                <MoreHorizontal aria-hidden="true" />
              </button>
            </div>
            <div className="activity" style={{ marginTop: 4 }}>
              {[
                { icon: <Check size={14} />,      title: 'Ticket added to wallet',       sub: 'Future Sound · Just now',           accent: 'var(--success)' },
                { icon: <CreditCard size={14} />, title: 'Order #NS-10482 confirmed',    sub: 'Future Sound · Sep 02',             accent: 'var(--primary)' },
                { icon: <Users size={14} />,      title: 'RSVP accepted',               sub: 'New York Design Week · Aug 28',     accent: 'var(--info, #6baee0)' },
              ].map((item) => (
                <div className="activity-item" key={item.title}>
                  <div
                    className="activity-icon"
                    aria-hidden="true"
                    style={{ color: item.accent }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

/* ── TICKET CARD ─────────────────────────────────────────────────────────── */
function TicketCard({ event, featured = false }: { event: typeof events[number]; featured?: boolean }) {
  return (
    <Link
      href={`/tickets/${event.id}`}
      className={`ticket-card${featured ? ' ticket-featured' : ''}`}
      prefetch
    >
      <EventArtwork event={event} />
      <div className="ticket-info">
        <Status tone={featured ? 'success' : 'neutral'}>
          {featured ? 'Confirmed' : 'Going'}
        </Status>
        <h3>{event.title}</h3>
        <p>{event.date}<br />{event.location}</p>
      </div>
      <QrCode className="ticket-qr" aria-hidden="true" />
    </Link>
  )
}

/* ── TICKETS PAGE ────────────────────────────────────────────────────────── */
function TicketsPage() {
  return (
    <>
      <Header title="My tickets" eyebrow="YOUR COLLECTION" subtitle="All your event tickets in one place." />
      <main className="content">
        <div className="page-intro">
          <p>Everything you need for the events you're going to.</p>
          <button className="button button-light">
            <Search aria-hidden="true" />
            Find events
          </button>
        </div>
        <div className="ticket-grid ticket-grid-wide">
          {events.map((event, i) => (
            <TicketCard key={event.id} event={event} featured={i === 0} />
          ))}
        </div>
      </main>
    </>
  )
}

/* ── TICKET DETAIL ───────────────────────────────────────────────────────── */
function TicketDetail() {
  return (
    <>
      <Header title="Future Sound" eyebrow="MY TICKETS / FUTURE SOUND" />
      <main className="content detail-content">
        <Link href="/tickets" className="back-link" prefetch>
          ← Back to tickets
        </Link>
        <section className="digital-ticket" aria-label="Digital ticket">
          <div className="digital-top">
            <div>
              <Status>Confirmed</Status>
              <h2>Future Sound</h2>
              <p>Saturday, October 18, 2025 · 8:00 PM</p>
              <p>Brooklyn Mirage · 140 Stewart Ave, Brooklyn</p>
            </div>
            <EventArtwork event={events[0]} small />
          </div>
          <div className="qr-box">
            <div className="qr-pattern"><QrCode aria-label="Ticket QR code" /></div>
            <strong>Scan at entry</strong>
            <span>Ticket ID: NS-FS-28491</span>
          </div>
          <div className="digital-bottom">
            <div><span>Attendee</span><strong>Jordan Davis</strong></div>
            <div><span>Type</span><strong>General Admission</strong></div>
            <div><span>Gate</span><strong>East entrance</strong></div>
          </div>
        </section>
        <div className="detail-actions">
          <button className="button button-dark">
            <Download aria-hidden="true" />
            Add to wallet
          </button>
          <button className="button button-outline">Transfer ticket</button>
        </div>
      </main>
    </>
  )
}

/* ── SIMPLE PAGES ────────────────────────────────────────────────────────── */
function SimplePage({
  title, eyebrow, kind,
}: {
  title: string
  eyebrow: string
  kind: 'orders' | 'rsvps' | 'transfers' | 'settings'
}) {
  const rows =
    kind === 'orders'
      ? events.slice(0, 2).map((e, i) => ({
          title: `Order #NS-1048${2 - i}`,
          sub: `${e.title} · ${e.date}`,
          right: i === 0 ? '$89.00' : '$42.50',
        }))
      : kind === 'rsvps'
      ? events.map((e) => ({ title: e.title, sub: `${e.date} · ${e.location}`, right: 'Going' }))
      : [{ title: 'No active transfers', sub: 'Tickets you send or receive will appear here.', right: '' }]

  const subtitles: Record<string, string> = {
    orders: 'A record of your ticket purchases and receipts.',
    rsvps: 'Events you\'ve said yes to.',
    transfers: 'Share tickets with friends, without the group chat chaos.',
    settings: 'Manage your account and notification preferences.',
  }

  return (
    <>
      <Header title={title} eyebrow={eyebrow} subtitle={subtitles[kind]} />
      <main className="content">
        {kind === 'settings' ? (
          <section className="settings-panel" aria-label="Account settings">
            <div className="setting-row">
              <div>
                <strong>Personal information</strong>
                <span>Jordan Davis · jordan@email.com</span>
              </div>
              <button className="button button-outline">Edit</button>
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
          </section>
        ) : (
          <section className="panel list-panel" aria-label={title}>
            {rows.map((row) => (
              <div className="order-row" key={row.title}>
                <div className="order-icon" aria-hidden="true">
                  {kind === 'orders'   ? <CreditCard size={14} />  :
                   kind === 'rsvps'    ? <CalendarDays size={14} /> :
                                         <Users size={14} />}
                </div>
                <div className="event-copy">
                  <strong>{row.title}</strong>
                  <span>{row.sub}</span>
                </div>
                {row.right && (
                  <Status tone={kind === 'orders' ? 'neutral' : 'success'}>
                    {row.right}
                  </Status>
                )}
                <ChevronRight size={15} aria-hidden="true" />
              </div>
            ))}
          </section>
        )}
      </main>
    </>
  )
}

/* ── ROOT ────────────────────────────────────────────────────────────────── */
export default function AttendeeDashboard() {
  const pathname = usePathname()

  let content: React.ReactNode

  if (pathname === '/tickets') {
    content = <TicketsPage />
  } else if (pathname.startsWith('/tickets/')) {
    content = <TicketDetail />
  } else {
    const pageConfig: Record<string, [string, string, 'orders' | 'rsvps' | 'transfers' | 'settings']> = {
      '/orders':    ['Orders',    'YOUR PURCHASES',  'orders'],
      '/rsvps':     ['RSVPs',     'YOUR EVENTS',     'rsvps'],
      '/transfers': ['Transfers', 'TICKET SHARING',  'transfers'],
      '/settings':  ['Settings',  'ACCOUNT',         'settings'],
    }
    const cfg = pageConfig[pathname]
    content = cfg
      ? <SimplePage title={cfg[0]} eyebrow={cfg[1]} kind={cfg[2]} />
      : <Overview />
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main">{content}</div>
    </div>
  )
}

export { AttendeeDashboard }
