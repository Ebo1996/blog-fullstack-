import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 10% of transactions for performance monitoring (free plan friendly)
  tracesSampleRate: 0.1,

  // Capture 100% of errors
  // Adjust in production if volume is high
  sampleRate: 1.0,

  // Only enable in production — avoids noise during development
  enabled: process.env.NODE_ENV === 'production',

  // Strip sensitive data before sending
  beforeSend(event) {
    // Remove any auth tokens or keys that might appear in breadcrumbs
    if (event.request?.headers) {
      delete event.request.headers['authorization']
      delete event.request.headers['cookie']
    }
    return event
  },

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media in session replays (privacy)
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Capture 10% of sessions for replay (free plan: 50 replays/month)
  replaysSessionSampleRate: 0.1,
  // Capture 100% of sessions where an error occurred
  replaysOnErrorSampleRate: 1.0,
})
