'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi } from '@/lib/api/auth'

const schema = z.object({ email: z.string().email('Invalid email') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  if (sent) {
    return (
      <div className="card w-full max-w-sm p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[rgba(200,231,107,0.1)] flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6 text-[var(--primary)]" />
        </div>
        <h1 className="text-serif text-xl">Check your email</h1>
        <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
          If an account with that email exists, we've sent a password reset link.
        </p>
        <Link href="/login" className="btn btn-outline btn-sm w-full">Back to sign in</Link>
      </div>
    )
  }

  return (
    <div className="card w-full max-w-sm p-8">
      <h1 className="text-serif text-2xl mb-1">Reset your password</h1>
      <p className="text-xs text-[var(--muted-foreground)] mb-7">Enter your email and we'll send you a reset link.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          id="email"
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className="text-center text-xs text-[var(--muted-foreground)] mt-6">
        <Link href="/login" className="text-[var(--primary)] hover:underline">Back to sign in</Link>
      </p>
    </div>
  )
}
