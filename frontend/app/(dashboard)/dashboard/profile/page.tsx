'use client'

import { useAuth } from '@/lib/auth-context'
import { authApi } from '@/lib/api/auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getInitials, formatDate } from '@/lib/utils'
import { Camera } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  bio: z.string().max(300).optional(),
  phoneNumber: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const { user, setUser } = useAuth()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user?.name ?? '',
      bio: user?.bio ?? '',
      phoneNumber: user?.phoneNumber ?? '',
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.updateMe(data)
      setUser(res.data)
      toast.success('Profile updated')
    } catch (err: any) {
      toast.error(err?.message ?? 'Update failed')
    }
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ACCOUNT</div>
          <h1>My profile</h1>
        </div>
      </header>

      <div className="page-content max-w-2xl">
        {/* Avatar */}
        <div className="panel flex items-center gap-5 mb-8">
          <div className="relative">
            <span className="avatar flex items-center justify-center text-base font-bold"
              style={{ width: 64, height: 64, fontSize: 22 }}>
              {getInitials(user?.name ?? '')}
            </span>
            <button
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center"
              aria-label="Change avatar"
              title="Avatar upload requires Cloudinary configuration"
            >
              <Camera className="w-3 h-3 text-[var(--primary-foreground)]" />
            </button>
          </div>
          <div>
            <p className="font-semibold text-sm">{user?.name}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5 capitalize">{user?.role}</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Member since {user?.createdAt ? formatDate(user.createdAt) : '—'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Full name"
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
          <Input
            label="Phone number"
            placeholder="+251 9XX XXX XXX"
            {...form.register('phoneNumber')}
          />
          <Textarea
            label="Bio"
            placeholder="Tell others a bit about yourself…"
            rows={4}
            {...form.register('bio')}
          />

          {/* Email — read-only */}
          <div className="input-group">
            <label className="input-label">Email address</label>
            <div className="input-field flex items-center opacity-60 cursor-not-allowed">
              <span className="text-sm">{user?.email}</span>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">Email address cannot be changed.</p>
          </div>

          <Button type="submit" loading={form.formState.isSubmitting}>
            Save changes
          </Button>
        </form>
      </div>
    </>
  )
}
