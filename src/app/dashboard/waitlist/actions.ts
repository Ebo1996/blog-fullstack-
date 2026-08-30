'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { removeFromWaitlist } from '@/services/waitlist'

export async function removeFromWaitlistAction(registrationId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  await removeFromWaitlist(registrationId, user.id)

  revalidatePath('/dashboard/waitlist')
}
