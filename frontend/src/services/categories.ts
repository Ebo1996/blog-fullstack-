import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { EventCategory } from '@/types/database'

// Use service client for build-time operations (like generateStaticParams)
// This doesn't require cookies and bypasses RLS
export async function getAllCategoriesBuildTime(): Promise<EventCategory[]> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('event_categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('[categories] getAllCategoriesBuildTime:', error.message)
    return []
  }
  return data ?? []
}

export async function getAllCategories(): Promise<EventCategory[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('[categories] getAllCategories:', error.message)
    return []
  }
  return data ?? []
}

export async function getCategoryBySlug(slug: string): Promise<EventCategory | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('event_categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data
}
