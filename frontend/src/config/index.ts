// ─────────────────────────────────────────────────────────────────────────────
// Application-wide configuration constants
// All secrets come from environment variables — never hardcode values here.
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  app: {
    name: 'Northstar',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    description: 'Discover events, buy tickets, and manage your event experience.',
  },

  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  },

  chapa: {
    // Secret key is server-only — accessed directly from env
    enabled: !!process.env.CHAPA_SECRET_KEY,
  },

  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },

  tickets: {
    // Maximum tickets per order per ticket type
    maxPerOrder: 10,
    // Transfer expiry window in hours
    transferExpiryHours: 72,
  },

  uploads: {
    maxEventImageSize: 5 * 1024 * 1024,   // 5 MB
    maxAvatarSize: 2 * 1024 * 1024,        // 2 MB
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  },

  fees: {
    // Platform fee as a percentage of subtotal (e.g. 0.03 = 3%)
    platformFeeRate: 0.03,
  },
} as const

export type AppConfig = typeof config
