import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Handles Supabase Auth email confirmation links and OAuth callbacks.
// Supabase redirects here with a `code` query param after the user clicks
// a confirmation / password-reset link.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[auth/callback] exchangeCodeForSession error:', error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
  }

  // After session is established, redirect to the intended destination
  return NextResponse.redirect(`${origin}${next}`)
}
