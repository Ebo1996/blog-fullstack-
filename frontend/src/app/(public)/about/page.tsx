import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowUpRight, Ticket, Shield, Zap, BarChart2, Users, Globe } from 'lucide-react'
import { getPublicPlatformStats } from '@/services/platform-stats'

export const metadata: Metadata = {
  title: 'About Eventify Ethiopia',
  description: 'Eventify Ethiopia is an event management and ticketing platform built for Ethiopian organizers and attendees.',
}

const timeline = [
  {
    year: '2024',
    title: 'The problem',
    body: 'We kept paying too much in ticket fees, losing tickets in email, and missing events because reminders never came. We decided to fix it.',
  },
  {
    year: 'Early 2025',
    title: 'First version',
    body: 'Northstar launched with core ticketing, QR check-in, and organiser analytics. First 50 events ran through the platform.',
  },
  {
    year: 'Mid 2025',
    title: 'Ticket transfers',
    body: 'We added secure peer-to-peer ticket transfers — no resale risk, no group-chat chaos. Your ticket stays yours until you hand it over.',
  },
  {
    year: 'Now',
    title: 'Production platform',
    body: 'Northstar handles the full event lifecycle: discovery, ticketing, check-in, and post-event analytics for organisers of any size.',
  },
]

const values = [
  {
    icon: <Shield size={20} aria-hidden="true" />,
    title: 'Attendees first',
    body: 'We never sell your data. Tickets are yours. Transfers are free. Refunds are straightforward.',
  },
  {
    icon: <Zap size={20} aria-hidden="true" />,
    title: 'Speed matters',
    body: 'Fast checkout. Instant QR codes. 2-second check-in. Nobody should wait in line for ten minutes.',
  },
  {
    icon: <BarChart2 size={20} aria-hidden="true" />,
    title: 'Organizers deserve real tools',
    body: 'Real-time sales, check-in rates, revenue charts. Not a spreadsheet — a proper dashboard.',
  },
  {
    icon: <Globe size={20} aria-hidden="true" />,
    title: 'Events should be accessible',
    body: 'We support free events, paid events, RSVPs, and waitlists. Big venue or living room — same platform.',
  },
]

export default async function AboutPage() {
  const platformStats = await getPublicPlatformStats()

  const stats = [
    { value: platformStats.ticketsSoldDisplay, label: 'Tickets sold'           },
    { value: platformStats.eventsDisplay,      label: 'Events created'         },
    { value: platformStats.organizersDisplay,  label: 'Organizers on Northstar'},
    { value: '2 min',                          label: 'Average setup time'     },
  ]
  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        aria-label="About hero"
        style={{
          maxWidth: 1200, margin: '0 auto',
          padding: 'clamp(60px, 10vh, 100px) 24px 80px',
        }}
      >
        <div style={{ maxWidth: 720 }}>
          <p className="eyebrow" style={{ marginBottom: 16 }}>ABOUT NORTHSTAR</p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 400, letterSpacing: '-0.03em',
              lineHeight: 1.05, margin: '0 0 24px',
            }}
          >
            Built for people who take events seriously.
          </h1>
          <p
            style={{
              color: 'var(--muted-foreground)', fontSize: 16,
              lineHeight: 1.75, maxWidth: 580, margin: '0 0 32px',
            }}
          >
            Northstar is an event management and ticketing platform that makes it easy to discover, attend, and run events — without the friction that makes most ticketing software frustrating.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/events" className="button button-primary button-lg">
              Explore events
            </Link>
            <Link href="/register" className="button button-outline button-lg">
              Create an account
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────── */}
      <section
        aria-label="Platform statistics"
        style={{
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '48px 24px',
        }}
      >
        <div
          style={{ maxWidth: 1200, margin: '0 auto' }}
          className="home-stats-grid"
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              style={{
                padding: '24px 32px',
                borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 40, fontWeight: 400,
                  letterSpacing: '-0.03em', color: 'var(--primary)',
                  margin: '0 0 6px',
                }}
              >
                {s.value}
              </p>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VALUES ────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="values-heading"
        style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}
      >
        <div style={{ marginBottom: 48 }}>
          <p className="eyebrow" style={{ marginBottom: 12 }}>WHAT WE BELIEVE</p>
          <h2
            id="values-heading"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(26px, 4vw, 40px)',
              fontWeight: 400, letterSpacing: '-0.02em', margin: 0,
            }}
          >
            Our values
          </h2>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 32,
          }}
        >
          {values.map((v) => (
            <div key={v.title} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span
                style={{
                  display: 'grid', placeItems: 'center',
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: 'rgba(215,243,106,0.09)', color: 'var(--primary)',
                }}
              >
                {v.icon}
              </span>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                {v.title}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0, lineHeight: 1.7 }}>
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TIMELINE ──────────────────────────────────────────────────── */}
      <section
        aria-labelledby="story-heading"
        style={{
          borderTop: '1px solid var(--border)',
          padding: '80px 24px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <p className="eyebrow" style={{ marginBottom: 12 }}>OUR STORY</p>
            <h2
              id="story-heading"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(26px, 4vw, 40px)',
                fontWeight: 400, letterSpacing: '-0.02em', margin: 0,
              }}
            >
              How we got here
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 0 }}>
            {timeline.map((item, i) => (
              <div
                key={item.year}
                style={{
                  padding: '32px 32px 32px 0',
                  borderLeft: '2px solid var(--border)',
                  paddingLeft: 28,
                  position: 'relative',
                  marginLeft: i === 0 ? 0 : undefined,
                }}
              >
                {/* Dot */}
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute', left: -7, top: 34,
                    width: 12, height: 12, borderRadius: '50%',
                    background: 'var(--primary)',
                    border: '2px solid var(--background)',
                  }}
                />
                <p
                  style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
                    color: 'var(--primary)', textTransform: 'uppercase',
                    margin: '0 0 8px',
                  }}
                >
                  {item.year}
                </p>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px', letterSpacing: '-0.01em' }}>
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

      {/* ── FOR ORGANIZERS ────────────────────────────────────────────── */}
      <section
        aria-labelledby="organizer-section-heading"
        style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}
      >
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(36px, 5vw, 60px)',
          }}
          className="home-cta-grid"
        >
          <div>
            <p className="eyebrow" style={{ marginBottom: 14 }}>FOR ORGANIZERS</p>
            <h2
              id="organizer-section-heading"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(24px, 3.5vw, 38px)',
                fontWeight: 400, letterSpacing: '-0.02em', margin: '0 0 16px',
              }}
            >
              Run your event on Northstar.
            </h2>
            <p style={{ color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.65, margin: '0 0 28px' }}>
              Create an event, set up ticket types, publish, and start selling in minutes. Chapa handles payments in ETB — you handle the event.
            </p>
            <Link
              href="/organizer"
              className="button button-primary"
              style={{ display: 'inline-flex', gap: 8 }}
            >
              Start organising <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: <Ticket size={16} />, text: 'Paid and free tickets, RSVP, waitlists' },
              { icon: <Zap size={16} />, text: 'QR check-in scanning built in' },
              { icon: <BarChart2 size={16} />, text: 'Real-time revenue and sales analytics' },
              { icon: <Users size={16} />, text: 'Attendee management and export' },
              { icon: <Shield size={16} />, text: 'Chapa payments (ETB) — Telebirr, bank transfer, cards' },
            ].map((item) => (
              <div
                key={item.text}
                style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}
              >
                <span
                  style={{
                    display: 'grid', placeItems: 'center',
                    width: 32, height: 32, borderRadius: 8,
                    background: 'var(--muted)', color: 'var(--primary)',
                    flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
