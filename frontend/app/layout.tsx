import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: { default: 'Eventify Ethiopia', template: '%s | Eventify Ethiopia' },
  description: "Ethiopia's premier event management and ticketing platform. Discover concerts, conferences, workshops, festivals and more.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://eventify.et'),
  openGraph: {
    type: 'website',
    siteName: 'Eventify Ethiopia',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Eventify Ethiopia' }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)',  color: '#0d0d0d' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--foreground)' },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
