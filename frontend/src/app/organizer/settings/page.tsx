import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OrganizerHeader } from '@/components/organizer/header'
import { formatDate } from '@/lib/utils/format'
import type { Profile } from '@/types/database'

export const metadata: Metadata = { title: 'Organizer Settings' }

export default async function OrganizerSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role === 'attendee') redirect('/dashboard')

  return (
    <>
      <OrganizerHeader title="Settings" eyebrow="ACCOUNT" profile={profile} />

      <main className="content" style={{ maxWidth: 680 }}>
        <div className="page-intro">
          <p>Manage your organizer account and preferences.</p>
        </div>

        <div className="settings-panel">
          <div className="setting-row" style={{ paddingTop: 0 }}>
            <div>
              <strong>Display name</strong>
              <span>{profile.full_name ?? '—'}</span>
            </div>
            <Link href="/dashboard/settings" className="button button-outline button-sm">
              Edit in account settings
            </Link>
          </div>
          <div className="setting-row">
            <div>
              <strong>Role</strong>
              <span style={{ textTransform: 'capitalize' }}>{profile.role}</span>
            </div>
          </div>
          <div className="setting-row">
            <div>
              <strong>Member since</strong>
              <span>
                {profile.created_at
                  ? formatDate(profile.created_at, 'MMMM d, yyyy')
                  : '—'}
              </span>
            </div>
          </div>
          <div className="setting-row" style={{ paddingBottom: 0 }}>
            <div>
              <strong>Stripe payments</strong>
              <span>Payments are processed via Stripe. Configure in your Stripe dashboard.</span>
            </div>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="button button-outline button-sm"
            >
              Stripe dashboard
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
