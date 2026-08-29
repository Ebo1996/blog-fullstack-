import Stripe from 'stripe'

// Server-side Stripe client — never import in Client Components
if (typeof window !== 'undefined') {
  throw new Error('[stripe/index.ts] Must only be used server-side.')
}

const stripeKey = process.env.STRIPE_SECRET_KEY

/** True when Stripe is properly configured with a real key */
export const stripeEnabled =
  !!stripeKey &&
  stripeKey !== 'sk_test_...' &&
  (stripeKey.startsWith('sk_test_') || stripeKey.startsWith('sk_live_'))

export const stripe = stripeEnabled
  ? new Stripe(stripeKey!, { apiVersion: '2025-02-24.acacia' })
  : null

// ─── Platform fee helpers ─────────────────────────────────────────────────────

/** Platform fee rate e.g. 0.03 = 3% */
export const PLATFORM_FEE_RATE = 0.03

/** Calculate platform fee in cents, rounded to nearest cent */
export function calculateFee(subtotalCents: number): number {
  return Math.round(subtotalCents * PLATFORM_FEE_RATE)
}

/** Calculate total including fee */
export function calculateTotal(subtotalCents: number): number {
  return subtotalCents + calculateFee(subtotalCents)
}

// ─── Stripe line items builder ────────────────────────────────────────────────

export interface CheckoutLineItem {
  ticketTypeId: string
  name: string
  description?: string | null
  unitPrice: number // cents
  quantity: number
  currency: string
}

export function buildLineItems(
  items: CheckoutLineItem[],
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  return items.map((item) => ({
    price_data: {
      currency: item.currency.toLowerCase(),
      unit_amount: item.unitPrice,
      product_data: {
        name: item.name,
        description: item.description ?? undefined,
        metadata: {
          ticket_type_id: item.ticketTypeId,
        },
      },
    },
    quantity: item.quantity,
  }))
}
