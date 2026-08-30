import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { UserManagement } from '@/components/admin/user-management'
import { updateUserRoleAction } from './actions'

export const metadata = {
  title: 'User Management - Admin',
  description: 'Manage platform users',
}

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?redirect=/admin/users')
  }

  // Check if user is admin
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get all users
  const { data: users } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at, updated_at')
    .order('created_at', { ascending: false })

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">Manage user roles and permissions</p>
      </div>

      <UserManagement users={users || []} onUpdateRole={updateUserRoleAction} />
    </div>
  )
}
