'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            fontFamily: 'system-ui, sans-serif',
            background: '#0a0a0a',
            color: '#fff',
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
                color: '#888',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Error
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 400, margin: '0 0 12px' }}>
              Something went wrong
            </h1>
            <p style={{ color: '#888', fontSize: 14, marginBottom: 28 }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                background: '#fff',
                color: '#000',
                border: 'none',
                padding: '10px 24px',
                borderRadius: 6,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
