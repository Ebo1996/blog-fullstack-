'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Ticket, CreditCard, CalendarDays,
  Users, Bell, Settings, MoreHorizontal, Menu, X, User,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getInitials } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/tickets', label: 'My tickets', icon: Ticket, badge: true },
  { href: '/dashboard/orders', label: 'Orders', icon: CreditCard },
  { href: '/dashboard/rsvps', label: 'RSVPs', icon: CalendarDays },
  { href: '/dashboard/transfers', label: 'Transfers', icon: Users },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) router.push('/login?redirect=/dashboard')
  }, [isLoading, user, router])

  if (isLoading || !user) return null

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'flex' : 'hidden md:flex'}`}>
        <div className="brand">
          <span className="brand-mark">E</span>
          <span>eventify</span>
        </div>
        <span className="workspace-label">PERSONAL SPACE</span>
        <nav className="side-nav" aria-label="Dashboard navigation">
          {nav.map((item) => (
            <NavItem key={item.href} {...item} onNavigate={() => setMobileOpen(false)} />
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-nav">
            <Link href="/dashboard/settings" className="nav-item" onClick={() => setMobileOpen(false)}>
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
          <div className="profile-row">
            {user.image ? (
              <img 
                src={user.image} 
                alt={user.name} 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="avatar w-8 h-8 text-xs">{getInitials(user.name)}</span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">{user.name}</p>
              <p className="text-xs text-[var(--muted-foreground)] truncate">{user.email}</p>
            </div>
            <MoreHorizontal className="w-4 h-4 text-[var(--muted-foreground)] flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 md:hidden border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5 font-bold text-base">
            <span className="brand-mark text-sm">E</span>
            <span>eventify</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="icon-btn"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function NavItem({
  href, label, icon: Icon, badge, onNavigate,
}: { href: string; label: string; icon: any; badge?: boolean; onNavigate: () => void }) {
  const pathname = usePathname()
  const isActive = href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon />
      {label}
    </Link>
  )
}
