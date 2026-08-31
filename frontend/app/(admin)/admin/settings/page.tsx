'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { authApi } from '@/lib/api/auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/lib/utils'
import { ShieldAlert } from 'lucide-react'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match", path: ['confirmPassword'],
})

type PasswordData = z.infer<typeof passwordSchema>

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const form = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

  const onSubmit = async (data: PasswordData) => {
    try {
      await authApi.updateMe({ currentPassword: data.currentPassword, newPassword: data.newPassword } as any)
      form.reset()
      toast.success('Password changed')
    } catch (err: any) { toast.error(err?.message ?? 'Failed') }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ADMIN</div>
          <h1>Settings</h1>
        </div>
      </header>

      <div className="page-content max-w-xl">
        {/* Admin profile card */}
        <div className="panel flex items-center gap-4 mb-8">
          <span className="avatar flex items-center justify-center text-base font-bold"
            style={{ width: 52, height: 52, fontSize: 18, background: '#ef4444' }}>
            {getInitials(user?.name ?? '')}
          </span>
          <div>
            <p className="font-semibold text-sm">{user?.name}</p>
            <p className="text-xs text-[var(--muted-foreground)]">{user?.email}</p>
            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: '#ef4444' }}>
              <ShieldAlert className="w-3 h-3" /> Platform Administrator
            </p>
          </div>
        </div>

        {/* Change password */}
        <div className="panel">
          <h2 className="font-semibold text-sm mb-5">Change password</h2>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Current password" type="password" error={form.formState.errors.currentPassword?.message} {...form.register('currentPassword')} />
            <Input label="New password" type="password" error={form.formState.errors.newPassword?.message} {...form.register('newPassword')} />
            <Input label="Confirm new password" type="password" error={form.formState.errors.confirmPassword?.message} {...form.register('confirmPassword')} />
            <Button type="submit" loading={form.formState.isSubmitting}>Change password</Button>
          </form>
        </div>

        {/* Platform info */}
        <div className="panel mt-5">
          <h2 className="font-semibold text-sm mb-4">Platform information</h2>
          <div className="space-y-3 text-xs text-[var(--muted-foreground)]">
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span>API URL</span>
              <span className="font-mono">{process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span>Payment provider</span>
              <span>Chapa</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span>Database</span>
              <span>MongoDB Atlas</span>
            </div>
            <div className="flex justify-between py-2">
              <span>API docs</span>
              <a href="http://localhost:3001/api/docs" target="_blank" rel="noreferrer"
                className="text-[var(--primary)] hover:underline">
                /api/docs ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
