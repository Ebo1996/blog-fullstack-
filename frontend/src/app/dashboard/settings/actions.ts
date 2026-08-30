'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
})

export interface SettingsActionResult {
  error?: string
  success?: boolean
}

// ─── Update display name ───────────────────────────────────────────────────────
export async function updateProfileAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const parsed = profileSchema.safeParse({ full_name: formData.get('full_name') })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ full_name: parsed.data.full_name, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: 'Could not update profile. Please try again.' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

// ─── Update email address (triggers Supabase Auth confirmation email) ─────────
export async function updateEmailAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const email = (formData.get('email') as string | null)?.trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }
  if (email === user.email) return { error: 'That is already your current email address.' }

  const { error } = await supabase.auth.updateUser({ email })
  if (error) return { error: error.message }

  return {
    success: true,
    // Supabase sends a confirmation link — user must click it to finalise
  }
}

// ─── Change password ──────────────────────────────────────────────────────────
export async function changePasswordAction(
  _prev: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const password = formData.get('password') as string | null
  const confirm  = formData.get('confirm') as string | null

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }
  if (!/[A-Z]/.test(password)) {
    return { error: 'Password must contain at least one uppercase letter.' }
  }
  if (!/[0-9]/.test(password)) {
    return { error: 'Password must contain at least one number.' }
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  return { success: true }
}

// ─── Update avatar URL (after client-side upload to Supabase Storage) ─────────
export async function updateAvatarAction(avatarUrl: string): Promise<SettingsActionResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: 'Could not save avatar.' }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

// ─── Sign out ─────────────────────────────────────────────────────────────────
export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
