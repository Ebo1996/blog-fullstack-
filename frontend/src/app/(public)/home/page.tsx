import Link from 'next/link'
import { ArrowUpRight, Calendar, Shield, Ticket, Zap, Users, BarChart2 } from 'lucide-react'
import { getFeaturedEvents, getUpcomingEvents } from '@/services/events'
import { getAllCategories } from '@/services/categories'
import { EventCard, EventCardFeatured } from '@/components/public/event-card'
import { HomeSearch } from '@/components/public/home-search'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Northstar — Discover events worth attending',
  description: 'Find conferences, concerts, workshops, meetups, festivals and more.',
}

// Category color mapping
const categoryColors: Record<string, string> = {
  technology:    '#1a2638',
  music:         '#2a1a38',
  business:      '#1a2a2a',
  design:        '#38281a',
  sports:        '#1a3820',
  education:     '#1a2838',
  networking:    '#2a1a2a',
  entertainment: '#381a1a',
  art:           '#281a38',
  culture:       '#1a2828',
}

const whyItems = [
  {
    icon: <Ticket size={20} aria-hidden="true" />,
    title: 'Instant digital tickets',
    body: 'QR-coded tickets delivered immediately. No printing, no waiting — just show up.',
  },
  {
    icon: <Shield size={20} aria-hidden="true" />,
    title: 'Secure payments',
    body: 'Stripe-powered checkout with fraud protection. Your payment data never touches our servers.',
  },
  {
    icon: <Calendar size={20} aria-hidden="true" />,
    title: 'Never miss an event',
    body: 'Smart reminders 7 days, 1 day, and 1 hour before your event. Add to wallet in one tap.',
  },
  {
    icon: <Users size={20} aria-hidden="true" />,
    title: 'Easy ticket transfers',
    body: "Can't make it? Transfer your ticket to a friend in seconds. No group-chat chaos.",
  },
  {
    icon: <Zap size={20} aria-hidden="true" />,
    title: 'Fast check-in',
    body: 'QR scanning handles thousands of attendees. Staff check in guests in under 2 seconds.',
  },
  {
    icon: <BarChart2 size={20} aria-hidden="true" />,
    title: 'Organizer analytics',
    body: 'Real-time revenue, sales trends, and check-in rates. Everything you need to run a great event.',
  },
]

export default async function HomePage() {
  const [featured, upcoming, categories] = await Promise.all([
    getFeaturedEvents(4),
    getUpcomingEvents(8),
    getAllCategories(),
  ])

  const heroEvent = featured[0]
  const featuredRest = featured.slice(1, 4)

  return (
    <main>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        aria-label="Hero"
        style={{
          minHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 'clamp(60px, 10vh, 120px) 24px 80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background gradient */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(215,243,106,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 760 }}>
          <p
            style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.22em',
              color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 24,
            }}
          >
            Event management & ticketing
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(42px, 7vw, 80px)',
              fontWeight: 400,
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
              margin: '0 0 24px',
            }}
          >
            Discover events<br />worth attending.
          </h1>
          <p
            style={{
              color: 'var(--muted-foreground)',
              fontSize: 'clamp(15px, 2vw, 18px)',
              lineHeight: 1.65,
              maxWidth: 520,
              margin: '0 auto 40px',
            }}
          >
            Find conferences, concerts, workshops, meetups, festivals and more — all in one place.
          </p>

          {/* Search bar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <HomeSearch />
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/events" className="button button-primary button-lg">
              Explore events
            </Link>
            <Link href="/organizer" className="button button-outline button-lg">
              Create an event
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURED EVENTS ───────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section
          aria-labelledby="featured-heading"
          style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}
        >
          <div className="section-heading" style={{ marginTop: 0 }}>
            <div>
              <p className="eyebrow">FEATURED</p>
              <h2>Events happening soon</h2>
            </div>
            <Link href="/events" className="text-link">
              View all <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>

          {/* Hero event + side cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginTop: 24 }}>
            {heroEvent && (
              <EventCardFeatured event={heroEvent} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {featuredRest.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  style={{
                    display: 'flex', gap: 14, alignItems: 'center',
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '14px 16px',
                    transition: 'border-color var(--transition-base)',
                    flex: 1,
                  }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-strong)' }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)' }}
                >
                  <div className={`event-art event-art-small ${['event-violet','event-amber','event-teal'][featuredRest.indexOf(event) % 3]}`} aria-hidden="true">
                    <span style={{ fontSize: 11 }}>
                      {event.title.split(' ').map((w) => w[0]).join('').slice(0, 3)}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>
                      {new Date(event.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {event.city}
                    </p>
                  </div>
                  <ArrowUpRight size={15} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── UPCOMING EVENTS ───────────────────────────────────────────────── */}
      {upcoming.length > 0 && (
        <section
          aria-labelledby="upcoming-heading"
          style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}
        >
          <div className="section-heading" style={{ marginTop: 0 }}>
            <div>
              <p className="eyebrow">UPCOMING</p>
              <h2 id="upcoming-heading">Happening near you</h2>
            </div>
            <Link href="/events" className="text-link">
              See more <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
              marginTop: 24,
            }}
          >
            {upcoming.slice(0, 8).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* ── POPULAR CATEGORIES ────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section
          aria-labelledby="categories-heading"
          style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}
        >
          <div className="section-heading" style={{ marginTop: 0 }}>
            <div>
              <p className="eyebrow">BROWSE</p>
              <h2 id="categories-heading">Popular categories</h2>
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
              marginTop: 24,
            }}
          >
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                aria-label={`Browse ${cat.name} events`}
                style={{
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  minHeight: 120, padding: '16px 18px',
                  background: categoryColors[cat.slug] ?? 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  transition: 'transform var(--transition-base), border-color var(--transition-base)',
                }}
                onMouseOver={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.transform = 'translateY(-2px)'
                  el.style.borderColor = 'var(--border-strong)'
                }}
                onMouseOut={(e) => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.transform = ''
                  el.style.borderColor = 'var(--border)'
                }}
              >
                <p style={{ fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                  {cat.name}
                </p>
                {cat.description && (
                  <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '4px 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {cat.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── WHY USE NORTHSTAR ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="why-heading"
        style={{
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '80px 24px',
          margin: '0 0 0',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>WHY NORTHSTAR</p>
            <h2
              id="why-heading"
              style={{
                fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 4vw, 42px)',
                fontWeight: 400, letterSpacing: '-0.02em', margin: 0,
              }}
            >
              Built for people who take events seriously.
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 24,
            }}
          >
            {whyItems.map((item) => (
              <div key={item.title} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span
                  style={{
                    display: 'grid', placeItems: 'center',
                    width: 40, height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(215,243,106,0.1)',
                    color: 'var(--primary)',
                  }}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.65 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ORGANIZER CTA ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="organizer-cta-heading"
        style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}
      >
        <div
          style={{
            background: '#1e2318',
            border: '1px solid #3a4228',
            borderRadius: 'var(--radius-2xl)',
            padding: 'clamp(40px, 6vw, 72px)',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 40,
            alignItems: 'center',
          }}
        >
          <div>
            <p
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
                color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 16,
              }}
            >
              FOR ORGANIZERS
            </p>
            <h2
              id="organizer-cta-heading"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                margin: '0 0 14px',
                color: '#e8f0c8',
              }}
            >
              Sell tickets to your event<br />in minutes.
            </h2>
            <p style={{ color: '#9aaa78', fontSize: 14, lineHeight: 1.65, margin: '0 0 28px', maxWidth: 480 }}>
              Create your event, set up ticket types, publish, and start selling. Stripe payments, QR check-in, and real-time analytics included.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/register" className="button button-primary button-lg">
                Start for free
              </Link>
              <Link href="/about" className="button button-ghost button-lg">
                Learn more
              </Link>
            </div>
          </div>

          {/* Stats block */}
          <div
            style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2,
              borderRadius: 'var(--radius-lg)', overflow: 'hidden',
              border: '1px solid #3a4228', flexShrink: 0,
            }}
          >
            {[
              { value: '2 min', label: 'To create an event' },
              { value: '0%', label: 'Platform fee at start' },
              { value: 'Real-time', label: 'Sales analytics' },
              { value: 'QR', label: 'Check-in included' },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: '24px 28px',
                  background: '#232b1a',
                  borderRight: '1px solid #3a4228',
                  borderBottom: '1px solid #3a4228',
                }}
              >
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, margin: '0 0 4px', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 11, color: '#9aaa78', margin: 0, lineHeight: 1.3 }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
