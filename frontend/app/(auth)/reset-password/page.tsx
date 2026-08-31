'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api/auth'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: "Passwords don't match",
  path: ['confirm'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token') ?? ''
  const [done, setDone] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) { toast.error('Invalid reset link'); return }
    try {
      await authApi.resetPassword(token, data.password)
      setDone(true)
    } catch (err: any) {
      toast.error(err?.message ?? 'Reset failed. The link may have expired.')
    }
  }

  if (!token) {
    return (
      <div className="card w-full max-w-sm p-8 text-center space-y-4">
        <p className="text-sm text-[var(--destructive)]">Invalid or missing reset token.</p>
        <Link href="/forgot-password" className="btn btn-primary btn-sm w-full">Request new link</Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="card w-full max-w-sm p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[rgba(200,231,107,0.1)] flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6 text-[var(--primary)]" />
        </div>
        <h1 className="text-serif text-xl">Password updated!</h1>
        <p className="text-xs text-[var(--muted-foreground)]">You can now sign in with your new password.</p>
        <Link href="/login" className="btn btn-primary btn-sm w-full">Sign in</Link>
      </div>
    )
  }

  return (
    <div className="card w-full max-w-sm p-8">
      <h1 className="text-serif text-2xl mb-1">Set new password</h1>
      <p className="text-xs text-[var(--muted-foreground)] mb-7">Choose a strong password for your account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="input-group">
          <label htmlFor="password" className="input-label">New password</label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="Min. 8 characters"
              {...register('password')}
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              aria-label={showPass ? 'Hide' : 'Show'}>
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="input-error">{errors.password.message}</p>}
        </div>

        <Input
          id="confirm"
          label="Confirm password"
          type="password"
          placeholder="Repeat your password"
          error={errors.confirm?.message}
          {...register('confirm')}
        />

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </div>
  )
}
