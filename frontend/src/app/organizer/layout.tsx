import { requireOrganizerOrAdmin } from '@/lib/auth'

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  await requireOrganizerOrAdmin()
  return <>{children}</>
}
