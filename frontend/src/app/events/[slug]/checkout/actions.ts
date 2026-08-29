'use server'

import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

interface CheckoutSessionInput {
  eventId: string
  eventTitle: string
  ticketTypeId: string
  ticketTypeName: string
  quantity: number
  pricePerTicket: number
  userId: string
  promoCodeId?: string
  discountAmount?: number
}

export async function createCheckoutSessionAction(input: CheckoutSessionInput) {
  try {
    const subtotal = input.pricePerTicket * input.quantity
    const total = subtotal - (input.discountAmount || 0)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${input.eventTitle} - ${input.ticketTypeName}`,
              description: `${input.quantity} ticket${input.quantity > 1 ? 's' : ''}`,
            },
            unit_amount: input.pricePerTicket,
          },
          quantity: input.quantity,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      metadata: {
        userId: input.userId,
        eventId: input.eventId,
        ticketTypeId: input.ticketTypeId,
        quantity: input.quantity.toString(),
        promoCodeId: input.promoCodeId || '',
        discountAmount: (input.discountAmount || 0).toString(),
      },
      // Apply discount if promo code used
      ...(input.discountAmount && input.discountAmount > 0
        ? {
            discounts: [
              {
                coupon: await createStripeCoupon(input.discountAmount, subtotal),
              },
            ],
          }
        : {}),
    })

    return { success: true, sessionId: session.id, url: session.url }
  } catch (error) {
    console.error('[checkout] createCheckoutSession:', error)
    return { success: false, error: 'Failed to create checkout session' }
  }
}

async function createStripeCoupon(discountAmount: number, subtotal: number): Promise<string> {
  // Create a one-time coupon for this specific discount
  const percentOff = Math.round((discountAmount / subtotal) * 100)
  
  const coupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: 'once',
    max_redemptions: 1,
  })

  return coupon.id
}
