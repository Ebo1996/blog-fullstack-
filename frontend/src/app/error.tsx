'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Report to Sentry in production
    Sentry.captureException(error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--background)',
        color: 'var(--foreground)',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div>
        <p
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase',
            marginBottom: 16,
          }}
        >
          Error
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(24px, 3vw, 40px)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
          }}
        >
          Something went wrong
        </h1>
        <p style={{ color: 'var(--muted-foreground)', fontSize: 14, marginBottom: 28 }}>
          An unexpected error occurred. Please try again.
        </p>
        <button className="button button-primary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  )
}
