/**
 * Promo code service
 * Handles creation, validation, and application of promotional discount codes
 */

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export interface PromoCode {
  id: string
  event_id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  currency: string
  valid_from: string
  valid_to: string
  usage_limit: number | null
  used_count: number
  min_tickets: number | null
  max_discount: number | null
  active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface PromoCodeValidation {
  valid: boolean
  promo_code_id: string | null
  discount_amount: number
  error: string | null
}

export interface CreatePromoCodeInput {
  event_id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  valid_from: string
  valid_to: string
  usage_limit?: number | null
  min_tickets?: number | null
  max_discount?: number | null
}

// ─── CREATE PROMO CODE ────────────────────────────────────────────────────────

export async function createPromoCode(
  input: CreatePromoCodeInput,
  organizerId: string,
): Promise<{ success: boolean; promoCode?: PromoCode; error?: string }> {
  // Validate code format (alphanumeric, dashes, underscores)
  if (!/^[A-Z0-9_-]+$/i.test(input.code)) {
    return { success: false, error: 'Code can only contain letters, numbers, dashes, and underscores' }
  }

  if (input.code.length < 3 || input.code.length > 50) {
    return { success: false, error: 'Code must be between 3 and 50 characters' }
  }

  // Validate discount value
  if (input.discount_type === 'percentage') {
    if (input.discount_value < 1 || input.discount_value > 100) {
      return { success: false, error: 'Percentage discount must be between 1 and 100' }
    }
  } else {
    if (input.discount_value < 1) {
      return { success: false, error: 'Fixed discount must be at least $0.01' }
    }
  }

  // Validate dates
  const validFrom = new Date(input.valid_from)
  const validTo = new Date(input.valid_to)
  if (validTo <= validFrom) {
    return { success: false, error: 'End date must be after start date' }
  }

  const service = createServiceClient()

  // Verify organizer owns the event
  const { data: event } = await service
    .from('events')
    .select('organizer_id')
    .eq('id', input.event_id)
    .single<{ organizer_id: string }>()

  if (!event || event.organizer_id !== organizerId) {
    return { success: false, error: 'Not authorized' }
  }

  // Create promo code
  const { data: promoCode, error } = await service
    .from('promo_codes')
    .insert({
      event_id: input.event_id,
      code: input.code.toUpperCase(),
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      valid_from: input.valid_from,
      valid_to: input.valid_to,
      usage_limit: input.usage_limit ?? null,
      min_tickets: input.min_tickets ?? null,
      max_discount: input.max_discount ?? null,
      created_by: organizerId,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'This code already exists for this event' }
    }
    console.error('[promo-codes] createPromoCode:', error)
    return { success: false, error: 'Could not create promo code' }
  }

  return { success: true, promoCode }
}

// ─── VALIDATE PROMO CODE ──────────────────────────────────────────────────────

export async function validatePromoCode(
  code: string,
  eventId: string,
  ticketCount: number,
  subtotal: number,
): Promise<PromoCodeValidation> {
  const service = createServiceClient()

  // Call the validation function
  const { data, error } = await service.rpc('validate_promo_code', {
    p_code: code,
    p_event_id: eventId,
    p_ticket_count: ticketCount,
    p_subtotal: subtotal,
  })

  if (error) {
    console.error('[promo-codes] validatePromoCode:', error)
    return { valid: false, promo_code_id: null, discount_amount: 0, error: 'Validation failed' }
  }

  const result = (data as unknown[])[0] as PromoCodeValidation
  return result
}

// ─── GET EVENT PROMO CODES ────────────────────────────────────────────────────

export async function getEventPromoCodes(eventId: string, organizerId: string): Promise<PromoCode[]> {
  const service = createServiceClient()

  // Verify ownership
  const { data: event } = await service
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single<{ organizer_id: string }>()

  if (!event || event.organizer_id !== organizerId) return []

  const { data } = await service
    .from('promo_codes')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  return (data ?? []) as PromoCode[]
}

// ─── UPDATE PROMO CODE ────────────────────────────────────────────────────────

export async function updatePromoCode(
  promoCodeId: string,
  updates: Partial<{
    valid_from: string
    valid_to: string
    usage_limit: number | null
    min_tickets: number | null
    max_discount: number | null
    active: boolean
  }>,
  organizerId: string,
): Promise<{ success: boolean; error?: string }> {
  const service = createServiceClient()

  // Verify ownership
  const { data: promoCode } = await service
    .from('promo_codes')
    .select('event_id, event:events(organizer_id)')
    .eq('id', promoCodeId)
    .single<{ event_id: string; event: { organizer_id: string } }>()

  if (!promoCode || promoCode.event.organizer_id !== organizerId) {
    return { success: false, error: 'Not authorized' }
  }

  const { error } = await service
    .from('promo_codes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', promoCodeId)

  if (error) {
    console.error('[promo-codes] updatePromoCode:', error)
    return { success: false, error: 'Could not update promo code' }
  }

  return { success: true }
}

// ─── DELETE PROMO CODE ────────────────────────────────────────────────────────

export async function deletePromoCode(
  promoCodeId: string,
  organizerId: string,
): Promise<{ success: boolean; error?: string }> {
  const service = createServiceClient()

  // Verify ownership
  const { data: promoCode } = await service
    .from('promo_codes')
    .select('event_id, used_count, event:events(organizer_id)')
    .eq('id', promoCodeId)
    .single<{ event_id: string; used_count: number; event: { organizer_id: string } }>()

  if (!promoCode || promoCode.event.organizer_id !== organizerId) {
    return { success: false, error: 'Not authorized' }
  }

  // Don't allow deleting codes that have been used
  if (promoCode.used_count > 0) {
    return { success: false, error: 'Cannot delete a promo code that has been used. Deactivate it instead.' }
  }

  const { error } = await service
    .from('promo_codes')
    .delete()
    .eq('id', promoCodeId)

  if (error) {
    console.error('[promo-codes] deletePromoCode:', error)
    return { success: false, error: 'Could not delete promo code' }
  }

  return { success: true }
}

// ─── RECORD PROMO CODE USAGE ──────────────────────────────────────────────────

export async function recordPromoCodeUsage(
  promoCodeId: string,
  orderId: string,
  userId: string,
  discountAmount: number,
): Promise<boolean> {
  const service = createServiceClient()

  // Insert usage record
  const { error: usageError } = await service
    .from('promo_code_usage')
    .insert({
      promo_code_id: promoCodeId,
      order_id: orderId,
      user_id: userId,
      discount_amount: discountAmount,
    })

  if (usageError) {
    console.error('[promo-codes] recordPromoCodeUsage:', usageError)
    return false
  }

  // Increment used_count
  const { error: updateError } = await service.rpc('increment_promo_code_usage', {
    p_promo_code_id: promoCodeId,
  })

  if (updateError) {
    console.error('[promo-codes] increment usage count:', updateError)
  }

  return true
}

// ─── GET PROMO CODE STATS ─────────────────────────────────────────────────────

export async function getPromoCodeStats(promoCodeId: string, organizerId: string) {
  const service = createServiceClient()

  // Verify ownership
  const { data: promoCode } = await service
    .from('promo_codes')
    .select('event_id, used_count, event:events(organizer_id)')
    .eq('id', promoCodeId)
    .single<{ event_id: string; used_count: number; event: { organizer_id: string } }>()

  if (!promoCode || promoCode.event.organizer_id !== organizerId) return null

  // Get usage details
  const { data: usage } = await service
    .from('promo_code_usage')
    .select('discount_amount, created_at, order:orders(total_amount, user:profiles(full_name))')
    .eq('promo_code_id', promoCodeId)
    .order('created_at', { ascending: false })

  const totalDiscounted = (usage ?? []).reduce(
    (sum, u) => sum + ((u as { discount_amount: number }).discount_amount ?? 0),
    0,
  )

  return {
    used_count: promoCode.used_count,
    total_discounted: totalDiscounted,
    usage: usage ?? [],
  }
}
