'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { authApi } from '@/lib/api/auth'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  bio: z.string().max(300).optional(),
  phoneNumber: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] })

type ProfileData = z.infer<typeof profileSchema>
type PasswordData = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { user, setUser } = useAuth()
  const [activeSection, setActiveSection] = useState<'profile' | 'password'>('profile')

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
    } catch (err: any) {
      toast.error(err?.message ?? 'Update failed')
    }
  }

  const onPasswordSubmit = async (data: PasswordData) => {
    try {
      await authApi.updateMe({ currentPassword: data.currentPassword, newPassword: data.newPassword } as any)
      passwordForm.reset()
      toast.success('Password changed successfully')
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to change password')
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ACCOUNT</div>
          <h1>Settings</h1>
        </div>
      </header>

      <div className="page-content max-w-2xl">
        {/* Tab nav */}
        <div className="flex gap-2 mb-8 border-b border-[var(--border)]">
          {(['profile', 'password'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`pb-3 text-xs font-semibold px-1 border-b-2 transition-colors capitalize ${activeSection === s ? 'border-[var(--primary)] text-[var(--foreground)]' : 'border-transparent text-[var(--muted-foreground)]'}`}
            >
              {s === 'profile' ? 'Personal info' : 'Password'}
            </button>
          ))}
        </div>

        {activeSection === 'profile' && (
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5 animate-fade-in">
            <div className="panel flex items-center gap-4 mb-4">
              <span className="avatar w-14 h-14 text-base" style={{ fontSize: 18 }}>
                {user?.name?.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <p className="font-semibold text-sm">{user?.name}</p>
                <p className="text-xs text-[var(--muted-foreground)] capitalize">{user?.role}</p>
              </div>
            </div>
            <Input
              label="Full name"
              error={profileForm.formState.errors.name?.message}
              {...profileForm.register('name')}
            />
            <Input
              label="Phone number"
              placeholder="+251 9XX XXX XXX"
              {...profileForm.register('phoneNumber')}
            />
            <Textarea
              label="Bio"
              placeholder="Tell others a bit about yourself…"
              rows={3}
              {...profileForm.register('bio')}
            />
            <div className="panel">
              <p className="text-xs text-[var(--muted-foreground)] mb-1">Email address</p>
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">Email cannot be changed.</p>
            </div>
            <Button type="submit" loading={profileForm.formState.isSubmitting}>Save changes</Button>
          </form>
        )}

        {activeSection === 'password' && (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5 animate-fade-in">
            <Input
              label="Current password"
              type="password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <Input
              label="New password"
              type="password"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <Input
              label="Confirm new password"
              type="password"
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword')}
            />
            <Button type="submit" loading={passwordForm.formState.isSubmitting}>Change password</Button>
          </form>
        )}
      </div>
    </>
  )
}
