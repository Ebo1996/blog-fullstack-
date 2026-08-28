'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function cancelRSVPAction(registrationId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('registrations')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', registrationId)
    .eq('user_id', user.id)
    .eq('status', 'confirmed')

  revalidatePath('/dashboard/rsvps')
}
