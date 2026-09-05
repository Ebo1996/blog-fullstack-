'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api/auth'
import { setAccessToken } from '@/lib/api/client'
import { useAuth } from '@/lib/auth-context'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  role: z.enum(['attendee', 'organizer']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
type FormData = z.infer<typeof schema>

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { refresh } = useAuth()
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  const defaultRole = (params.get('role') as 'attendee' | 'organizer') ?? 'attendee'

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: defaultRole } })

  const role = watch('role')

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.register(data)
      const { accessToken, refreshToken } = res.data
      setAccessToken(accessToken)
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      await refresh()
      toast.success('Account created! Welcome to Eventify.')
      router.push(data.role === 'organizer' ? '/organizer' : '/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Registration failed. Please try again.'
      toast.error(Array.isArray(msg) ? msg.join('. ') : msg)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await authApi.googleAuth(credentialResponse.credential, role)
      const { accessToken, refreshToken } = res.data
      setAccessToken(accessToken)
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      await refresh()
      toast.success('Welcome to Eventify!')
      router.push(role === 'organizer' ? '/organizer' : '/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Google sign-in failed'
      toast.error(msg)
    }
  }

  const handleGoogleError = () => {
    toast.error('Google sign-in was cancelled')
  }

  return (
    <div className="card w-full max-w-sm p-8">
      <h1 className="text-serif text-2xl mb-1">Create your account</h1>
      <p className="text-xs text-[var(--muted-foreground)] mb-7">Join thousands of event-goers in Ethiopia</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="input-group">
          <span className="input-label">I want to</span>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {(['attendee', 'organizer'] as const).map((r) => (
              <label
                key={r}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-[var(--radius-sm)] border text-xs font-semibold cursor-pointer transition-colors ${
                  role === r
                    ? 'border-[var(--primary)] bg-[rgba(215,243,106,0.08)] text-[var(--primary)]'
                    : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)]'
                }`}
              >
                <input type="radio" value={r} className="sr-only" {...register('role')} />
                {r === 'attendee' ? '🎟 Attend events' : '🎤 Organize events'}
              </label>
            ))}
          </div>
        </div>

        <Input id="name" label="Full name" placeholder="Abebe Bekele" autoComplete="name"
          error={errors.name?.message} {...register('name')} />

        <Input id="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email"
          error={errors.email?.message} {...register('email')} />

        <div className="input-group">
          <label htmlFor="password" className="input-label">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="Min. 8 characters"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              aria-label={showPass ? 'Hide password' : 'Show password'}
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="input-error">{errors.password.message}</p>}
        </div>

        <div className="input-group">
          <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPass ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              placeholder="Re-enter your password"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]"
              aria-label={showConfirmPass ? 'Hide password' : 'Show password'}
            >
              {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="input-error">{errors.confirmPassword.message}</p>}
        </div>

        <Button type="submit" className="w-full" loading={isSubmitting}>Create account</Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[var(--background)] px-2 text-[var(--muted-foreground)]">Or continue with</span>
        </div>
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap
          text="continue_with"
          shape="rectangular"
          theme="outline"
          size="large"
        />
      </div>

      <p className="text-center text-xs text-[var(--muted-foreground)] mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[var(--primary)] hover:underline">Sign in</Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <Suspense fallback={<div className="card w-full max-w-sm p-8 h-64" />}>
        <RegisterForm />
      </Suspense>
    </GoogleOAuthProvider>
  )
}
