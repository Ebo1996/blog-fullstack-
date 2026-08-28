'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  CheckCircle,
  Clock,
  Ticket,
  CalendarDays,
  MapPin,
  ArrowUpRight,
  XCircle,
  QrCode,
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils/format'
import type { OrderTicketSummary } from '@/services/payments'

interface EventSummary {
  id: string
  title: string
  slug: string
  start_at: string
  venue_name: string | null
  city: string | null
}

interface SuccessClientProps {
  orderId: string
  initialStatus: string
  totalAmount: number
  currency: string
  event: EventSummary
  initialTickets: OrderTicketSummary[]
}

const POLL_INTERVAL_MS = 2000   // poll every 2 s
const POLL_MAX_ATTEMPTS = 30    // give up after 60 s (webhook may be delayed)

export function SuccessClient({
  orderId,
  initialStatus,
  totalAmount,
  currency,
  event,
  initialTickets,
}: SuccessClientProps) {
  const [status, setStatus] = useState(initialStatus)
  const [tickets, setTickets] = useState<OrderTicketSummary[]>(initialTickets)
  const [attempts, setAttempts] = useState(0)
  const [polling, setPolling] = useState(initialStatus === 'pending')

  // ── Poll /api/orders/[orderId]/status until paid or failed ───────────────
  const poll = useCallback(async () => {
    try {
      const res  = await fetch(`/api/orders/${orderId}/status`, { cache: 'no-store' })
      const data = await res.json() as { status?: string }
      const newStatus = data.status ?? 'pending'
      setStatus(newStatus)

      if (newStatus === 'paid') {
        setPolling(false)
        // Fetch tickets now that they exist
        const ticketRes = await fetch(`/api/orders/${orderId}/tickets`, { cache: 'no-store' })
        if (ticketRes.ok) {
          const ticketData = await ticketRes.json() as { tickets?: OrderTicketSummary[] }
          setTickets(ticketData.tickets ?? [])
        }
        return
      }

      if (newStatus === 'failed' || newStatus === 'cancelled') {
        setPolling(false)
        return
      }
    } catch {
      // Network error — keep polling
    }
  }, [orderId])

  useEffect(() => {
    if (!polling) return

    const interval = setInterval(() => {
      setAttempts((prev) => {
        const next = prev + 1
        if (next >= POLL_MAX_ATTEMPTS) {
          setPolling(false)
          clearInterval(interval)
        }
        return next
      })
      void poll()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [polling, poll])

  // ── Render states ─────────────────────────────────────────────────────────

  if (status === 'paid') {
    return <SuccessPaid event={event} totalAmount={totalAmount} currency={currency} orderId={orderId} tickets={tickets} />
  }

  if (status === 'failed') {
    return <SuccessFailed event={event} orderId={orderId} />
  }

  if (status === 'pending' && attempts >= POLL_MAX_ATTEMPTS) {
    return <SuccessTimeout orderId={orderId} />
  }

  // Still pending — show pulsing confirmation screen
  return <SuccessPending event={event} totalAmount={totalAmount} currency={currency} />
}

// ─── Paid state ───────────────────────────────────────────────────────────────

function SuccessPaid({
  event,
  totalAmount,
  currency,
  orderId,
  tickets,
}: {
  event: EventSummary
  totalAmount: number
  currency: string
  orderId: string
  tickets: OrderTicketSummary[]
}) {
  return (
    <div className="auth-page" style={{ background: 'var(--background)', padding: '48px 24px' }}>
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Success header ─────────────────────────────────── */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            padding: '40px 36px',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'grid', placeItems: 'center',
              width: 64, height: 64, borderRadius: 'var(--radius-xl)',
              background: 'var(--success-bg)', color: 'var(--success)',
              margin: '0 auto 20px',
            }}
            aria-hidden="true"
          >
            <CheckCircle size={32} />
          </span>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(26px, 4vw, 36px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              margin: '0 0 8px',
            }}
          >
            You&apos;re going!
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 14, margin: '0 0 20px' }}>
            Payment confirmed · {formatCurrency(totalAmount, currency)}
          </p>

          {/* Event info */}
          <div
            style={{
              background: 'var(--muted)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              textAlign: 'left',
              marginBottom: 24,
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{event.title}</p>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={12} aria-hidden="true" />
              {formatDate(event.start_at, 'EEE, MMM d, yyyy · h:mm a')}
            </p>
            {(event.venue_name || event.city) && (
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={12} aria-hidden="true" />
                {[event.venue_name, event.city].filter(Boolean).join(', ')}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href="/dashboard/tickets"
              className="button button-primary"
              style={{ flex: 1, justifyContent: 'center', gap: 8 }}
            >
              <QrCode size={15} aria-hidden="true" />
              View tickets
            </Link>
            <Link
              href={`/dashboard/orders/${orderId}`}
              className="button button-outline"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              Order details
            </Link>
          </div>
        </div>

        {/* ── Ticket list ────────────────────────────────────── */}
        {tickets.length > 0 && (
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--muted-foreground)', textTransform: 'uppercase', margin: 0 }}>
                YOUR TICKETS
              </p>
            </div>
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/dashboard/tickets/${t.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseOver={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--muted)' }}
                onMouseOut={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '' }}
              >
                <span
                  style={{
                    display: 'grid', placeItems: 'center',
                    width: 34, height: 34, borderRadius: 8,
                    background: 'var(--muted)', color: 'var(--primary)', flexShrink: 0,
                  }}
                  aria-hidden="true"
                >
                  <Ticket size={15} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.ticket_type_name}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>
                    {t.ticket_code}
                  </p>
                </div>
                <ArrowUpRight size={14} style={{ color: 'var(--muted-foreground)', flexShrink: 0 }} aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}

        {/* Next steps hint */}
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', textAlign: 'center' }}>
          Your QR code is ready in{' '}
          <Link href="/dashboard/tickets" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            My tickets
          </Link>
          . Screenshots work too.
        </p>
      </div>
    </div>
  )
}

// ─── Still pending (waiting for webhook) ─────────────────────────────────────

function SuccessPending({
  event,
  totalAmount,
  currency,
}: {
  event: EventSummary
  totalAmount: number
  currency: string
}) {
  return (
    <div className="auth-page" style={{ background: 'var(--background)' }}>
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '48px 40px',
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Pulsing clock icon */}
        <span
          style={{
            display: 'grid', placeItems: 'center',
            width: 64, height: 64, borderRadius: 'var(--radius-xl)',
            background: 'rgba(215,243,106,0.1)', color: 'var(--primary)',
            margin: '0 auto 20px',
            animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
          }}
          aria-hidden="true"
        >
          <Clock size={32} />
        </span>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(24px, 4vw, 34px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: '0 0 10px',
          }}
        >
          Confirming your payment…
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.65, margin: '0 0 24px' }}>
          We&apos;re waiting for payment confirmation from Stripe.
          This usually takes a few seconds.
        </p>

        <div
          style={{
            background: 'var(--muted)', borderRadius: 'var(--radius-md)',
            padding: '12px 16px', marginBottom: 24,
          }}
        >
          <p style={{ fontWeight: 600, fontSize: 13, margin: '0 0 4px' }}>{event.title}</p>
          <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>
            {formatCurrency(totalAmount, currency)}
          </p>
        </div>

        <div
          style={{
            display: 'flex', gap: 6, justifyContent: 'center',
            marginBottom: 20,
          }}
          aria-label="Loading"
          role="status"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--primary)',
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
              aria-hidden="true"
            />
          ))}
        </div>

        <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
          Don&apos;t close this tab. You&apos;ll be redirected automatically.
        </p>

        {/* CSS keyframes injected inline for the loader dots */}
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </div>
    </div>
  )
}

// ─── Payment failed ───────────────────────────────────────────────────────────

function SuccessFailed({ event, orderId }: { event: EventSummary; orderId: string }) {
  return (
    <div className="auth-page" style={{ background: 'var(--background)' }}>
      <div
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '48px 40px',
          maxWidth: 480, width: '100%', textAlign: 'center',
        }}
      >
        <span
          style={{
            display: 'grid', placeItems: 'center',
            width: 64, height: 64, borderRadius: 'var(--radius-xl)',
            background: 'var(--error-bg)', color: 'var(--error)',
            margin: '0 auto 20px',
          }}
          aria-hidden="true"
        >
          <XCircle size={32} />
        </span>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(24px, 4vw, 34px)',
            fontWeight: 400, letterSpacing: '-0.02em',
            margin: '0 0 10px',
          }}
        >
          Payment failed
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.65, margin: '0 0 28px' }}>
          Your payment for <strong>{event.title}</strong> could not be processed.
          No charge was made.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href={`/events/${event.slug}`}
            className="button button-primary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Try again
          </Link>
          <Link
            href="/events"
            className="button button-outline"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Browse events
          </Link>
        </div>

        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 20 }}>
          Order reference: {orderId.slice(0, 8).toUpperCase()}
        </p>
      </div>
    </div>
  )
}

// ─── Timeout (webhook took too long) ─────────────────────────────────────────

function SuccessTimeout({ orderId }: { orderId: string }) {
  return (
    <div className="auth-page" style={{ background: 'var(--background)' }}>
      <div
        style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: '48px 40px',
          maxWidth: 480, width: '100%', textAlign: 'center',
        }}
      >
        <span
          style={{
            display: 'grid', placeItems: 'center',
            width: 64, height: 64, borderRadius: 'var(--radius-xl)',
            background: 'var(--warning-bg)', color: 'var(--warning)',
            margin: '0 auto 20px',
          }}
          aria-hidden="true"
        >
          <Clock size={32} />
        </span>

        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(22px, 3vw, 30px)',
            fontWeight: 400, letterSpacing: '-0.02em',
            margin: '0 0 10px',
          }}
        >
          Taking longer than usual
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 14, lineHeight: 1.65, margin: '0 0 24px' }}>
          Your payment went through with Stripe but we&apos;re still confirming your tickets.
          Check your dashboard in a few minutes — your tickets will appear there once confirmed.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href="/dashboard/tickets"
            className="button button-primary"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Check my tickets
          </Link>
          <Link
            href="/dashboard/orders"
            className="button button-outline"
            style={{ flex: 1, justifyContent: 'center' }}
          >
            View orders
          </Link>
        </div>

        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 20 }}>
          Reference: {orderId.slice(0, 8).toUpperCase()} ·{' '}
          <a href="mailto:support@northstar.dev" style={{ color: 'var(--primary)' }}>
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}
