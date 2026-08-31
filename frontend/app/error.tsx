'use client'

import { useEffect } from 'react'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error monitoring (e.g. Sentry) here when integrated
    console.error('[Error boundary]', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-400" />
      </div>

      <div className="space-y-2">
        <h1 className="text-serif text-2xl">Something went wrong</h1>
        <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
          An unexpected error occurred. Our team has been notified.
        </p>
        {error?.digest && (
          <p className="text-xs text-[var(--muted-foreground)] font-mono mt-1">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="btn btn-primary btn-sm gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Try again
        </button>
        <Link href="/" className="btn btn-outline btn-sm gap-2">
          <Home className="w-3.5 h-3.5" /> Go home
        </Link>
      </div>
    </div>
  )
}
