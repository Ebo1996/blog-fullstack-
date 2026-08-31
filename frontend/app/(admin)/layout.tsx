'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, CalendarDays, CreditCard,
  Tag, BarChart3, Settings, ShieldAlert, Menu, X, MoreHorizontal,
  FileText, Building2,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { getInitials } from '@/lib/utils'

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/organizers', label: 'Organizers', icon: Building2 },
  { href: '/admin/events', label: 'Events', icon: CalendarDays },
  { href: '/admin/orders', label: 'Orders', icon: CreditCard },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/login?redirect=/admin')
      else if (user.role !== 'admin') router.push('/dashboard')
    }
  }, [isLoading, user, router])

  if (isLoading || !user || user.role !== 'admin') return null

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'flex' : 'hidden md:flex'}`}>
        <div className="brand">
          <span className="brand-mark" style={{ background: '#ef4444' }}>A</span>
          <span>admin</span>
        </div>
        <span className="workspace-label">PLATFORM ADMIN</span>
        <nav className="side-nav" aria-label="Admin navigation">
          {nav.map((item) => (
            <NavItem key={item.href} {...item} onNavigate={() => setMobileOpen(false)} />
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-row">
            <span className="avatar w-8 h-8 text-xs">{getInitials(user.name)}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{user.name}</p>
              <p className="text-xs" style={{ color: '#ef4444' }}>Admin</p>
            </div>
            <MoreHorizontal className="w-4 h-4 text-[var(--muted-foreground)]" />
          </div>
        </div>
      </aside>

      <div className="main-content">
        <div className="flex items-center justify-between p-4 md:hidden border-b border-[var(--border)]">
          <span className="font-bold text-base">Admin Panel</span>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="icon-btn">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function NavItem({ href, label, icon: Icon, onNavigate }: { href: string; label: string; icon: any; onNavigate: () => void }) {
  const pathname = usePathname()
  const isActive = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
  return (
    <Link href={href} className={`nav-item ${isActive ? 'nav-item-active' : ''}`} onClick={onNavigate}>
      <Icon />
      {label}
    </Link>
  )
}
