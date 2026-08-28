import { createClient } from '@/lib/supabase/server'
import type { EventCategory } from '@/types/database'

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
