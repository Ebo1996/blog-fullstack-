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

  // Use admin RPC to update role — this bypasses RLS correctly
  const serviceClient = createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (serviceClient as any).rpc('admin_set_user_role', {
    target_user_id: userId,
    new_role: newRole,
  })

  if (error) {
    console.error('[admin] updateUserRole:', error)
    throw new Error('Failed to update user role: ' + error.message)
  }

  revalidatePath('/admin/users')

  return { success: true }
}
