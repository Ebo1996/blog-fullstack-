import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/header'
import { UsersClient } from '@/components/admin/users-client'
import { getAdminUsers } from '@/services/admin'
import {
  suspendUserAction,
  reactivateUserAction,
  changeUserRoleAction,
} from '../actions'
import type { Profile, UserRole } from '@/types/database'
import type { AdminActionResult } from '../actions'

export const metadata: Metadata = { title: 'Admin — Organizers' }

export default async function AdminOrganizersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: organizers, count } = await getAdminUsers('', 'organizer', 1)

  const boundSuspend = async (id: string): Promise<AdminActionResult> => {
    'use server'
    return suspendUserAction(id)
  }
  const boundReactivate = async (id: string): Promise<AdminActionResult> => {
    'use server'
    return reactivateUserAction(id)
  }
  const boundChangeRole = async (id: string, newRole: UserRole): Promise<AdminActionResult> => {
    'use server'
    return changeUserRoleAction(id, newRole)
  }

  return (
    <>
      <AdminHeader title="Organizers" eyebrow="ORGANIZER MANAGEMENT" profile={profile} />

      <main className="content">
        <div className="page-intro" style={{ marginBottom: 20 }}>
          <p>{count} organizer{count !== 1 ? 's' : ''} on the platform.</p>
        </div>

        <UsersClient
          users={organizers}
          suspendAction={boundSuspend}
          reactivateAction={boundReactivate}
          changeRoleAction={boundChangeRole}
        />
      </main>
    </>
  )
}
