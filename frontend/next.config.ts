import * as Sentry from '@sentry/nextjs'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers
  async headers() {
    const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : '*.supabase.co'

    const csp = [
      "default-src 'self'",
      // Scripts: self + Next.js inline scripts (nonce-less approach uses unsafe-inline for RSC)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: self + inline (Tailwind CSS-in-JS / style attributes)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + Supabase Storage CDN + data URIs
      `img-src 'self' data: blob: https://${supabaseHost} https://*.supabase.co`,
      // Fonts: self
      "font-src 'self'",
      // Connections: self + Supabase + Chapa API
      `connect-src 'self' https://${supabaseHost} https://*.supabase.co https://api.chapa.co wss://${supabaseHost}`,
      // Frames: Chapa hosted checkout page
      "frame-src 'self' https://checkout.chapa.co",
      // Form actions: self only
      "form-action 'self'",
      // Base URI: self only
      "base-uri 'self'",
      // Block mixed content
      "upgrade-insecure-requests",
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },

  // Compiler options for optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Production optimizations
  poweredByHeader: false,
  compress: true,
}

export default Sentry.withSentryConfig(nextConfig, {
  // Sentry organization and project (from your DSN)
  org: 'o4511999580831744',
  project: 'eventify-ethiopia',

  // Suppresses Sentry CLI output during build
  silent: !process.env.CI,

  // Upload source maps to Sentry for readable stack traces
  widenClientFileUpload: true,

  // Automatically tree-shake Sentry logger statements (reduces bundle size)
  disableLogger: true,

  // Delete source maps after upload so they aren't served to users
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Hides Sentry from client bundle size stats
  hideSourceMaps: true,

  // Auto-instrument Vercel cron jobs
  automaticVercelMonitors: true,
})
