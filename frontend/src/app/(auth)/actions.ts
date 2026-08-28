'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validation/auth'

export interface AuthActionResult {
  error?: string
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export async function loginAction(
  _prev: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    // Deliberately vague — don't confirm whether email exists
    return { error: 'Invalid email or password' }
  }

  // Fetch the user's role to redirect correctly
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Login failed. Please try again.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  const roleRedirect: Record<string, string> = {
    admin:     '/admin',
    organizer: '/organizer',
    attendee:  '/dashboard',
  }

  redirect(roleRedirect[profile?.role ?? 'attendee'] ?? '/dashboard')
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────

export async function registerAction(
  _prev: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const raw = {
    full_name:       formData.get('full_name'),
    email:           formData.get('email'),
    password:        formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        role: 'attendee', // always start as attendee
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'An account with this email already exists.' }
    }
    return { error: 'Registration failed. Please try again.' }
  }

  redirect('/dashboard')
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────

export async function forgotPasswordAction(
  _prev: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const raw = { email: formData.get('email') }

  const parsed = forgotPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid email' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })

  // Always return success — never confirm whether email exists
  if (error) {
    console.error('[forgotPassword]', error.message)
  }

  return {}
}

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────

export async function resetPasswordAction(
  _prev: AuthActionResult,
  formData: FormData,
): Promise<AuthActionResult> {
  const raw = {
    password:        formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = resetPasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })

  if (error) {
    return { error: 'Password reset failed. Please request a new reset link.' }
  }

  redirect('/login?reset=success')
}

// ─── SIGN OUT ─────────────────────────────────────────────────────────────────

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
