import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from '@/components/attendee/header'
import {
  AvatarUpload,
  ProfileNameForm,
  EmailForm,
  PasswordForm,
  NotificationToggles,
  SignOutButton,
  PrivacyRow,
} from '@/components/attendee/settings-client'
import {
  updateProfileAction,
  updateEmailAction,
  changePasswordAction,
  updateAvatarAction,
  signOutAction,
} from './actions'
import { getUnreadNotificationCount } from '@/services/attendee'
import type { Profile } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()

  const unreadCount = await getUnreadNotificationCount(user.id)

  return (
    <>
      <DashboardHeader
        title="Settings"
        eyebrow="ACCOUNT"
        profile={profile}
        unreadCount={unreadCount}
      />

      <main className="content">
        <div className="page-intro">
          <p>Manage your account and notification preferences.</p>
        </div>

        {/* ── Profile section ──────────────────────────────────── */}
        <section aria-labelledby="profile-heading" className="settings-panel">
          <div className="setting-row" style={{ paddingTop: 0 }}>
            <h2
              id="profile-heading"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 18,
                fontWeight: 400,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Profile
            </h2>
          </div>

          {/* Avatar */}
          <div className="setting-row">
            <div style={{ flex: 1 }}>
              <strong>Photo</strong>
              <span>Used on your tickets and account.</span>
            </div>
            {profile && (
              <AvatarUpload
                profile={profile}
                updateAvatarAction={updateAvatarAction}
              />
            )}
          </div>

          {/* Name */}
          {profile && (
            <ProfileNameForm
              profile={profile}
              updateProfileAction={updateProfileAction}
            />
          )}

          {/* Email */}
          <EmailForm
            currentEmail={user.email ?? ''}
            updateEmailAction={updateEmailAction}
          />

          {/* Password */}
          <PasswordForm changePasswordAction={changePasswordAction} />

          {/* Privacy */}
          <PrivacyRow />
        </section>

        {/* ── Notifications section ────────────────────────────── */}
        <section
          aria-labelledby="notifications-heading"
          className="settings-panel"
          style={{ marginTop: 24 }}
        >
          <div className="setting-row" style={{ paddingTop: 0 }}>
            <h2
              id="notifications-heading"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 18,
                fontWeight: 400,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Notifications
            </h2>
          </div>

          <NotificationToggles />
        </section>

        {/* ── Account section ──────────────────────────────────── */}
        <section
          aria-labelledby="account-heading"
          className="settings-panel"
          style={{ marginTop: 24 }}
        >
          <div className="setting-row" style={{ paddingTop: 0 }}>
            <h2
              id="account-heading"
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 18,
                fontWeight: 400,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Account
            </h2>
          </div>

          <div className="setting-row">
            <div>
              <strong>Role</strong>
              <span>
                {profile?.role === 'attendee'
                  ? 'Attendee — you can purchase tickets and RSVP to events.'
                  : profile?.role === 'organizer'
                    ? 'Organizer — you can create and manage events.'
                    : 'Administrator'}
              </span>
            </div>
            <span
              className="badge badge-neutral"
              style={{ textTransform: 'capitalize', fontSize: 11 }}
            >
              {profile?.role ?? 'attendee'}
            </span>
          </div>

          <div className="setting-row">
            <div>
              <strong>Member since</strong>
              <span>
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
          </div>

          <SignOutButton signOutAction={signOutAction} />
        </section>
      </main>
    </>
  )
}
