'use server'

interface CheckoutInput {
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

interface CheckoutResult {
  success: boolean
  url?: string | null
  sessionId?: string
  error?: string
}

export async function createCheckoutSessionAction(
  input: CheckoutInput,
): Promise<CheckoutResult> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    const res = await fetch(`${appUrl}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId: input.eventId,
        items: [
          {
            ticketTypeId: input.ticketTypeId,
            quantity: input.quantity,
          },
        ],
        promoCodeId: input.promoCodeId,
        discountAmount: input.discountAmount,
      }),
    })

    const data = await res.json() as { url?: string; error?: string }

    if (!res.ok || !data.url) {
      return { success: false, error: data.error ?? 'Checkout failed' }
    }

    return { success: true, url: data.url }
  } catch (err) {
    console.error('[createCheckoutSessionAction]', err)
    return { success: false, error: 'Network error. Please try again.' }
  }
}
