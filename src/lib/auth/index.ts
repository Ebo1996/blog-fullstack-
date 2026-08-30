import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole, Profile } from '@/types/database'

// ─── GET CURRENT USER (server-side) ──────────────────────────────────────────

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null
  return user
}

// ─── GET CURRENT PROFILE ─────────────────────────────────────────────────────

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) return null
  return data
}

// ─── REQUIRE AUTH ─────────────────────────────────────────────────────────────

export async function requireAuth() {
  const user = await getUser()
  if (!user) redirect('/login')
  return user
}

// ─── REQUIRE ROLE ─────────────────────────────────────────────────────────────

export async function requireRole(requiredRole: UserRole) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: UserRole }>()

  if (!profile) redirect('/login')

  if (profile.role !== requiredRole) {
    const dashboardMap: Record<UserRole, string> = {
      attendee: '/dashboard',
      organizer: '/organizer',
      admin: '/admin',
    }
    redirect(dashboardMap[profile.role] ?? '/dashboard')
  }

  return { user, role: profile.role }
}

// ─── REQUIRE ORGANIZER OR ADMIN ───────────────────────────────────────────────

export async function requireOrganizerOrAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: UserRole }>()

  if (!profile || (profile.role !== 'organizer' && profile.role !== 'admin')) {
    redirect('/dashboard')
  }

  return { user, role: profile.role }
}

// ─── SIGN OUT (server action) ─────────────────────────────────────────────────

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
