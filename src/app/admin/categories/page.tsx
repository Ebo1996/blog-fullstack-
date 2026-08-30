import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/header'
import { CategoriesClient } from '@/components/admin/categories-client'
import { getAllCategories } from '@/services/categories'
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from '../actions'
import type { Profile } from '@/types/database'
import type { AdminActionResult } from '../actions'

export const metadata: Metadata = { title: 'Admin — Categories' }

// Force dynamic rendering to ensure cookies() is called in request context
export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const categories = await getAllCategories()

  // Bind server actions
  const boundCreate = async (
    prev: AdminActionResult,
    fd: FormData,
  ): Promise<AdminActionResult> => {
    'use server'
    return createCategoryAction(prev, fd)
  }

  const boundUpdate = async (
    id: string,
    prev: AdminActionResult,
    fd: FormData,
  ): Promise<AdminActionResult> => {
    'use server'
    return updateCategoryAction(id, prev, fd)
  }

  const boundDelete = async (id: string): Promise<AdminActionResult> => {
    'use server'
    return deleteCategoryAction(id)
  }

  return (
    <>
      <AdminHeader title="Categories" eyebrow="EVENT CATEGORIES" profile={profile} />

      <main className="content" style={{ maxWidth: 800 }}>
        <div className="page-intro" style={{ marginBottom: 24 }}>
          <p>
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}.
            Categories appear in event creation, discovery filters, and public pages.
          </p>
        </div>

        <CategoriesClient
          categories={categories}
          createAction={boundCreate}
          updateAction={boundUpdate}
          deleteAction={boundDelete}
        />
      </main>
    </>
  )
}
