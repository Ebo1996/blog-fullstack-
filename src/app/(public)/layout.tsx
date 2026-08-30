import { SiteNav } from '@/components/public/site-nav'
import { SiteFooter } from '@/components/public/site-footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
      <SiteFooter />
    </>
  )
}
