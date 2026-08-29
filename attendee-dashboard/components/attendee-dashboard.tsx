'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo } from 'react'
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
} from 'lucide-react'

const events = [
  { id: 'future-sound', title: 'Future Sound', date: 'Oct 18, 2025', location: 'Brooklyn Mirage', tag: 'Music', color: 'event-violet' },
  { id: 'design-week', title: 'New York Design Week', date: 'Nov 04, 2025', location: 'Industry City', tag: 'Conference', color: 'event-amber' },
  { id: 'the-long-now', title: 'The Long Now', date: 'Dec 12, 2025', location: 'Public Records', tag: 'Culture', color: 'event-teal' },
]

const nav = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/tickets', label: 'My tickets', icon: Ticket },
  { href: '/orders', label: 'Orders', icon: CreditCard },
  { href: '/rsvps', label: 'RSVPs', icon: CalendarDays },
  { href: '/transfers', label: 'Transfers', icon: Users },
]

function Status({ children, tone = 'success' }: { children: React.ReactNode; tone?: 'success' | 'neutral' | 'warning' }) {
  return <span className={`status status-${tone}`}><span className="status-dot" />{children}</span>
}

function EventArtwork({ event, small = false }: { event: typeof events[number]; small?: boolean }) {
  return <div className={`event-art ${event.color} ${small ? 'event-art-small' : ''}`}><span>{event.title.split(' ').map((word) => word[0]).join('')}</span></div>
}

function Sidebar() {
  const pathname = usePathname()
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark">N</span><span>northstar</span></div>
    <div className="workspace-label">PERSONAL SPACE</div>
    <nav className="side-nav" aria-label="Primary navigation">
      {nav.map((item) => {
        const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
        const Icon = item.icon
        return <Link className={`nav-item ${active ? 'nav-item-active' : ''}`} href={item.href} key={item.href} prefetch={true}><Icon />{item.label}{item.href === '/tickets' && <span className="nav-count">2</span>}</Link>
      })}
    </nav>
    <div className="sidebar-bottom"><Link className="nav-item" href="/settings" prefetch={true}><Settings />Settings</Link><div className="profile"><div className="avatar">JD</div><div><strong>Jordan Davis</strong><span>jordan@email.com</span></div><MoreHorizontal /></div></div>
  </aside>
}

function Header({ title, eyebrow }: { title: string; eyebrow?: string }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return <header className="topbar"><button className="mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button><div><div className="eyebrow">{eyebrow || 'SATURDAY, SEPTEMBER 20, 2025'}</div><h1>{title}</h1></div><div className="top-actions"><label className="search"><Search /><input aria-label="Search" placeholder="Search" /></label><button className="icon-button" aria-label="Notifications"><Bell /><i /></button><div className="avatar avatar-top">JD</div></div>{menuOpen && <div className="mobile-nav">{nav.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}<Link href="/settings">Settings</Link></div>}</header>
}

function Overview() {
  return <><Header title="Good morning, Jordan" /><main className="content">
    <section className="hero-ticket"><div><div className="eyebrow light">YOUR NEXT EVENT</div><h2>Future Sound</h2><p className="hero-meta"><CalendarDays /> Saturday, October 18, 2025 <span>•</span> Brooklyn Mirage</p><div className="hero-actions"><Link className="button button-light" href="/tickets/future-sound" prefetch={true}><QrCode />View ticket</Link><button className="button button-ghost"><Download />Add to wallet</button></div></div><div className="hero-date"><strong>18</strong><span>OCT<br />2025</span></div></section>
    <div className="section-heading"><div><div className="eyebrow">YOUR TICKETS</div><h2>Ready when you are</h2></div><Link href="/tickets" className="text-link" prefetch={true}>View all <ArrowUpRight /></Link></div>
    <section className="ticket-grid"><TicketCard event={events[0]} featured /><TicketCard event={events[1]} /></section>
    <section className="dashboard-grid"><div className="panel"><div className="panel-heading"><div><div className="eyebrow">UPCOMING EVENTS</div><h2>Find your next thing</h2></div><Link href="/rsvps" className="text-link" prefetch={true}>Browse events <ArrowUpRight /></Link></div><div className="event-list">{events.map((event) => <Link href={`/tickets/${event.id}`} className="event-row" key={event.id} prefetch={true}><EventArtwork event={event} small /><div className="event-copy"><strong>{event.title}</strong><span>{event.date} · {event.location}</span></div><span className="event-tag">{event.tag}</span><ChevronRight /></Link>)}</div></div><div className="panel activity"><div className="panel-heading"><div><div className="eyebrow">RECENT ACTIVITY</div><h2>What&apos;s happening</h2></div><button className="plain-button" aria-label="More activity"><MoreHorizontal /></button></div><div className="activity-item"><div className="activity-icon"><Check /></div><div><strong>Ticket added to wallet</strong><span>Future Sound · Just now</span></div></div><div className="activity-item"><div className="activity-icon"><CreditCard /></div><div><strong>Order #NS-10482 confirmed</strong><span>Future Sound · Sep 02</span></div></div><div className="activity-item"><div className="activity-icon"><Users /></div><div><strong>RSVP accepted</strong><span>New York Design Week · Aug 28</span></div></div></div></section>
  </main></>
}

function TicketCard({ event, featured = false }: { event: typeof events[number]; featured?: boolean }) {
  return <Link href={`/tickets/${event.id}`} className={`ticket-card ${featured ? 'ticket-featured' : ''}`} prefetch={true}><EventArtwork event={event} /><div className="ticket-info"><Status>{featured ? 'Confirmed' : 'Going'}</Status><h3>{event.title}</h3><p>{event.date}<br />{event.location}</p></div><QrCode className="ticket-qr" /></Link>
}

function TicketsPage() { return <><Header title="My tickets" eyebrow="YOUR COLLECTION" /><main className="content"><div className="page-intro"><p>Everything you need for the events you&apos;re going to.</p><button className="button button-dark"><Search />Find events</button></div><div className="ticket-grid ticket-grid-wide">{events.map((event, i) => <TicketCard key={event.id} event={event} featured={i === 0} />)}</div></main></> }
function TicketDetail() { return <><Header title="Future Sound" eyebrow="MY TICKETS / FUTURE SOUND" /><main className="content detail-content"><Link href="/tickets" className="back-link" prefetch={true}>← Back to tickets</Link><section className="digital-ticket"><div className="digital-top"><div><Status>Confirmed</Status><h2>Future Sound</h2><p>Saturday, October 18, 2025 · 8:00 PM</p><p>Brooklyn Mirage · 140 Stewart Ave, Brooklyn</p></div><EventArtwork event={events[0]} small /></div><div className="qr-box"><div className="qr-pattern"><QrCode /></div><strong>Scan at entry</strong><span>Ticket ID: NS-FS-28491</span></div><div className="digital-bottom"><div><span>ATTENDEE</span><strong>Jordan Davis</strong></div><div><span>TYPE</span><strong>General Admission</strong></div><div><span>GATE</span><strong>East entrance</strong></div></div></section><div className="detail-actions"><button className="button button-dark"><Download />Add to wallet</button><button className="button button-outline">Transfer ticket</button></div></main></> }
function SimplePage({ title, eyebrow, kind }: { title: string; eyebrow: string; kind: 'orders' | 'rsvps' | 'transfers' | 'settings' }) { const rows = kind === 'orders' ? events.slice(0, 2).map((e, i) => ({ title: `Order #NS-1048${2 - i}`, sub: `${e.title} · ${e.date}`, right: i === 0 ? '$89.00' : '$42.50' })) : kind === 'rsvps' ? events.map((e) => ({ title: e.title, sub: `${e.date} · ${e.location}`, right: 'Going' })) : [{ title: 'No active transfers', sub: 'Tickets you send or receive will appear here.', right: '' }]; return <><Header title={title} eyebrow={eyebrow} /><main className="content"><div className="page-intro"><p>{kind === 'orders' ? 'A record of your ticket purchases and receipts.' : kind === 'rsvps' ? 'Events you&apos;ve said yes to.' : kind === 'transfers' ? 'Share tickets with friends, without the group chat chaos.' : 'Manage your account and notification preferences.'}</p></div>{kind === 'settings' ? <section className="settings-panel"><div className="setting-row"><div><strong>Personal information</strong><span>Jordan Davis · jordan@email.com</span></div><button className="button button-outline">Edit</button></div><div className="setting-row"><div><strong>Email notifications</strong><span>Receive event reminders and updates</span></div><div className="toggle on"><span /></div></div><div className="setting-row"><div><strong>Privacy</strong><span>Manage your data and connected apps</span></div><ChevronRight /></div></section> : <section className="panel list-panel">{rows.map((row) => <div className="order-row" key={row.title}><div className="order-icon">{kind === 'orders' ? <CreditCard /> : kind === 'rsvps' ? <CalendarDays /> : <Users />}</div><div className="event-copy"><strong>{row.title}</strong><span>{row.sub}</span></div>{row.right && <Status tone={kind === 'orders' ? 'neutral' : 'success'}>{row.right}</Status>}<ChevronRight /></div>)}</section>}</main></> }

export default function AttendeeDashboard() { const pathname = usePathname(); if (pathname === '/tickets') return <div className="app-shell"><Sidebar /><div className="main"><TicketsPage /></div></div>; if (pathname.startsWith('/tickets/')) return <div className="app-shell"><Sidebar /><div className="main"><TicketDetail /></div></div>; const config = pathname === '/orders' ? ['Orders', 'YOUR PURCHASES', 'orders'] : pathname === '/rsvps' ? ['RSVPs', 'YOUR EVENTS', 'rsvps'] : pathname === '/transfers' ? ['Transfers', 'TICKET SHARING', 'transfers'] : pathname === '/settings' ? ['Settings', 'ACCOUNT', 'settings'] : null; return <div className="app-shell"><Sidebar /><div className="main">{config ? <SimplePage title={config[0]} eyebrow={config[1]} kind={config[2] as 'orders' | 'rsvps' | 'transfers' | 'settings'} /> : <Overview />}</div></div> }

export { AttendeeDashboard }

void QrCode
void MoreHorizontal
void ArrowUpRight
void ChevronRight
void CreditCard
void Bell
void Menu
void X
void Search
void Download
void Check
void Users
void CalendarDays
void LayoutDashboard
void Settings
void Ticket

