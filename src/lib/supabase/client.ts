'use client'

import { createBrowserClient as supabaseCreateBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Browser client — safe to use in Client Components and hooks.
// Created once per page load via singleton pattern.
let _client: ReturnType<typeof supabaseCreateBrowserClient<Database>> | null = null

export function createClient() {
  if (_client) return _client

  _client = supabaseCreateBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return _client
}

// Re-export for direct use in components that need it
export { supabaseCreateBrowserClient as createBrowserClient }
