import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Service-role client — bypasses RLS.
// ONLY for trusted server-side operations: webhooks, admin actions, ticket creation after payment.
// NEVER import this in Client Components or expose to the browser.

if (typeof window !== 'undefined') {
  throw new Error(
    '[service.ts] This module must only be used server-side. ' +
      'Never import it in Client Components.',
  )
}

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.',
    )
  }

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
