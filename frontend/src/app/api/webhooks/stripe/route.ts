import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { withRateLimit, RATE_LIMITS } from '@/lib/monitoring/rate-limiter'
import { logger } from '@/lib/monitoring/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  
  return withRateLimit(`webhook:${ip}`, RATE_LIMITS.WEBHOOK, async () => {
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      logger.error('[webhook] Signature verification failed', err)
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
    }

    logger.info(`[webhook] Received event: ${event.type}`, { eventId: event.id })

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
          break

        case 'payment_intent.payment_failed':
          await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
          break

        default:
          logger.info(`[webhook] Unhandled event type: ${event.type}`)
      }

      return NextResponse.json({ received: true })
    } catch (error) {
      logger.error('[webhook] Error processing event', error, { eventType: event.type, eventId: event.id })
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
  })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createServiceClient()
  const metadata = session.metadata!

  logger.payment('Checkout completed', {
    sessionId: session.id,
    userId: metadata.userId,
    eventId: metadata.eventId,
    amount: session.amount_total,
  })

  // Call purchase_tickets RPC
  const { data, error } = await supabase.rpc('purchase_tickets', {
    p_user_id: metadata.userId,
    p_event_id: metadata.eventId,
    p_ticket_type_id: metadata.ticketTypeId,
    p_quantity: parseInt(metadata.quantity),
    p_stripe_payment_intent: session.payment_intent as string,
  })

  if (error) {
    logger.error('[webhook] purchase_tickets failed', error, { sessionId: session.id })
    throw error
  }

  const result = (data as unknown[])[0] as {
    success: boolean
    order_id: string | null
    ticket_ids: string[] | null
    error: string | null
  }

  if (!result.success) {
    logger.error('[webhook] Ticket purchase failed', new Error(result.error || 'Unknown error'), {
      sessionId: session.id,
    })
    throw new Error(result.error || 'Failed to create tickets')
  }

  logger.payment('Tickets created successfully', {
    orderId: result.order_id,
    ticketCount: result.ticket_ids?.length,
  })

  // Create notifications
  await supabase.from('notifications').insert([
    {
      user_id: metadata.userId,
      type: 'payment_completed',
      title: 'Payment Successful',
      message: `Your payment of ${formatAmount(session.amount_total)} has been processed.`,
      data: { order_id: result.order_id },
    },
    {
      user_id: metadata.userId,
      type: 'ticket_purchased',
      title: 'Tickets Purchased',
      message: `You have successfully purchased ${metadata.quantity} ticket(s).`,
      data: { order_id: result.order_id, ticket_ids: result.ticket_ids },
    },
  ])

  // Record promo code usage if applicable
  if (metadata.promoCodeId && metadata.discountAmount) {
    const { recordPromoCodeUsage } = await import('@/services/promo-codes')
    await recordPromoCodeUsage(
      metadata.promoCodeId,
      result.order_id!,
      metadata.userId,
      parseInt(metadata.discountAmount),
    )
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  logger.error('[webhook] Payment failed', null, {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
  })

  const supabase = createServiceClient()

  // Try to get user from metadata
  if (paymentIntent.metadata?.userId) {
    await supabase.from('notifications').insert({
      user_id: paymentIntent.metadata.userId,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: 'Your payment could not be processed. Please try again or use a different payment method.',
      data: { payment_intent_id: paymentIntent.id },
    })
  }
}

function formatAmount(cents: number | null): string {
  if (!cents) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'usd',
  }).format(cents / 100)
}
