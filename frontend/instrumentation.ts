/**
 * Next.js Instrumentation Hook
 *
 * Runs once when the Next.js server starts.
 * Initializes Sentry and validates environment variables.
 *
 * Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

import * as Sentry from '@sentry/nextjs'

export async function register() {
  // Initialize Sentry for server-side (nodejs runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
    const { validateEnv } = await import('./src/lib/env')
    validateEnv()
  }

  // Initialize Sentry for edge runtime (middleware, edge API routes)
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
