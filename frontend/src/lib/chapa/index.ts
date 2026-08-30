/**
 * Chapa payment gateway — server-side only.
 * Docs: https://developer.chapa.co / https://docs.chapa.global
 *
 * Key differences from Stripe:
 * - No SDK needed — pure REST API with fetch
 * - Amounts are in ETB (Ethiopian Birr), NOT cents
 * - Initialize returns a checkout_url to redirect the user to
 * - Verify via GET /transaction/verify/:tx_ref after return
 * - Webhook: Chapa sends POST to your callback URL with tx_ref
 */

if (typeof window !== 'undefined') {
  throw new Error('[chapa] This module must only be used server-side.')
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY ?? ''
const CHAPA_BASE_URL   = 'https://api.chapa.co/v1'

/** True when a real Chapa key is configured */
export const chapaEnabled =
  !!CHAPA_SECRET_KEY &&
  CHAPA_SECRET_KEY !== 'CHASECK_TEST-...' &&
  (CHAPA_SECRET_KEY.startsWith('CHASECK_TEST-') || CHAPA_SECRET_KEY.startsWith('CHASECK-'))

// ─── Fee helpers (same 3% platform fee, now in ETB) ──────────────────────────

export const PLATFORM_FEE_RATE = 0.03

/** Amount is in ETB (e.g. 150.00 = 150 birr) */
export function calculateFee(amountETB: number): number {
  return Math.round(amountETB * PLATFORM_FEE_RATE * 100) / 100
}

export function calculateTotal(amountETB: number): number {
  return Math.round((amountETB + calculateFee(amountETB)) * 100) / 100
}

/**
 * Convert stored price (cents/agelot) to ETB float.
 * Our DB stores prices in "cents" (smallest unit) just like Stripe.
 * 1 ETB = 100 agelot, so we divide by 100.
 */
export function centsToETB(cents: number): number {
  return cents / 100
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChapaInitializeParams {
  amount: number          // ETB float e.g. 150.00
  currency?: string       // default 'ETB'
  email: string
  first_name: string
  last_name?: string
  tx_ref: string          // unique transaction reference (your order ID)
  callback_url: string    // Chapa POSTs here when payment completes
  return_url: string      // browser redirect after payment
  customization?: {
    title?: string
    description?: string
  }
}

export interface ChapaInitializeResponse {
  message: string
  status: 'success' | 'failed'
  data: {
    checkout_url: string
  }
}

export interface ChapaVerifyResponse {
  message: string
  status: 'success' | 'failed'
  data: {
    first_name: string
    last_name: string
    email: string
    currency: string
    amount: string
    charge: string
    mode: string
    method: string
    type: string
    status: 'success' | 'failed' | 'pending'
    reference: string
    tx_ref: string
    customization: { title: string; description: string; logo: string | null }
    meta: Record<string, unknown> | null
    created_at: string
    updated_at: string
  }
}

// ─── Initialize a payment ─────────────────────────────────────────────────────

export async function initializePayment(
  params: ChapaInitializeParams,
): Promise<ChapaInitializeResponse> {
  const res = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      amount:       params.amount.toFixed(2),
      currency:     params.currency ?? 'ETB',
      email:        params.email,
      first_name:   params.first_name,
      last_name:    params.last_name ?? '',
      tx_ref:       params.tx_ref,
      callback_url: params.callback_url,
      return_url:   params.return_url,
      customization: params.customization,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Chapa initialize failed (${res.status}): ${text}`)
  }

  return res.json() as Promise<ChapaInitializeResponse>
}

// ─── Verify a payment ─────────────────────────────────────────────────────────

export async function verifyPayment(txRef: string): Promise<ChapaVerifyResponse> {
  const res = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Chapa verify failed (${res.status}): ${text}`)
  }

  return res.json() as Promise<ChapaVerifyResponse>
}

// ─── Generate a unique tx_ref ─────────────────────────────────────────────────
// Chapa requires each transaction reference to be unique across your account.

export function buildTxRef(orderId: string): string {
  // Format: ns-<first8charsOfOrderId>-<timestamp>
  return `ns-${orderId.slice(0, 8)}-${Date.now()}`
}
