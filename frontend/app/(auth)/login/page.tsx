'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { login } = useAuth()
  const [showPass, setShowPass] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      const redirect = params.get('redirect') ?? '/dashboard'
      router.push(redirect)
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Invalid email or password'
      toast.error(msg)
    }
  }

  return (
    <div className="card w-full max-w-sm p-8">
      <h1 className="text-serif text-2xl mb-1">Welcome back</h1>
      <p className="text-xs text-[var(--muted-foreground)] mb-7">Sign in to your Eventify account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="input-group">
          <label htmlFor="password" className="input-label">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="••••••••"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="input-error">{errors.password.message}</p>}
        </div>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs text-[var(--primary)] hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>

      <p className="text-center text-xs text-[var(--muted-foreground)] mt-6">
        Don't have an account?{' '}
        <Link href="/register" className="text-[var(--primary)] hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
