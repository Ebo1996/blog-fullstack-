'use client'

import { useActionState, useState, useTransition, useRef } from 'react'
import { ChevronRight, Camera, Check, AlertCircle, LogOut, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Alert } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import type { SettingsActionResult } from '@/app/dashboard/settings/actions'

// ─── Toggle switch — exact prototype .toggle styles ───────────────────────────
function Toggle({
  id,
  checked,
  onChange,
  label,
}: {
  id: string
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <span />
    </button>
  )
}

// ─── Avatar upload ─────────────────────────────────────────────────────────────
export function AvatarUpload({
  profile,
  updateAvatarAction,
}: {
  profile: Profile
  updateAvatarAction: (url: string) => Promise<SettingsActionResult>
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(profile.avatar_url)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are supported.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not signed in.'); return }

      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadErr) { setError(uploadErr.message); return }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      // Show local preview immediately
      setPreview(publicUrl)

      // Persist to profile
      const result = await updateAvatarAction(publicUrl)
      if (result.error) setError(result.error)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* Avatar with camera overlay */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Avatar src={preview} name={profile.full_name} size="xl" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Change avatar"
          style={{
            position: 'absolute', bottom: -4, right: -4,
            display: 'grid', placeItems: 'center',
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--primary)', color: 'var(--primary-foreground)',
            border: '2px solid var(--background)',
            cursor: uploading ? 'wait' : 'pointer',
          }}
        >
          {uploading
            ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" />
            : <Camera size={12} aria-hidden="true" />
          }
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 2px' }}>
          {profile.full_name ?? 'Your name'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: 0 }}>
          Click the camera to change your photo.
          <br />Max 2 MB · JPEG, PNG or WebP
        </p>
        {error && (
          <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 4 }} role="alert">
            <AlertCircle size={11} style={{ display: 'inline', marginRight: 4 }} aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Profile name form ─────────────────────────────────────────────────────────
export function ProfileNameForm({
  profile,
  updateProfileAction,
}: {
  profile: Profile
  updateProfileAction: (
    prev: SettingsActionResult,
    formData: FormData,
  ) => Promise<SettingsActionResult>
}) {
  const [state, action, pending] = useActionState(updateProfileAction, {})

  return (
    <form action={action}>
      <div className="setting-row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>Full name</strong>
          <span>Displayed on your tickets and profile.</span>

          {state.success && (
            <p style={{ fontSize: 11, color: 'var(--success)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={11} aria-hidden="true" /> Name updated
            </p>
          )}
          {state.error && (
            <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 6 }} role="alert">
              {state.error}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <input
            name="full_name"
            type="text"
            defaultValue={profile.full_name ?? ''}
            className="form-input"
            style={{ width: 200 }}
            placeholder="Your full name"
            autoComplete="name"
            required
            aria-label="Full name"
          />
          <button
            type="submit"
            className="button button-outline"
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  )
}

// ─── Email form ────────────────────────────────────────────────────────────────
export function EmailForm({
  currentEmail,
  updateEmailAction,
}: {
  currentEmail: string
  updateEmailAction: (
    prev: SettingsActionResult,
    formData: FormData,
  ) => Promise<SettingsActionResult>
}) {
  const [state, action, pending] = useActionState(updateEmailAction, {})

  return (
    <form action={action}>
      <div className="setting-row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>Email address</strong>
          <span>
            {state.success
              ? 'Check your inbox — we sent a confirmation link.'
              : `Current: ${currentEmail}`}
          </span>
          {state.error && (
            <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 6 }} role="alert">
              {state.error}
            </p>
          )}
        </div>

        {!state.success && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <input
              name="email"
              type="email"
              className="form-input"
              style={{ width: 220 }}
              placeholder="new@email.com"
              autoComplete="email"
              aria-label="New email address"
            />
            <button
              type="submit"
              className="button button-outline"
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? 'Sending…' : 'Update'}
            </button>
          </div>
        )}
      </div>
    </form>
  )
}

// ─── Password form ─────────────────────────────────────────────────────────────
export function PasswordForm({
  changePasswordAction,
}: {
  changePasswordAction: (
    prev: SettingsActionResult,
    formData: FormData,
  ) => Promise<SettingsActionResult>
}) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(changePasswordAction, {})

  if (state.success) {
    return (
      <div className="setting-row">
        <div>
          <strong>Password</strong>
          <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: 11 }}>
            <Check size={11} aria-hidden="true" /> Password updated successfully
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>Password</strong>
          <span>Change your account password.</span>
        </div>
        <button
          type="button"
          className="button button-outline"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? 'Cancel' : 'Change password'}
        </button>
      </div>

      {open && (
        <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
          {state.error && (
            <Alert variant="error">{state.error}</Alert>
          )}
          <div className="form-group">
            <label className="form-label required" htmlFor="pwd-new">New password</label>
            <input
              id="pwd-new"
              name="password"
              type="password"
              className="form-input"
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />
            <p className="form-hint">Min 8 characters, one uppercase, one number</p>
          </div>
          <div className="form-group">
            <label className="form-label required" htmlFor="pwd-confirm">Confirm password</label>
            <input
              id="pwd-confirm"
              name="confirm"
              type="password"
              className="form-input"
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="button button-primary"
            style={{ alignSelf: 'flex-start' }}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Notification toggles ──────────────────────────────────────────────────────
export function NotificationToggles() {
  const [prefs, setPrefs] = useState({
    emailReminders:  true,
    eventUpdates:    true,
    transfers:       true,
    marketing:       false,
  })
  const [, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function toggle(key: keyof typeof prefs) {
    setPrefs((p) => {
      const next = { ...p, [key]: !p[key] }
      // Persist to localStorage as a lightweight preference store
      // (a real implementation would POST to an API/server action)
      startTransition(() => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('notif_prefs', JSON.stringify(next))
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        }
      })
      return next
    })
  }

  const items: { key: keyof typeof prefs; label: string; description: string }[] = [
    {
      key: 'emailReminders',
      label: 'Event reminders',
      description: 'Reminders 7 days, 1 day, and 1 hour before your event',
    },
    {
      key: 'eventUpdates',
      label: 'Event updates',
      description: 'When an event you\'re attending changes or is cancelled',
    },
    {
      key: 'transfers',
      label: 'Ticket transfers',
      description: 'When someone sends you a ticket or accepts your transfer',
    },
    {
      key: 'marketing',
      label: 'Recommendations',
      description: 'Personalised event suggestions based on your interests',
    },
  ]

  return (
    <>
      {saved && (
        <p
          style={{ fontSize: 11, color: 'var(--success)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}
          role="status"
          aria-live="polite"
        >
          <Check size={11} aria-hidden="true" /> Preferences saved
        </p>
      )}
      {items.map((item) => (
        <div key={item.key} className="setting-row">
          <div>
            <strong>{item.label}</strong>
            <span>{item.description}</span>
          </div>
          <Toggle
            id={`notif-${item.key}`}
            checked={prefs[item.key]}
            onChange={() => toggle(item.key)}
            label={`Toggle ${item.label}`}
          />
        </div>
      ))}
    </>
  )
}

// ─── Sign out button ────────────────────────────────────────────────────────────
export function SignOutButton({
  signOutAction,
}: {
  signOutAction: () => Promise<void>
}) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="setting-row">
      <div>
        <strong>Sign out</strong>
        <span>Sign out of your Northstar account on this device.</span>
      </div>
      <button
        type="button"
        className="button button-outline"
        style={{ display: 'flex', gap: 8, color: 'var(--error)', borderColor: 'var(--error-bg)' }}
        disabled={pending}
        aria-busy={pending}
        onClick={() =>
          startTransition(async () => {
            await signOutAction()
          })
        }
      >
        <LogOut size={14} aria-hidden="true" />
        {pending ? 'Signing out…' : 'Sign out'}
      </button>
    </div>
  )
}

// ─── Privacy row ────────────────────────────────────────────────────────────────
export function PrivacyRow() {
  return (
    <div className="setting-row">
      <div>
        <strong>Privacy & data</strong>
        <span>Manage your data, connected apps, and download your information.</span>
      </div>
      <ChevronRight size={16} style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
    </div>
  )
}
