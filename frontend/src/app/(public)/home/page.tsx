import Link from 'next/link'
import { ArrowUpRight, Calendar, Shield, Ticket, Zap, Users, BarChart2, Sparkles, ChevronRight } from 'lucide-react'
import { getFeaturedEvents, getUpcomingEvents } from '@/services/events'
import { getAllCategories } from '@/services/categories'
import { getPublicPlatformStats } from '@/services/platform-stats'
import { EventCard, EventCardFeatured } from '@/components/public/event-card'
import { HomeSearch } from '@/components/public/home-search'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Northstar — Discover events worth attending',
  description: 'Find conferences, concerts, workshops, meetups, festivals and more.',
}

export const dynamic = 'force-dynamic'

const categoryColors: Record<string, { bg: string; border: string; dot: string }> = {
  technology:    { bg: 'linear-gradient(135deg, #0f1a2e 0%, #1a2638 100%)', border: '#1e3a5f', dot: '#6baee0' },
  music:         { bg: 'linear-gradient(135deg, #1a0f2e 0%, #2a1a38 100%)', border: '#3d1f6e', dot: '#a78bfa' },
  business:      { bg: 'linear-gradient(135deg, #0f1f1f 0%, #1a2a2a 100%)', border: '#1e4040', dot: '#34d399' },
  design:        { bg: 'linear-gradient(135deg, #2a1a0f 0%, #38281a 100%)', border: '#5a3a18', dot: '#fbbf24' },
  sports:        { bg: 'linear-gradient(135deg, #0f2018 0%, #1a3820 100%)', border: '#1a4a28', dot: '#6ee7b7' },
  education:     { bg: 'linear-gradient(135deg, #0f1a2a 0%, #1a2838 100%)', border: '#1a3a5a', dot: '#93c5fd' },
  networking:    { bg: 'linear-gradient(135deg, #1a0f2a 0%, #2a1a2a 100%)', border: '#3a1a4a', dot: '#f0abfc' },
  entertainment: { bg: 'linear-gradient(135deg, #2a0f0f 0%, #381a1a 100%)', border: '#5a1a1a', dot: '#fca5a5' },
  art:           { bg: 'linear-gradient(135deg, #1e0f2a 0%, #281a38 100%)', border: '#4a1a5a', dot: '#d8b4fe' },
  culture:       { bg: 'linear-gradient(135deg, #0f1e1e 0%, #1a2828 100%)', border: '#1a4040', dot: '#5eead4' },
}

const whyItems = [
  {
    icon: <Ticket size={18} aria-hidden="true" />,
    title: 'Instant digital tickets',
    body: 'QR-coded tickets delivered immediately. No printing, no waiting — just show up.',
    accent: 'var(--primary)',
    accentBg: 'rgba(215,243,106,0.08)',
  },
  {
    icon: <Shield size={18} aria-hidden="true" />,
    title: 'Secure payments',
    body: 'Chapa-powered checkout with ETB support. Pay with Telebirr, bank transfer, or card.',
    accent: '#34d399',
    accentBg: 'rgba(52,211,153,0.08)',
  },
  {
    icon: <Calendar size={18} aria-hidden="true" />,
    title: 'Never miss an event',
    body: 'Smart reminders 7 days, 1 day, and 1 hour before your event. Add to wallet in one tap.',
    accent: '#93c5fd',
    accentBg: 'rgba(147,197,253,0.08)',
  },
  {
    icon: <Users size={18} aria-hidden="true" />,
    title: 'Easy ticket transfers',
    body: "Can't make it? Transfer your ticket to a friend in seconds. No group-chat chaos.",
    accent: '#f0abfc',
    accentBg: 'rgba(240,171,252,0.08)',
  },
  {
    icon: <Zap size={18} aria-hidden="true" />,
    title: 'Fast check-in',
    body: 'QR scanning handles thousands of attendees. Staff check in guests in under 2 seconds.',
    accent: '#fbbf24',
    accentBg: 'rgba(251,191,36,0.08)',
  },
  {
    icon: <BarChart2 size={18} aria-hidden="true" />,
    title: 'Organizer analytics',
    body: 'Real-time revenue, sales trends, and check-in rates. Everything you need to run a great event.',
    accent: '#fca5a5',
    accentBg: 'rgba(252,165,165,0.08)',
  },
]

export default async function HomePage() {
  const [featured, upcoming, categories, platformStats] = await Promise.all([
    getFeaturedEvents(4),
    getUpcomingEvents(8),
    getAllCategories(),
    getPublicPlatformStats(),
  ])

  const stats = [
    { value: platformStats.ticketsSoldDisplay, label: 'Tickets sold'    },
    { value: platformStats.eventsDisplay,      label: 'Events hosted'   },
    { value: platformStats.organizersDisplay,  label: 'Organizers'      },
    { value: '2 min',                          label: 'Avg. setup time' },
  ]

  const heroEvent = featured[0]
  const featuredRest = featured.slice(1, 4)

  return (
    <main>
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        aria-label="Hero"
        style={{
          minHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: 'clamp(80px, 12vh, 140px) 24px 100px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Layered background effects */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
          {/* Primary radial glow */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 90% 70% at 50% -5%, rgba(215,243,106,0.09) 0%, transparent 65%)',
          }} />
          {/* Secondary accent glows */}
          <div style={{
            position: 'absolute',
            width: 600, height: 600,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(107,174,224,0.05) 0%, transparent 70%)',
            top: '10%', left: '-10%',
          }} />
          <div style={{
            position: 'absolute',
            width: 500, height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)',
            top: '5%', right: '-5%',
          }} />
          {/* Subtle grid texture */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 20%, transparent 80%)',
          }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(215,243,106,0.07)',
            border: '1px solid rgba(215,243,106,0.18)',
            borderRadius: 99, padding: '6px 16px',
            marginBottom: 32,
          }}>
            <Sparkles size={12} style={{ color: 'var(--primary)' }} aria-hidden="true" />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--primary)', textTransform: 'uppercase' }}>
              Event management &amp; ticketing
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(48px, 8vw, 92px)',
              fontWeight: 400,
              letterSpacing: '-0.04em',
              lineHeight: 0.95,
              margin: '0 0 28px',
              background: 'linear-gradient(180deg, #f4f1e8 30%, rgba(244,241,232,0.55) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Discover events<br />
            <span style={{
              background: 'linear-gradient(135deg, #d7f36a 0%, #b8e832 50%, #d7f36a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              worth attending.
            </span>
          </h1>

          <p
            style={{
              color: 'var(--muted-foreground)',
              fontSize: 'clamp(15px, 2vw, 19px)',
              lineHeight: 1.65,
              maxWidth: 560,
              margin: '0 auto 48px',
              letterSpacing: '-0.01em',
            }}
          >
            Find conferences, concerts, workshops, meetups, festivals and more — all in one place.
          </p>

          {/* Search */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
            <HomeSearch />
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/events"
              className="button button-primary button-lg"
              style={{ paddingLeft: 28, paddingRight: 28, boxShadow: '0 0 32px rgba(215,243,106,0.18)' }}
            >
              Explore events
            </Link>
            <Link
              href="/register"
              className="button button-outline button-lg"
              style={{ paddingLeft: 28, paddingRight: 28 }}
            >
              Create an event
            </Link>
          </div>

          {/* Trust line */}
          <p style={{ marginTop: 32, fontSize: 12, color: 'var(--muted-foreground)', opacity: 0.7 }}>
            {platformStats.organizersDisplay !== '—' && platformStats.totalOrganizers > 0
              ? `Trusted by ${platformStats.organizersDisplay} organizers · No credit card required`
              : 'Trusted by organizers worldwide · No credit card required'}
          </p>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(90deg, rgba(215,243,106,0.02) 0%, transparent 50%, rgba(215,243,106,0.02) 100%)',
      }}>
        <div className="home-stats-grid">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: '28px 24px',
                textAlign: 'center',
                borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(28px, 3vw, 40px)',
                fontWeight: 400,
                letterSpacing: '-0.04em',
                color: 'var(--primary)',
                lineHeight: 1,
                marginBottom: 6,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)', letterSpacing: '0.04em' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURED EVENTS ───────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section
          aria-labelledby="featured-heading"
          style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 10 }}>FEATURED</p>
              <h2
                id="featured-heading"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(26px, 3vw, 38px)',
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  margin: 0,
                }}
              >
                Events happening soon
              </h2>
            </div>
            <Link href="/events" className="text-link" style={{ gap: 6 }}>
              View all <ArrowUpRight size={13} aria-hidden="true" />
            </Link>
          </div>

          <div className="home-featured-grid">
            {heroEvent && <EventCardFeatured event={heroEvent} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {featuredRest.map((event, idx) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="featured-side-card"
                >
                  <div
                    className={`event-art event-art-small ${['event-violet', 'event-amber', 'event-teal'][idx % 3]}`}
                    aria-hidden="true"
                  >
                    <span style={{ fontSize: 11 }}>
                      {event.title.split(' ').map((w) => w[0]).join('').slice(0, 3)}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {event.title}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>
                      {new Date(event.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {event.city}
                    </p>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} aria-hidden="true" />
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
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.015) 50%, transparent 100%)',
            padding: '80px 24px',
          }}
        >
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: 10 }}>UPCOMING</p>
                <h2
                  id="upcoming-heading"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(26px, 3vw, 38px)',
                    fontWeight: 400,
                    letterSpacing: '-0.03em',
                    margin: 0,
                  }}
                >
                  Happening near you
                </h2>
              </div>
              <Link href="/events" className="text-link" style={{ gap: 6 }}>
                See more <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {upcoming.slice(0, 8).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── POPULAR CATEGORIES ────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section
          aria-labelledby="categories-heading"
          style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: 10 }}>BROWSE</p>
              <h2
                id="categories-heading"
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(26px, 3vw, 38px)',
                  fontWeight: 400,
                  letterSpacing: '-0.03em',
                  margin: 0,
                }}
              >
                Browse by category
              </h2>
            </div>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {categories.map((cat) => {
              const colors = categoryColors[cat.slug]
              return (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  aria-label={`Browse ${cat.name} events`}
                  className="category-card"
                  style={{
                    background: colors?.bg ?? 'var(--card)',
                    border: `1px solid ${colors?.border ?? 'var(--border)'}`,
                  }}
                >
                  {/* Decorative dot */}
                  <div aria-hidden="true" style={{
                    position: 'absolute', top: 20, right: 20,
                    width: 8, height: 8, borderRadius: '50%',
                    background: colors?.dot ?? 'var(--primary)',
                    boxShadow: `0 0 12px ${colors?.dot ?? 'var(--primary)'}`,
                  }} />
                  {/* Decorative circle */}
                  <div aria-hidden="true" style={{
                    position: 'absolute', top: -30, right: -30,
                    width: 120, height: 120, borderRadius: '50%',
                    border: `1px solid ${colors?.border ?? 'var(--border)'}`,
                    opacity: 0.4,
                  }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                      {cat.name}
                    </p>
                    {cat.description && (
                      <p style={{
                        fontSize: 11, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.45,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {cat.description}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* ── WHY NORTHSTAR ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="why-heading"
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '100px 24px',
          background: 'linear-gradient(180deg, var(--background) 0%, rgba(215,243,106,0.02) 50%, var(--background) 100%)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Decorative background glow */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 800, height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(215,243,106,0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <p className="eyebrow" style={{ marginBottom: 14 }}>WHY NORTHSTAR</p>
            <h2
              id="why-heading"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(30px, 4.5vw, 48px)',
                fontWeight: 400,
                letterSpacing: '-0.03em',
                margin: '0 auto',
                maxWidth: 600,
                lineHeight: 1.1,
              }}
            >
              Built for people who take events seriously.
            </h2>
          </div>

          <div className="home-why-grid">
            {whyItems.map((item) => (
              <div
                key={item.title}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 14,
                  padding: '32px 28px',
                  background: 'var(--card)',
                }}
              >
                <div style={{
                  display: 'grid', placeItems: 'center',
                  width: 42, height: 42,
                  borderRadius: 'var(--radius-md)',
                  background: item.accentBg,
                  color: item.accent,
                  border: `1px solid ${item.accentBg}`,
                }} aria-hidden="true">
                  {item.icon}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
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
        style={{ maxWidth: 1200, margin: '0 auto', padding: '100px 24px' }}
      >
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #161d10 0%, #1e2a14 50%, #162010 100%)',
          border: '1px solid #2e4020',
          borderRadius: 'var(--radius-2xl)',
          padding: 'clamp(48px, 6vw, 80px)',
        }}
        className="home-cta-grid"
        >
          {/* BG decoration */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: -80, right: -80,
            width: 400, height: 400, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(215,243,106,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div aria-hidden="true" style={{
            position: 'absolute', bottom: -60, left: '40%',
            width: 300, height: 300, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(215,243,106,0.03) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative' }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.22em',
              color: 'var(--primary)', textTransform: 'uppercase', marginBottom: 18, margin: '0 0 18px',
            }}>
              For Organizers
            </p>
            <h2
              id="organizer-cta-heading"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(30px, 4vw, 50px)',
                fontWeight: 400,
                letterSpacing: '-0.03em',
                margin: '0 0 16px',
                color: '#e8f0c8',
                lineHeight: 1.05,
              }}
            >
              Sell tickets to your event<br />in minutes.
            </h2>
            <p style={{ color: '#8aaa68', fontSize: 15, lineHeight: 1.7, margin: '0 0 32px', maxWidth: 460 }}>
              Create your event, set up ticket types, publish, and start selling. Chapa payments (ETB), QR check-in, and real-time analytics included.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href="/register"
                className="button button-primary button-lg"
                style={{ boxShadow: '0 0 24px rgba(215,243,106,0.15)' }}
              >
                Start for free
              </Link>
              <Link href="/about" className="button button-ghost button-lg">
                Learn more
              </Link>
            </div>
          </div>

          {/* Stats block */}
          <div className="home-cta-stats">
            {[
              { value: '2 min', label: 'To create an event' },
              { value: '0%', label: 'Platform fee at start' },
              { value: 'Live', label: 'Sales analytics' },
              { value: 'QR', label: 'Check-in included' },
            ].map((stat) => (
              <div key={stat.label} style={{
                padding: '28px 32px',
                background: '#1e2a14',
              }}>
                <p style={{
                  fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400,
                  margin: '0 0 6px', color: 'var(--primary)', letterSpacing: '-0.03em', lineHeight: 1,
                }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 11, color: '#7a9a68', margin: 0, lineHeight: 1.3 }}>
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
