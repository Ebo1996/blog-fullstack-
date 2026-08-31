/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove X-Powered-By: Next.js header
  poweredByHeader: false,

  images: {
    remotePatterns: [
      // Only production image sources — no placeholder domains
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },

  experimental: { typedRoutes: false },

  // Security headers applied to every response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
    ]
  },
}

export default nextConfig
