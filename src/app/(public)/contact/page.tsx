'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Mail, MessageSquare, Ticket, Building2, CheckCircle } from 'lucide-react'
import { Alert } from '@/components/ui/alert'

const topics = [
  { value: 'attendee',   label: 'Attendee support',   icon: <Ticket size={15} /> },
  { value: 'organizer',  label: 'Organizer support',  icon: <Building2 size={15} /> },
  { value: 'general',    label: 'General enquiry',    icon: <MessageSquare size={15} /> },
  { value: 'other',      label: 'Other',              icon: <Mail size={15} /> },
]

export default function ContactPage() {
  const [topic, setTopic] = useState('attendee')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const name    = (fd.get('name') as string).trim()
    const email   = (fd.get('email') as string).trim()
    const message = (fd.get('message') as string).trim()

    if (!name || !email || !message) {
      setError('Please fill in all required fields.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (message.length < 20) {
      setError('Message must be at least 20 characters.')
      return
    }

    setError(null)
    startTransition(() => {
      // In production, this would POST to /api/contact
      // For now, simulate a successful submission
      setTimeout(() => setSubmitted(true), 600)
    })
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(48px, 8vh, 96px) 24px 80px' }}>
      <div
        className="contact-layout"
        style={{ alignItems: 'start' }}
      >
        {/* ── Left: info ──────────────────────────────────────────────── */}
        <div>
          <p className="eyebrow" style={{ marginBottom: 14 }}>CONTACT</p>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 400, letterSpacing: '-0.03em',
              lineHeight: 1.05, margin: '0 0 20px',
            }}
          >
            We&apos;re here to help.
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.75, margin: '0 0 40px', maxWidth: 400 }}>
            Whether you&apos;re an attendee with a ticketing question or an organizer setting up your first event — reach out and we&apos;ll get back to you within one business day.
          </p>

          {/* Contact options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="panel" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span
                style={{
                  display: 'grid', placeItems: 'center',
                  width: 38, height: 38, borderRadius: 'var(--radius-md)',
                  background: 'var(--muted)', color: 'var(--primary)',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                <Mail size={16} />
              </span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 3px' }}>Email support</p>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 0 4px' }}>
                  For account, ticket, and payment issues.
                </p>
                <a href="mailto:support@northstar.dev" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                  support@northstar.dev
                </a>
              </div>
            </div>

            <div className="panel" style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span
                style={{
                  display: 'grid', placeItems: 'center',
                  width: 38, height: 38, borderRadius: 'var(--radius-md)',
                  background: 'var(--muted)', color: 'var(--primary)',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                <Building2 size={16} />
              </span>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, margin: '0 0 3px' }}>Organizer onboarding</p>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: '0 0 4px' }}>
                  Need help setting up your first event?
                </p>
                <a href="mailto:organizers@northstar.dev" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                  organizers@northstar.dev
                </a>
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div style={{ marginTop: 32, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 14 }}>Quick links</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { href: '/dashboard/tickets', label: 'View my tickets' },
                { href: '/dashboard/orders', label: 'My orders' },
                { href: '/organizer', label: 'Organizer dashboard' },
                { href: '/about', label: 'About Northstar' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  style={{ fontSize: 13, color: 'var(--muted-foreground)', transition: 'color var(--transition-fast)' }}
                  onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--foreground)' }}
                  onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted-foreground)' }}
                >
                  {l.label} →
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: form ─────────────────────────────────────────────── */}
        <div>
          {submitted ? (
            <div
              className="panel"
              style={{ textAlign: 'center', padding: '52px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
            >
              <span
                style={{
                  display: 'grid', placeItems: 'center',
                  width: 60, height: 60, borderRadius: 'var(--radius-lg)',
                  background: 'var(--success-bg)', color: 'var(--success)',
                }}
                aria-hidden="true"
              >
                <CheckCircle size={28} />
              </span>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 400, margin: 0 }}>
                Message sent
              </h2>
              <p style={{ color: 'var(--muted-foreground)', fontSize: 14, maxWidth: 320, lineHeight: 1.65, margin: 0 }}>
                Thanks for getting in touch. We&apos;ll reply to your email within one business day.
              </p>
              <button
                className="button button-outline"
                style={{ marginTop: 8 }}
                onClick={() => setSubmitted(false)}
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="panel">
              <h2
                style={{
                  fontFamily: 'var(--font-serif)', fontSize: 22,
                  fontWeight: 400, letterSpacing: '-0.01em',
                  margin: '0 0 24px',
                }}
              >
                Send a message
              </h2>

              {/* Topic selector */}
              <div style={{ marginBottom: 20 }}>
                <p className="form-label" style={{ marginBottom: 10 }}>Topic</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                  {topics.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTopic(t.value)}
                      aria-pressed={topic === t.value}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 12px', borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor: topic === t.value ? 'rgba(215,243,106,0.5)' : 'var(--border)',
                        background: topic === t.value ? 'rgba(215,243,106,0.06)' : 'transparent',
                        color: topic === t.value ? 'var(--foreground)' : 'var(--muted-foreground)',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <span style={{ color: topic === t.value ? 'var(--primary)' : 'inherit' }} aria-hidden="true">
                        {t.icon}
                      </span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <Alert variant="error" className="mb-4" style={{ marginBottom: 16 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <input type="hidden" name="topic" value={topic} />

                <div className="form-group">
                  <label className="form-label required" htmlFor="contact-name">Full name</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Jordan Davis"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required" htmlFor="contact-email">Email address</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="contact-order">Order or ticket ID (optional)</label>
                  <input
                    id="contact-order"
                    name="orderId"
                    type="text"
                    placeholder="e.g. NS-10482"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label required" htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    placeholder="Describe your issue or question in detail…"
                    className="form-textarea"
                    style={{ minHeight: 130 }}
                  />
                  <p className="form-hint">Minimum 20 characters</p>
                </div>

                <button
                  type="submit"
                  className="button button-primary"
                  style={{ width: '100%', minHeight: 46 }}
                  disabled={isPending}
                  aria-busy={isPending}
                >
                  {isPending ? 'Sending…' : 'Send message'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
