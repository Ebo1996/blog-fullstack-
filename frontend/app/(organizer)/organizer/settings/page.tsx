'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { authApi } from '@/lib/api/auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'

const profileSchema = z.object({
  name: z.string().min(2),
  bio: z.string().max(500).optional(),
  phoneNumber: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match", path: ['confirmPassword'],
})

type ProfileData = z.infer<typeof profileSchema>
type PasswordData = z.infer<typeof passwordSchema>

export default function OrganizerSettingsPage() {
  const { user, setUser } = useAuth()
  const [tab, setTab] = useState<'profile' | 'password'>('profile')

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', bio: user?.bio ?? '', phoneNumber: user?.phoneNumber ?? '' },
  })

  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

  const onProfileSubmit = async (data: ProfileData) => {
    try {
      const res = await authApi.updateMe(data)
      setUser(res.data)
      toast.success('Profile updated')
    } catch (err: any) { toast.error(err?.message ?? 'Update failed') }
  }

  const onPasswordSubmit = async (data: PasswordData) => {
    try {
      await authApi.updateMe({ currentPassword: data.currentPassword, newPassword: data.newPassword } as any)
      passwordForm.reset()
      toast.success('Password changed')
    } catch (err: any) { toast.error(err?.message ?? 'Failed to change password') }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ORGANIZER</div>
          <h1>Settings</h1>
        </div>
      </header>

      <div className="page-content max-w-2xl">
        {/* Profile card */}
        <div className="panel flex items-center gap-4 mb-8">
          <span className="avatar flex items-center justify-center text-base font-bold"
            style={{ width: 52, height: 52, fontSize: 18 }}>
            {getInitials(user?.name ?? '')}
          </span>
          <div>
            <p className="font-semibold text-sm">{user?.name}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{user?.email}</p>
            <p className="text-xs" style={{ color: 'var(--primary)' }}>Organizer</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-[var(--border)]">
          {(['profile', 'password'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 px-1 text-xs font-semibold border-b-2 transition-colors capitalize mr-4 ${tab === t ? 'border-[var(--primary)] text-[var(--foreground)]' : 'border-transparent text-[var(--muted-foreground)]'}`}>
              {t === 'profile' ? 'Profile' : 'Password'}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5 animate-fade-in">
            <Input label="Name *" error={profileForm.formState.errors.name?.message} {...profileForm.register('name')} />
            <Input label="Phone number" placeholder="+251 9XX XXX XXX" {...profileForm.register('phoneNumber')} />
            <Textarea label="Organizer bio" placeholder="Describe yourself or your organization…" rows={4} {...profileForm.register('bio')} />
            <div className="input-group">
              <label className="input-label">Email</label>
              <div className="input-field opacity-60">{user?.email}</div>
            </div>
            <Button type="submit" loading={profileForm.formState.isSubmitting}>Save profile</Button>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5 animate-fade-in">
            <Input label="Current password" type="password" error={passwordForm.formState.errors.currentPassword?.message} {...passwordForm.register('currentPassword')} />
            <Input label="New password" type="password" error={passwordForm.formState.errors.newPassword?.message} {...passwordForm.register('newPassword')} />
            <Input label="Confirm new password" type="password" error={passwordForm.formState.errors.confirmPassword?.message} {...passwordForm.register('confirmPassword')} />
            <Button type="submit" loading={passwordForm.formState.isSubmitting}>Change password</Button>
          </form>
        )}
      </div>
    </>
  )
}
