'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Minus, Plus, ShoppingCart, Calendar,
  Lock, CalendarCheck, CheckCircle, Clock,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { config } from '@/config'
import type { TicketType } from '@/types/database'

interface TicketPurchasePanelProps {
  eventId: string
  eventSlug: string
  ticketTypes: TicketType[]
  eventTitle: string
  startAt: string
  isAuthenticated: boolean
}

interface Selection {
  [ticketTypeId: string]: number
}

export function TicketPurchasePanel({
  eventId,
  eventSlug,
  ticketTypes,
  eventTitle: _eventTitle,
  startAt,
  isAuthenticated,
}: TicketPurchasePanelProps) {
  const router = useRouter()
  const [selection, setSelection] = useState<Selection>({})
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [rsvpDone, setRsvpDone] = useState<'confirmed' | 'waitlisted' | null>(null)
  const [chapaNotConfigured, setPaymentNotConfigured] = useState(false)

  const activeTypes = ticketTypes.filter((t) => t.status !== 'inactive')

  // ─── Quantity helpers ────────────────────────────────────────────────────
  function setQty(id: string, delta: number) {
    setSelection((prev) => {
      const current = prev[id] ?? 0
      const tt = ticketTypes.find((t) => t.id === id)
      const remaining = tt ? tt.quantity - tt.sold_quantity : 0
      const next = Math.max(0, Math.min(config.tickets.maxPerOrder, remaining, current + delta))
      if (next === 0) {
        const { [id]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: next }
    })
  }

  const totalItems = Object.values(selection).reduce((a, b) => a + b, 0)

  const subtotal = Object.entries(selection).reduce((sum, [id, qty]) => {
    const tt = ticketTypes.find((t) => t.id === id)
    return sum + (tt?.price ?? 0) * qty
  }, 0)

  const fees  = Math.round(subtotal * config.fees.platformFeeRate)
  const total = subtotal + fees

  // True when every selected ticket type is free (price === 0)
  const allFree = Object.entries(selection).every(([id]) => {
    const tt = ticketTypes.find((t) => t.id === id)
    return (tt?.price ?? 0) === 0
  })

  // ─── Checkout (paid tickets) ─────────────────────────────────────────────
  async function handleCheckout() {
    if (totalItems === 0) return
    if (!isAuthenticated) {
      router.push(`/login?redirectTo=/events/${eventSlug}`)
      return
    }

    setCheckoutLoading(true)
    setError(null)

    const items = Object.entries(selection).map(([ticketTypeId, quantity]) => ({
      ticketTypeId,
      quantity,
    }))

    try {
      const res  = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ eventId, items }),
      })

      const data = await res.json() as { url?: string; error?: string; provider?: string; hint?: string }

      console.log('[checkout] Response:', { status: res.status, data })

      if (res.status === 503) {
        setPaymentNotConfigured(true)
        return
      }

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Checkout failed. Please try again.')
        return
      }
      // Redirect to Chapa hosted checkout page
      console.log('[checkout] Redirecting to:', data.url)
      window.location.href = data.url
    } catch (err) {
      console.error('[checkout] Catch block error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setCheckoutLoading(false)
    }
  }

  // ─── RSVP (free tickets / free event) ────────────────────────────────────
  function handleRSVP() {
    if (!isAuthenticated) {
      router.push(`/login?redirectTo=/events/${eventSlug}`)
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        const res  = await fetch('/api/rsvp', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ eventId }),
        })

        const data = await res.json() as { success?: boolean; status?: string; error?: string }

        if (!res.ok || !data.success) {
          setError(data.error ?? 'Could not RSVP. Please try again.')
          return
        }

        setRsvpDone((data.status as 'confirmed' | 'waitlisted') ?? 'confirmed')
      } catch {
        setError('Network error. Please try again.')
      }
    })
  }

  // ─── No active ticket types ───────────────────────────────────────────────
  if (activeTypes.length === 0) {
    return (
      <div className="panel">
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', textAlign: 'center', padding: '20px 0' }}>
          Ticket sales are not currently available for this event.
        </p>
      </div>
    )
  }

  // ─── RSVP success state ───────────────────────────────────────────────────
  if (rsvpDone) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '32px 24px' }}>
        <span
          style={{
            display: 'grid', placeItems: 'center',
            width: 52, height: 52, borderRadius: 'var(--radius-lg)',
            background: rsvpDone === 'confirmed' ? 'var(--success-bg)' : 'var(--warning-bg)',
            color: rsvpDone === 'confirmed' ? 'var(--success)' : 'var(--warning)',
            margin: '0 auto 16px',
          }}
          aria-hidden="true"
        >
          {rsvpDone === 'confirmed'
            ? <CheckCircle size={26} />
            : <Clock size={26} />
          }
        </span>
        <p
          style={{
            fontFamily: 'var(--font-serif)', fontSize: 20,
            fontWeight: 400, margin: '0 0 8px',
          }}
        >
          {rsvpDone === 'confirmed' ? "You're going!" : "You're on the waitlist"}
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 20px', lineHeight: 1.6 }}>
          {rsvpDone === 'confirmed'
            ? 'Your RSVP is confirmed. See you there!'
            : "We'll notify you if a spot opens up."}
        </p>
        <a href="/dashboard/rsvps" className="button button-outline" style={{ display: 'inline-flex', gap: 8, fontSize: 12 }}>
          <CalendarCheck size={14} aria-hidden="true" />
          View my RSVPs
        </a>
      </div>
    )
  }

  // ─── Chapa not configured (demo mode) ───────────────────────────────────
  if (chapaNotConfigured) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '32px 24px' }}>
        <div style={{
          display: 'grid', placeItems: 'center',
          width: 52, height: 52, borderRadius: 'var(--radius-lg)',
          background: 'rgba(216,174,98,0.1)', color: 'var(--warning)',
          margin: '0 auto 16px',
        }}>
          <Lock size={24} aria-hidden="true" />
        </div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: '0 0 10px' }}>
          Payments not configured
        </p>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 0 8px', lineHeight: 1.6 }}>
          Add your Chapa secret key to{' '}
          <code style={{ fontFamily: 'monospace', background: 'var(--muted)', padding: '1px 5px', borderRadius: 4 }}>
            .env.local
          </code>{' '}
          to enable checkout:
        </p>
        <div style={{
          background: 'var(--muted)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '12px 14px',
          textAlign: 'left', fontSize: 11, fontFamily: 'monospace',
          color: 'var(--muted-foreground)', lineHeight: 1.7, marginTop: 12,
        }}>
          <div style={{ color: 'var(--success)' }}>CHAPA_SECRET_KEY=CHASECK_TEST-...</div>
        </div>
        <a
          href="https://dashboard.chapa.co/register"
          target="_blank"
          rel="noopener noreferrer"
          className="button button-outline"
          style={{ marginTop: 16, fontSize: 12, display: 'inline-flex', gap: 6 }}
        >
          Get Chapa keys — it&apos;s free →
        </a>
      </div>
    )
  }

  // ─── Main panel ──────────────────────────────────────────────────────────
  return (
    <div className="panel">

      {/* Event date summary */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '0 0 16px', borderBottom: '1px solid var(--border)',
          marginBottom: 20, color: 'var(--muted-foreground)', fontSize: 12,
        }}
      >
        <Calendar size={13} aria-hidden="true" />
        {formatDate(startAt, 'EEE, MMM d, yyyy · h:mm a')}
      </div>

      <h2
        style={{
          fontFamily: 'var(--font-serif)', fontSize: 20,
          fontWeight: 400, margin: '0 0 20px', letterSpacing: '-0.01em',
        }}
      >
        {allFree && activeTypes.every((t) => t.price === 0)
          ? 'RSVP for free'
          : 'Select tickets'}
      </h2>

      {/* Ticket type rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activeTypes.map((tt) => {
          const qty       = selection[tt.id] ?? 0
          const remaining = tt.quantity - tt.sold_quantity
          const isSoldOut = tt.status === 'sold_out' || remaining <= 0
          const isFree    = tt.price === 0

          return (
            <div
              key={tt.id}
              style={{
                border: '1px solid',
                borderColor: qty > 0 ? 'rgba(215,243,106,0.35)' : 'var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 14,
                background: qty > 0 ? 'rgba(215,243,106,0.04)' : 'transparent',
                transition: 'border-color var(--transition-fast), background var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>{tt.name}</p>
                  {tt.description && (
                    <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '0 0 6px', lineHeight: 1.5 }}>
                      {tt.description}
                    </p>
                  )}
                  <p style={{
                    fontSize: 14, fontWeight: 700, margin: 0,
                    color: isFree ? 'var(--success)' : 'var(--foreground)',
                  }}>
                    {isFree ? 'Free' : formatCurrency(tt.price, tt.currency)}
                  </p>
                  {!isSoldOut && remaining <= 20 && (
                    <p style={{ fontSize: 10, color: 'var(--warning)', marginTop: 4, fontWeight: 600 }}>
                      Only {remaining} left
                    </p>
                  )}
                </div>

                {isSoldOut ? (
                  <span className="badge badge-neutral" style={{ marginTop: 2 }}>Sold out</span>
                ) : isFree ? (
                  /* Free tickets — single RSVP, no qty selector */
                  <span
                    className="badge badge-success"
                    style={{ marginTop: 2 }}
                  >
                    Free
                  </span>
                ) : (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}
                    role="group"
                    aria-label={`Quantity for ${tt.name}`}
                  >
                    <button
                      onClick={() => setQty(tt.id, -1)}
                      disabled={qty === 0}
                      aria-label={`Remove one ${tt.name}`}
                      style={{
                        display: 'grid', placeItems: 'center',
                        width: 28, height: 28, borderRadius: 7,
                        border: '1px solid var(--border)', background: 'var(--muted)',
                        cursor: qty === 0 ? 'not-allowed' : 'pointer',
                        opacity: qty === 0 ? 0.4 : 1, color: 'var(--foreground)',
                      }}
                    >
                      <Minus size={12} aria-hidden="true" />
                    </button>
                    <span
                      aria-live="polite"
                      aria-label={`${qty} selected`}
                      style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}
                    >
                      {qty}
                    </span>
                    <button
                      onClick={() => setQty(tt.id, 1)}
                      disabled={qty >= Math.min(config.tickets.maxPerOrder, remaining)}
                      aria-label={`Add one ${tt.name}`}
                      style={{
                        display: 'grid', placeItems: 'center',
                        width: 28, height: 28, borderRadius: 7,
                        border: '1px solid var(--border)', background: 'var(--muted)',
                        cursor: 'pointer', color: 'var(--foreground)',
                        opacity: qty >= Math.min(config.tickets.maxPerOrder, remaining) ? 0.4 : 1,
                      }}
                    >
                      <Plus size={12} aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Order summary (paid only) */}
      {totalItems > 0 && !allFree && (
        <div style={{ marginTop: 20, padding: '16px 0 0', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted-foreground)' }}>
              <span>Subtotal ({totalItems} ticket{totalItems !== 1 ? 's' : ''})</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--muted-foreground)' }}>
              <span>Platform fee (3%)</span>
              <span>{formatCurrency(fees)}</span>
            </div>
            <div
              style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 14, fontWeight: 700,
                paddingTop: 10, borderTop: '1px solid var(--border)',
              }}
            >
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p
          role="alert"
          style={{ fontSize: 12, color: 'var(--error)', marginTop: 12, lineHeight: 1.5 }}
        >
          {error}
        </p>
      )}

      {/* ── CTA button ─────────────────────────────────────────────────────── */}
      {/* All-free event → single RSVP button, no qty required */}
      {activeTypes.every((t) => t.price === 0) ? (
        <button
          className="button button-primary"
          style={{ width: '100%', marginTop: 20, minHeight: 46, fontSize: 14, gap: 8 }}
          onClick={handleRSVP}
          disabled={isPending}
          aria-busy={isPending}
        >
          <CalendarCheck size={16} aria-hidden="true" />
          {isPending ? 'Submitting…' : isAuthenticated ? 'RSVP — Free' : 'Sign in to RSVP'}
          {!isAuthenticated && <Lock size={13} aria-hidden="true" style={{ marginLeft: 4, opacity: 0.7 }} />}
        </button>
      ) : (
        <button
          className="button button-primary"
          style={{ width: '100%', marginTop: 20, minHeight: 46, fontSize: 14, gap: 8 }}
          onClick={handleCheckout}
          disabled={totalItems === 0 || checkoutLoading}
          aria-busy={checkoutLoading}
        >
          <ShoppingCart size={16} aria-hidden="true" />
          {checkoutLoading
            ? 'Redirecting to Chapa…'
            : !isAuthenticated && totalItems > 0
              ? 'Sign in to purchase'
              : totalItems === 0
                ? 'Select tickets to continue'
                : `Checkout — ${formatCurrency(total)}`}
          {!isAuthenticated && totalItems > 0 && (
            <Lock size={13} aria-hidden="true" style={{ marginLeft: 4, opacity: 0.7 }} />
          )}
        </button>
      )}

      {/* Chapa trust badge */}
      {!activeTypes.every((t) => t.price === 0) && (
        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', textAlign: 'center', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Lock size={10} aria-hidden="true" />
          Secure checkout via Chapa · Telebirr &amp; bank supported
        </p>
      )}
    </div>
  )
}
