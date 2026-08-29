'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  setUserSuspended,
  setUserRole,
  adminSetEventStatus,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  dismissReport,
} from '@/services/admin'
import type { UserRole, EventStatus } from '@/types/database'

export interface AdminActionResult {
  error?: string
  success?: boolean
}

// ─── Auth guard ───────────────────────────────────────────────────────────────
async function requireAdmin(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: p } = await supabase
    .from('profiles').select('role').eq('id', user.id)
    .single<{ role: string }>()
  return p?.role === 'admin' ? user.id : null
}

// ─── USER ACTIONS ─────────────────────────────────────────────────────────────

export async function suspendUserAction(userId: string): Promise<AdminActionResult> {
  if (!await requireAdmin()) return { error: 'Unauthorized' }
  const ok = await setUserSuspended(userId, true)
  if (!ok) return { error: 'Could not suspend user.' }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function reactivateUserAction(userId: string): Promise<AdminActionResult> {
  if (!await requireAdmin()) return { error: 'Unauthorized' }
  const ok = await setUserSuspended(userId, false)
  if (!ok) return { error: 'Could not reactivate user.' }
  revalidatePath('/admin/users')
  return { success: true }
}

export async function changeUserRoleAction(
  userId: string,
  newRole: UserRole,
): Promise<AdminActionResult> {
  if (!await requireAdmin()) return { error: 'Unauthorized' }
  const ok = await setUserRole(userId, newRole)
  if (!ok) return { error: 'Could not change user role.' }
  revalidatePath('/admin/users')
  return { success: true }
}

// ─── EVENT ACTIONS ────────────────────────────────────────────────────────────

export async function adminSetEventStatusAction(
  eventId: string,
  status: EventStatus,
): Promise<AdminActionResult> {
  if (!await requireAdmin()) return { error: 'Unauthorized' }
  const ok = await adminSetEventStatus(eventId, status)
  if (!ok) return { error: `Could not set event status to ${status}.` }
  revalidatePath('/admin/events')
  return { success: true }
}

// ─── CATEGORY ACTIONS ─────────────────────────────────────────────────────────

export async function createCategoryAction(
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  if (!await requireAdmin()) return { error: 'Unauthorized' }

  const name = (formData.get('name') as string | null)?.trim()
  const desc = (formData.get('description') as string | null)?.trim() || null

  if (!name || name.length < 2) return { error: 'Name must be at least 2 characters.' }

  const slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')

  const result = await adminCreateCategory({ name, slug, description: desc })
  if (!result) return { error: 'Could not create category. The name or slug may already exist.' }

  revalidatePath('/admin/categories')
  revalidatePath('/events')
  return { success: true }
}

export async function updateCategoryAction(
  id: string,
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  if (!await requireAdmin()) return { error: 'Unauthorized' }

  const name = (formData.get('name') as string | null)?.trim()
  const desc = (formData.get('description') as string | null)?.trim() || null

  if (!name || name.length < 2) return { error: 'Name must be at least 2 characters.' }

  const ok = await adminUpdateCategory(id, { name, description: desc })
  if (!ok) return { error: 'Could not update category.' }

  revalidatePath('/admin/categories')
  revalidatePath('/events')
  return { success: true }
}

export async function deleteCategoryAction(id: string): Promise<AdminActionResult> {
  if (!await requireAdmin()) return { error: 'Unauthorized' }
  const result = await adminDeleteCategory(id)
  if (!result.success) return { error: result.error }
  revalidatePath('/admin/categories')
  return { success: true }
}

// ─── REPORT ACTIONS ───────────────────────────────────────────────────────────

export async function dismissReportAction(reportId: string): Promise<AdminActionResult> {
  if (!await requireAdmin()) return { error: 'Unauthorized' }
  const ok = await dismissReport(reportId)
  if (!ok) return { error: 'Could not dismiss report.' }
  revalidatePath('/admin/reports')
  return { success: true }
}
