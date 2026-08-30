'use server'

import { revalidatePath } from 'next/cache'
import { notifyWaitlistUsers } from '@/services/waitlist'

export async function notifyWaitlistAction(
  eventId: string,
  ticketTypeId: string,
  availableSlots: number,
) {
  const notifiedCount = await notifyWaitlistUsers(eventId, ticketTypeId, availableSlots)

  revalidatePath(`/organizer/events/${eventId}/waitlist`)

  return { success: true, notifiedCount }
}
