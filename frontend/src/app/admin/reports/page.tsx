import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/header'
import { ReportsClient } from '@/components/admin/reports-client'
import { getAdminReports } from '@/services/admin'
import { dismissReportAction } from '../actions'
import type { Profile } from '@/types/database'
import type { AdminActionResult } from '../actions'

export const metadata: Metadata = { title: 'Admin — Reports' }

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  // Fetch all reports (pending first)
  const [pending, all] = await Promise.all([
    getAdminReports('pending'),
    getAdminReports(),
  ])

  const boundDismiss = async (id: string): Promise<AdminActionResult> => {
    'use server'
    return dismissReportAction(id)
  }

  return (
    <>
      <AdminHeader
        title="Reports"
        eyebrow="CONTENT MODERATION"
        profile={profile}
      />

      <main className="content">
        <div className="page-intro" style={{ marginBottom: 20 }}>
          <p>
            {pending.length > 0
              ? `${pending.length} pending report${pending.length !== 1 ? 's' : ''} need review.`
              : 'No pending reports. Platform is clean.'}
          </p>
        </div>

        <ReportsClient
          reports={all}
          dismissAction={boundDismiss}
        />
      </main>
    </>
  )
}
