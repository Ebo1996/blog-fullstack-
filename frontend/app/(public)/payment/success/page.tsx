'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Loader2, XCircle } from 'lucide-react'
import { paymentsApi } from '@/lib/api/orders'

function PaymentSuccessContent() {
  const params = useSearchParams()
  const txRef = params.get('tx_ref')
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading')
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (!txRef) { setStatus('failed'); return }
    paymentsApi.verify(txRef)
      .then((res) => { setOrder(res.data?.order); setStatus('success') })
      .catch(() => setStatus('failed'))
  }, [txRef])

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-sm text-[var(--muted-foreground)]">Verifying your payment…</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-serif text-2xl">Payment failed</h1>
        <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
          We couldn't verify your payment. If you were charged, please contact support.
        </p>
        <div className="flex gap-3">
          <Link href="/events" className="btn btn-outline">Browse events</Link>
          <Link href="/dashboard/orders" className="btn btn-primary">My orders</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[rgba(200,231,107,0.1)] flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-[var(--primary)]" />
      </div>
      <h1 className="text-serif text-2xl">Payment confirmed!</h1>
      <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
        Your tickets have been issued and are ready in your dashboard.
      </p>
      {txRef && (
        <p className="text-xs text-[var(--muted-foreground)] font-mono">Ref: {txRef}</p>
      )}
      <div className="flex gap-3">
        <Link href="/dashboard/tickets" className="btn btn-primary">View my tickets</Link>
        <Link href="/events" className="btn btn-outline">Browse more events</Link>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-sm text-[var(--muted-foreground)]">Loading…</p>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}
