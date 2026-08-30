'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  type CreatePromoCodeInput,
} from '@/services/promo-codes'

export async function createPromoCodeAction(eventId: string, input: CreatePromoCodeInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await createPromoCode(input, user.id)

  if (result.success) {
    revalidatePath(`/organizer/events/${eventId}/promo-codes`)
  }

  return result
}

export async function updatePromoCodeAction(
  eventId: string,
  promoCodeId: string,
  updates: Partial<{
    valid_from: string
    valid_to: string
    usage_limit: number | null
    min_tickets: number | null
    max_discount: number | null
    active: boolean
  }>,
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await updatePromoCode(promoCodeId, updates, user.id)

  if (result.success) {
    revalidatePath(`/organizer/events/${eventId}/promo-codes`)
  }

  return result
}

export async function deletePromoCodeAction(eventId: string, promoCodeId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const result = await deletePromoCode(promoCodeId, user.id)

  if (result.success) {
    revalidatePath(`/organizer/events/${eventId}/promo-codes`)
  }

  return result
}
