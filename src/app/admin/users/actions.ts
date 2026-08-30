'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function updateUserRoleAction(userId: string, newRole: 'attendee' | 'organizer' | 'admin') {
  const supabase = await createClient()

  // Verify current user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Not authenticated')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as { role: string }).role !== 'admin') {
    throw new Error('Not authorized')
  }

  // Use service client to directly update — bypasses RLS safely
  // because we already verified the caller is admin above
  const serviceClient = createServiceClient()

  const { error } = await serviceClient
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    console.error('[admin] updateUserRole:', error)
    throw new Error('Failed to update user role: ' + error.message)
  }

  revalidatePath('/admin/users')

  return { success: true }
}
