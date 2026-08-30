'use server'

import { revalidatePath } from 'next/cache'
import { createRefund } from '@/services/refunds'
import { createClient } from '@/lib/supabase/server'

export interface RefundActionResult {
  success: boolean
  refundId?: string
  error?: string
}

export async function createRefundAction(
  orderId: string,
  eventId: string,
  amount: number,
  reason: string,
): Promise<RefundActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const result = await createRefund(orderId, amount, reason, user.id)
  
  if (result.success) {
    revalidatePath(`/organizer/events/${eventId}/orders/${orderId}`)
    revalidatePath(`/organizer/events/${eventId}/orders`)
  }

  return result
}
