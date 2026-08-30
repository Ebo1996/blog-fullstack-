import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'northstar — Your event companion',
  description: 'Keep every event, ticket, and RSVP in one calm place.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#11110f',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark bg-background"><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
