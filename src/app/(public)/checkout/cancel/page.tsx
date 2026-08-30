import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { cancelPendingOrder } from '@/services/payments'

export const metadata: Metadata = { title: 'Order cancelled' }

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function getString(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}

export default async function CheckoutCancelPage({ searchParams }: Props) {
  const sp = await searchParams
  const orderId   = getString(sp['order_id'])
  const eventSlug = getString(sp['event_slug'])

  if (!orderId) redirect('/events')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Cancel the pending order server-side so inventory is not held
  if (user) {
    await cancelPendingOrder(orderId, user.id)
  }

  // Fetch event title to personalise the page
  let eventTitle = 'the event'
  if (eventSlug) {
    const { data: event } = await supabase
      .from('events')
      .select('title')
      .eq('slug', eventSlug)
      .single<{ title: string }>()
    if (event) eventTitle = event.title
  }

  const eventHref = eventSlug ? `/events/${eventSlug}` : '/events'

  return (
    <div className="auth-page" style={{ background: 'var(--background)' }}>
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(32px, 5vw, 52px) clamp(28px, 5vw, 48px)',
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* Icon */}
        <span
          style={{
            display: 'grid', placeItems: 'center',
            width: 64, height: 64, borderRadius: 'var(--radius-xl)',
            background: 'var(--muted)', color: 'var(--muted-foreground)',
            margin: '0 auto 24px',
          }}
          aria-hidden="true"
        >
          <AlertCircle size={30} />
        </span>

        {/* Heading */}
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(24px, 4vw, 34px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: '0 0 10px',
          }}
        >
          Payment cancelled
        </h1>
        <p
          style={{
            color: 'var(--muted-foreground)',
            fontSize: 14,
            lineHeight: 1.7,
            margin: '0 0 28px',
          }}
        >
          You cancelled the checkout for <strong style={{ color: 'var(--foreground)' }}>{eventTitle}</strong>.
          No payment was taken and your order has been removed.
        </p>

        {/* Reassurance note */}
        <div
          className="alert alert-info"
          style={{ textAlign: 'left', marginBottom: 28 }}
        >
          <AlertCircle size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 13 }}>
            Tickets are only reserved once payment is confirmed.
            None have been held for this order.
          </p>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Link
            href={eventHref}
            className="button button-primary"
            style={{ width: '100%', justifyContent: 'center', gap: 8 }}
          >
            <ShoppingCart size={15} aria-hidden="true" />
            Try again
          </Link>
          <Link
            href="/events"
            className="button button-outline"
            style={{ width: '100%', justifyContent: 'center', gap: 8 }}
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Browse other events
          </Link>
        </div>

        {/* Order ref */}
        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 24 }}>
          Cancelled order: {orderId.slice(0, 8).toUpperCase()}
        </p>
      </div>
    </div>
  )
}
