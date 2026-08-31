'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Global error boundary]', error)
  }, [error])

  // global-error replaces the root layout, so we must include <html> and <body>
  return (
    <html lang="en" className="dark">
      <body style={{ margin: 0, background: '#0d0d0d', color: '#f5f5f5', fontFamily: 'sans-serif' }}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: 24,
          textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(239,68,68,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 8px' }}>
              Eventify Ethiopia
            </h1>
            <p style={{ fontSize: 14, color: '#888', margin: '0 0 4px' }}>
              A critical error occurred. Please try again.
            </p>
            {error?.digest && (
              <p style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>
                Error ID: {error.digest}
              </p>
            )}
          </div>

          <button
            onClick={reset}
            style={{
              padding: '10px 24px',
              background: '#d7f36a',
              color: '#1a1a1a',
              fontWeight: 700,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
