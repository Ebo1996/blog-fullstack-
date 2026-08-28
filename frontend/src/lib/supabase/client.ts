'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Browser client — safe to use in Client Components and hooks.
// Created once per page load via singleton pattern.
let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (_client) return _client

  _client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return _client
}
