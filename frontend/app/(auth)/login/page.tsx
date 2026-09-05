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
import { useAuth } from '@/lib/auth-context'
import { authApi } from '@/lib/api/auth'
import { setAccessToken } from '@/lib/api/client'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { login, refresh } = useAuth()
  const [showPass, setShowPass] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    try {
      const user = await login(data.email, data.password)
      toast.success('Welcome back!')
      
      // Redirect based on role
      const redirect = params.get('redirect')
      if (redirect) {
        router.push(redirect)
      } else if (user.role === 'admin') {
        router.push('/admin')
      } else if (user.role === 'organizer') {
        router.push('/organizer')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Invalid email or password'
      toast.error(msg)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await authApi.googleAuth(credentialResponse.credential, 'attendee')
      const { accessToken, refreshToken, user } = res.data
      setAccessToken(accessToken)
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      await refresh()
      toast.success('Welcome back!')
      
      // Redirect based on role
      const redirect = params.get('redirect')
      if (redirect) {
        router.push(redirect)
      } else if (user.role === 'admin') {
        router.push('/admin')
      } else if (user.role === 'organizer') {
        router.push('/organizer')
      } else {
        router.push('/dashboard')
      }
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

        <Button type="submit" className="w-full" loading={isSubmitting}>Sign in</Button>
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
          text="signin_with"
          shape="rectangular"
          theme="outline"
          size="large"
        />
      </div>

      <p className="text-center text-xs text-[var(--muted-foreground)] mt-6">
        Don't have an account?{' '}
        <Link href="/register" className="text-[var(--primary)] hover:underline">Sign up</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <Suspense fallback={<div className="card w-full max-w-sm p-8 h-64" />}>
        <LoginForm />
      </Suspense>
    </GoogleOAuthProvider>
  )
}
