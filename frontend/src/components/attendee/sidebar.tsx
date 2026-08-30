'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Ticket,
  CreditCard,
  CalendarDays,
  Users,
  Settings,
  MoreHorizontal,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { Profile } from '@/types/database'

const nav = [
  { href: '/dashboard',           label: 'Overview',   icon: LayoutDashboard },
  { href: '/dashboard/tickets',   label: 'My tickets', icon: Ticket },
  { href: '/dashboard/orders',    label: 'Orders',     icon: CreditCard },
  { href: '/dashboard/rsvps',     label: 'RSVPs',      icon: CalendarDays },
  { href: '/dashboard/transfers', label: 'Transfers',  icon: Users },
]

interface DashboardSidebarProps {
  profile: Profile | null
  ticketCount?: number
  unreadCount?: number
}

export function DashboardSidebar({ profile, ticketCount = 0 }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="sidebar" aria-label="Dashboard navigation">
      {/* Brand */}
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">N</span>
        <span>northstar</span>
      </div>

      {/* Workspace label */}
      <div className="workspace-label">PERSONAL SPACE</div>

      {/* Nav */}
      <nav className="side-nav" aria-label="Primary navigation">
        {nav.map((item) => {
          const active =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${active ? ' nav-item-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon aria-hidden="true" />
              {item.label}
              {item.href === '/dashboard/tickets' && ticketCount > 0 && (
                <span className="nav-count" aria-label={`${ticketCount} tickets`}>
                  {ticketCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <Link
          href="/dashboard/settings"
          className={`nav-item${pathname === '/dashboard/settings' ? ' nav-item-active' : ''}`}
          aria-current={pathname === '/dashboard/settings' ? 'page' : undefined}
        >
          <Settings aria-hidden="true" />
          Settings
        </Link>

        <div className="profile">
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name}
            size="sm"
          />
          <div>
            <strong>{profile?.full_name ?? 'Account'}</strong>
            <span>{profile?.role ?? 'attendee'}</span>
          </div>
          <MoreHorizontal aria-hidden="true" />
        </div>
      </div>
    </aside>
  )
}
