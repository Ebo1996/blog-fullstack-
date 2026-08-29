import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/sidebar'
import type { Profile } from '@/types/database'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')
  if (profile.role !== 'admin') {
    redirect(profile.role === 'organizer' ? '/organizer' : '/dashboard')
  }

  return (
    <div className="app-shell admin-shell">
      <AdminSidebar profile={profile} />
      <div className="main">{children}</div>
    </div>
  )
}
