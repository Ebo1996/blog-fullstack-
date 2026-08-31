import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: { default: 'Eventify Ethiopia', template: '%s | Eventify Ethiopia' },
  description: "Ethiopia's premier event management and ticketing platform. Discover concerts, conferences, workshops, festivals and more.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    siteName: 'Eventify Ethiopia',
    images: [{ url: '/og-default.jpg' }],
  },
  twitter: { card: 'summary_large_image' },
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
