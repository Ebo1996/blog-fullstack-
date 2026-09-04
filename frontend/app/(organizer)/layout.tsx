'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, CalendarDays, Plus, CreditCard,
  Users, QrCode, BarChart3, Bell, Settings, Menu, X, MoreHorizontal,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { getInitials } from '@/lib/utils'

const nav = [
  { href: '/organizer', label: 'Overview', icon: LayoutDashboard },
  { href: '/organizer/events', label: 'Events', icon: CalendarDays },
  { href: '/organizer/events/new', label: 'Create event', icon: Plus },
  { href: '/organizer/orders', label: 'Orders', icon: CreditCard },
  { href: '/organizer/attendees', label: 'Attendees', icon: Users },
  { href: '/organizer/check-in', label: 'Check-in', icon: QrCode },
  { href: '/organizer/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/organizer/notifications', label: 'Notifications', icon: Bell },
  { href: '/organizer/settings', label: 'Settings', icon: Settings },
]

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/login?redirect=/organizer')
      else if (user.role === 'attendee') router.push('/dashboard')
    }
  }, [isLoading, user, router])

  if (isLoading || !user || user.role === 'attendee') return null

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'flex' : 'hidden md:flex'}`}>
        <div className="brand">
          <span className="brand-mark">E</span>
          <span>eventify</span>
        </div>
        <span className="workspace-label">ORGANIZER</span>
        <nav className="side-nav" aria-label="Organizer navigation">
          {nav.map((item) => (
            <NavItem key={item.href} {...item} onNavigate={() => setMobileOpen(false)} />
          ))}
        </nav>
        <div className="sidebar-bottom">
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
            <MoreHorizontal className="w-4 h-4 text-[var(--muted-foreground)]" />
          </div>
        </div>
      </aside>

      <div className="main-content">
        <div className="flex items-center justify-between p-4 md:hidden border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5 font-bold text-base">
            <span className="brand-mark text-sm">E</span>
            <span>organizer</span>
          </div>
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
  const isActive = href === '/organizer' ? pathname === '/organizer' : pathname.startsWith(href)
  return (
    <Link
      href={href}
      className={`nav-item ${isActive ? 'nav-item-active' : ''} ${label === 'Create event' ? 'text-[var(--primary)]' : ''}`}
      onClick={onNavigate}
    >
      <Icon />
      {label}
    </Link>
  )
}
