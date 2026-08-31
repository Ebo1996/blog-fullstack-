import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Search, QrCode, ShieldCheck, Zap,
  TrendingUp, Users, Calendar, Ticket, ChevronRight,
} from 'lucide-react'
import { EventCard } from '@/components/events/event-card'
import { formatCurrency, formatDate } from '@/lib/utils'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

// ── Data fetchers — all real, all from NestJS API ─────────────────

async function getFeaturedEvents() {
  try {
    const res = await fetch(`${API_URL}/events/featured?limit=4`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

async function getUpcomingEvents() {
  try {
    const res = await fetch(`${API_URL}/events/upcoming?limit=8`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

async function getTrendingEvents() {
  try {
    const res = await fetch(`${API_URL}/events/trending?limit=4`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

async function getCategories() {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.data ?? []
  } catch { return [] }
}

async function getPublicStats() {
  try {
    const res = await fetch(`${API_URL}/analytics/public/stats`, {
      next: { revalidate: 600 },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data ?? null
  } catch { return null }
}

// ── Helper: compact number display ───────────────────────────────
function fmtNum(n: number): string {
  if (!n || n === 0) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M+`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K+`
  return `${n}+`
}

// ── Category palette (visual only, not data) ──────────────────────
const CAT_PALETTES = [
  { bg: '#2a2535', ring: '#4b455f' },
  { bg: '#2a2218', ring: '#735c35' },
  { bg: '#1c2e2c', ring: '#3e6460' },
  { bg: '#2a1e24', ring: '#6b3a4a' },
  { bg: '#1e2035', ring: '#3a3f6e' },
  { bg: '#20251e', ring: '#4a5240' },
]

// ── Ticket availability label from real data ───────────────────────
function availabilityLabel(event: any): string {
  if (event.status === 'cancelled') return 'Cancelled'
  if (event.status === 'completed') return 'Ended'
  if (typeof event.availableTickets === 'number') {
    if (event.availableTickets === 0) return 'Sold out'
    if (event.availableTickets <= 10) return 'Few left'
  }
  return 'Available'
}

// ── Page ──────────────────────────────────────────────────────────

export default async function HomePage() {
  const [featured, upcoming, trending, categories, stats] = await Promise.all([
    getFeaturedEvents(),
    getUpcomingEvents(),
    getTrendingEvents(),
    getCategories(),
    getPublicStats(),
  ])

  // Hero cards: first two events from featured pool, then upcoming
  const heroPool: any[] = [...featured, ...upcoming]
  const heroA = heroPool[0] ?? null
  const heroB = heroPool[1] ?? null

  // Real platform numbers
  const totalEvents     = stats?.totalEvents     ?? 0
  const totalAttendees  = stats?.totalAttendees  ?? 0
  const totalOrganizers = stats?.totalOrganizers ?? 0
  const totalTickets    = stats?.totalTickets    ?? 0
  const totalCheckIns   = stats?.totalCheckIns   ?? 0
  // Real sparkline from backend (7 monthly buckets, already normalised 0-100)
  const sparkline: number[] = stats?.sparkline ?? []

  return (
    <div className="hp-root">

      {/* ══════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════ */}
      <section className="hp-hero">
        <div className="hp-orb hp-orb-1" aria-hidden />
        <div className="hp-orb hp-orb-2" aria-hidden />
        <div className="hp-orb hp-orb-3" aria-hidden />
        <div className="hp-grid-overlay" aria-hidden />

        <div className="hp-hero-inner">

          {/* ── Left: headline + search + chips ─────────────── */}
          <div className="hp-hero-text">

            {/* Live badge — real event count */}
            <div className="hp-live-badge">
              <span className="hp-live-dot" />
              {totalEvents > 0
                ? <span>{totalEvents.toLocaleString()} live events across Ethiopia</span>
                : <span>Ethiopia's premier event platform</span>
              }
            </div>

            <h1 className="hp-headline">
              Discover events<br />
              <span className="hp-headline-accent">worth showing</span><br />
              up for.
            </h1>

            <p className="hp-sub">
              Find concerts, conferences, workshops, meetups,
              festivals, sports, and extraordinary experiences
              happening across Ethiopia.
            </p>

            <form action="/search" method="GET" className="hp-search-form">
              <div className="hp-search-bar">
                <Search className="hp-search-icon" aria-hidden />
                <input
                  name="q"
                  placeholder="Search events, artists, venues…"
                  className="hp-search-input"
                  aria-label="Search events"
                />
              </div>
              <button type="submit" className="hp-search-btn">
                Explore <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Real category chips */}
            {categories.length > 0 && (
              <div className="hp-quick-links" aria-label="Browse categories">
                {categories.slice(0, 6).map((cat: any) => (
                  <Link
                    key={cat._id}
                    href={`/categories/${cat.slug}`}
                    className="hp-quick-chip"
                  >
                    {cat.icon && <span>{cat.icon}</span>}
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: real floating event cards ─────────────── */}
          {(heroA || heroB) && (
            <div className="hp-hero-visual" aria-hidden>
              <div className="hp-float-stack">

                {/* Card A */}
                {heroA && (
                  <div className="hp-float-card hp-float-card-a">
                    <div
                      className="hp-fc-img"
                      style={{
                        background: heroA.imageUrl ? undefined : 'linear-gradient(135deg,#4b455f,#6b3a4a)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {heroA.imageUrl ? (
                        <Image
                          src={heroA.imageUrl}
                          alt={heroA.title}
                          fill
                          className="object-cover"
                          sizes="280px"
                        />
                      ) : (
                        <span className="text-4xl">
                          {heroA.categoryId?.icon ?? '🎭'}
                        </span>
                      )}
                    </div>
                    <div className="hp-fc-body">
                      <span className="hp-fc-cat">
                        {heroA.categoryId?.name ?? 'Event'}
                      </span>
                      <p className="hp-fc-title">{heroA.title}</p>
                      <div className="hp-fc-meta">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDate(heroA.startAt)}
                          {heroA.venue?.name ? ` · ${heroA.venue.name}` : ''}
                          {heroA.venue?.city ? `, ${heroA.venue.city}` : ''}
                        </span>
                      </div>
                      <div className="hp-fc-footer">
                        <span className="hp-fc-price">
                          {heroA.minPrice > 0
                            ? `From ${formatCurrency(heroA.minPrice, heroA.currency ?? 'ETB')}`
                            : 'Free'}
                        </span>
                        <span className="hp-fc-badge">{availabilityLabel(heroA)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Card B */}
                {heroB && (
                  <div className="hp-float-card hp-float-card-b">
                    <div
                      className="hp-fc-img"
                      style={{
                        background: heroB.imageUrl ? undefined : 'linear-gradient(135deg,#3e6460,#3a3f6e)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {heroB.imageUrl ? (
                        <Image
                          src={heroB.imageUrl}
                          alt={heroB.title}
                          fill
                          className="object-cover"
                          sizes="280px"
                        />
                      ) : (
                        <span className="text-4xl">
                          {heroB.categoryId?.icon ?? '🎪'}
                        </span>
                      )}
                    </div>
                    <div className="hp-fc-body">
                      <span className="hp-fc-cat">
                        {heroB.categoryId?.name ?? 'Event'}
                      </span>
                      <p className="hp-fc-title">{heroB.title}</p>
                      <div className="hp-fc-meta">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDate(heroB.startAt)}
                          {heroB.venue?.name ? ` · ${heroB.venue.name}` : ''}
                          {heroB.venue?.city ? `, ${heroB.venue.city}` : ''}
                        </span>
                      </div>
                      <div className="hp-fc-footer">
                        <span className="hp-fc-price">
                          {heroB.minPrice > 0
                            ? `From ${formatCurrency(heroB.minPrice, heroB.currency ?? 'ETB')}`
                            : 'Free'}
                        </span>
                        <span className="hp-fc-badge">{availabilityLabel(heroB)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stat pills — real numbers */}
                {totalEvents > 0 && (
                  <div className="hp-stat-pill hp-stat-pill-1">
                    <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
                    <div>
                      <p className="hp-stat-num">{fmtNum(totalEvents)}</p>
                      <p className="hp-stat-lbl">Published events</p>
                    </div>
                  </div>
                )}
                {totalAttendees > 0 && (
                  <div className="hp-stat-pill hp-stat-pill-2">
                    <Users className="w-4 h-4 text-[var(--primary)]" />
                    <div>
                      <p className="hp-stat-num">{fmtNum(totalAttendees)}</p>
                      <p className="hp-stat-lbl">Registered attendees</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hp-scroll-hint" aria-hidden>
          <div className="hp-scroll-line" />
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TRUST STRIP — feature facts, not fake metrics
      ══════════════════════════════════════════════════════════ */}
      <div className="hp-trust-strip">
        <div className="hp-trust-inner">
          {[
            { icon: ShieldCheck, text: 'Secure Chapa payments' },
            { icon: QrCode,      text: 'Instant digital QR tickets' },
            { icon: Zap,         text: 'Real-time availability' },
            { icon: Ticket,      text: 'No hidden fees' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="hp-trust-item">
              <Icon className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          FEATURED EVENTS
      ══════════════════════════════════════════════════════════ */}
      {featured.length > 0 && (
        <section className="hp-section">
          <div className="hp-section-head">
            <div>
              <span className="eyebrow">Handpicked for you</span>
              <h2 className="hp-section-title">Featured events</h2>
            </div>
            <Link href="/events?featured=true" className="hp-see-all">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="hp-grid-4">
            {featured.map((event: any, i: number) => (
              <EventCard key={event._id} event={event} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="hp-section hp-section-alt">
          <div className="hp-section-head">
            <div>
              <span className="eyebrow">Browse by type</span>
              <h2 className="hp-section-title">Explore categories</h2>
            </div>
          </div>
          <div className="hp-cat-grid">
            {categories.map((cat: any, i: number) => {
              const pal = CAT_PALETTES[i % CAT_PALETTES.length]
              return (
                <Link
                  key={cat._id}
                  href={`/categories/${cat.slug}`}
                  className="hp-cat-card"
                  style={{ '--cat-bg': pal.bg, '--cat-ring': pal.ring } as any}
                >
                  <div className="hp-cat-icon">{cat.icon || '🎭'}</div>
                  <span className="hp-cat-name">{cat.name}</span>
                  <span className="hp-cat-arrow">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          UPCOMING EVENTS
      ══════════════════════════════════════════════════════════ */}
      {upcoming.length > 0 && (
        <section className="hp-section">
          <div className="hp-section-head">
            <div>
              <span className="eyebrow">On the calendar</span>
              <h2 className="hp-section-title">Upcoming events</h2>
            </div>
            <Link href="/events?sort=soonest" className="hp-see-all">
              See all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="hp-grid-4">
            {upcoming.slice(0, 8).map((event: any, i: number) => (
              <EventCard key={event._id} event={event} index={i + 4} />
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          TRENDING EVENTS
      ══════════════════════════════════════════════════════════ */}
      {trending.length > 0 && (
        <section className="hp-section hp-section-alt">
          <div className="hp-section-head">
            <div>
              <span className="eyebrow">Hot right now</span>
              <h2 className="hp-section-title">Trending events</h2>
            </div>
            <Link href="/events?sort=recommended" className="hp-see-all">
              Explore <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="hp-grid-4">
            {trending.map((event: any, i: number) => (
              <EventCard key={event._id} event={event} index={i + 8} />
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          HOW IT WORKS — static copy, no data needed
      ══════════════════════════════════════════════════════════ */}
      <section className="hp-section hp-how">
        <div className="hp-section-head hp-how-head">
          <span className="eyebrow">Simple process</span>
          <h2 className="hp-section-title" style={{ marginTop: 6 }}>
            Three steps to your next event
          </h2>
          <p className="hp-how-sub">No app download. No printing. Just your phone.</p>
        </div>
        <div className="hp-how-grid">
          {[
            {
              step: '01', icon: Search, color: '#d7f36a',
              title: 'Find your event',
              desc: 'Browse events across Ethiopia. Filter by date, city, price, or category to find exactly what you want.',
            },
            {
              step: '02', icon: ShieldCheck, color: '#60a5fa',
              title: 'Pay securely',
              desc: "Checkout with Chapa — Ethiopia's trusted payment gateway. Your payment is verified server-side before any ticket is issued.",
            },
            {
              step: '03', icon: QrCode, color: '#c084fc',
              title: 'Show your QR',
              desc: 'Your digital ticket lands instantly in your dashboard. Walk straight in — no printing needed.',
            },
          ].map(({ step, icon: Icon, color, title, desc }) => (
            <div key={step} className="hp-how-card">
              <div className="hp-how-step-num" style={{ color }}>{step}</div>
              <div className="hp-how-icon-wrap" style={{ background: `${color}18` }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <h3 className="hp-how-title">{title}</h3>
              <p className="hp-how-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STATS ROW — 100% real from /analytics/public/stats
          Only rendered when we have real data
      ══════════════════════════════════════════════════════════ */}
      {(totalEvents > 0 || totalAttendees > 0 || totalOrganizers > 0 || totalTickets > 0) && (
        <section className="hp-stats-row">
          <div className="hp-stats-inner">
            {[
              { icon: TrendingUp, num: fmtNum(totalEvents),     lbl: 'Events published' },
              { icon: Users,      num: fmtNum(totalAttendees),  lbl: 'Registered attendees' },
              { icon: Ticket,     num: fmtNum(totalTickets),    lbl: 'Tickets issued' },
              { icon: QrCode,     num: fmtNum(totalCheckIns),   lbl: 'Successful check-ins' },
            ].map(({ icon: Icon, num, lbl }) => (
              <div key={lbl} className="hp-stat-block">
                <Icon className="hp-stat-icon" />
                <p className="hp-stat-big">{num}</p>
                <p className="hp-stat-lbl2">{lbl}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          ORGANIZER CTA
          Dashboard preview uses real sparkline + real event list
      ══════════════════════════════════════════════════════════ */}
      <section className="hp-section">
        <div className="hp-cta-band">
          <div className="hp-cta-glow" aria-hidden />

          <div className="hp-cta-content">
            <span className="eyebrow" style={{ color: '#b8c98a' }}>For organizers</span>
            <h2 className="hp-cta-title">
              Sell tickets to your<br />
              <span style={{ color: 'var(--primary)' }}>next event</span> today.
            </h2>
            <p className="hp-cta-desc">
              Create your event, set ticket types, publish, and start selling in minutes.
              Real-time analytics, QR check-in, and direct payouts via Chapa.
            </p>
            <ul className="hp-cta-list">
              {[
                'Free to create',
                'Real-time sales dashboard',
                'QR scanner included',
                'Chapa direct payouts',
              ].map((item) => (
                <li key={item} className="hp-cta-item">
                  <span className="hp-cta-check">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="hp-cta-actions">
              <Link href="/register?role=organizer" className="btn btn-primary btn-lg">
                Start for free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/about" className="hp-cta-link">
                Learn more <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Dashboard preview card */}
          <div className="hp-cta-visual" aria-hidden>
            <div className="hp-cta-card">
              <div className="hp-cta-card-head">
                <span className="hp-cta-card-dot hp-cta-card-dot-r" />
                <span className="hp-cta-card-dot hp-cta-card-dot-y" />
                <span className="hp-cta-card-dot hp-cta-card-dot-g" />
                <span className="hp-cta-card-label">Platform activity</span>
              </div>
              <div className="hp-cta-card-body">

                {/* Real sparkline — from monthly ticket data in DB */}
                {sparkline.length > 0 ? (
                  <div className="hp-mini-chart" title="Monthly ticket sales">
                    {sparkline.map((h, i) => (
                      <div
                        key={i}
                        className="hp-mini-bar"
                        style={{ height: `${Math.max(h, 4)}%` }}
                      />
                    ))}
                  </div>
                ) : (
                  /* No tickets yet — show an empty state bar */
                  <div className="hp-mini-chart">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="hp-mini-bar" style={{ height: '4%', opacity: 0.3 }} />
                    ))}
                  </div>
                )}

                {/* Real counters from DB */}
                <div className="hp-cta-stats">
                  <div className="hp-cta-stat">
                    <p className="hp-cta-stat-num" style={{ color: 'var(--primary)' }}>
                      {totalEvents > 0 ? totalEvents.toLocaleString() : '—'}
                    </p>
                    <p className="hp-cta-stat-lbl">Live events</p>
                  </div>
                  <div className="hp-cta-stat">
                    <p className="hp-cta-stat-num">
                      {totalOrganizers > 0 ? totalOrganizers.toLocaleString() : '—'}
                    </p>
                    <p className="hp-cta-stat-lbl">Organizers</p>
                  </div>
                </div>

                {/* Real upcoming events — top 3 from API */}
                {upcoming.slice(0, 3).length > 0 && (
                  <div className="hp-cta-event-list">
                    {upcoming.slice(0, 3).map((ev: any) => (
                      <div key={ev._id} className="hp-cta-event-row">
                        <div className="hp-cta-event-dot" />
                        <div className="hp-cta-event-info">
                          <p className="hp-cta-event-name">{ev.title}</p>
                          <p className="hp-cta-event-date">
                            {formatDate(ev.startAt)}
                            {ev.venue?.city ? ` · ${ev.venue.city}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
