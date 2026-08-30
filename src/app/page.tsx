// Root redirect — public homepage lives at (public)/page.tsx
// This file redirects to keep Next.js happy with the route group setup
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/home')
}
