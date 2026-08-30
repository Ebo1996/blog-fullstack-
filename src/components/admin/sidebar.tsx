'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, CalendarDays, ShoppingBag,
  Flag, Tag, BarChart2, Settings, MoreHorizontal, Building2,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { Profile } from '@/types/database'

const nav = [
  { href: '/admin',             label: 'Overview',    icon: LayoutDashboard, exact: true },
  { href: '/admin/users',       label: 'Users',       icon: Users,           exact: false },
  { href: '/admin/organizers',  label: 'Organizers',  icon: Building2,       exact: false },
  { href: '/admin/events',      label: 'Events',      icon: CalendarDays,    exact: false },
  { href: '/admin/orders',      label: 'Orders',      icon: ShoppingBag,     exact: false },
  { href: '/admin/reports',     label: 'Reports',     icon: Flag,            exact: false },
  { href: '/admin/categories',  label: 'Categories',  icon: Tag,             exact: false },
  { href: '/admin/analytics',   label: 'Analytics',   icon: BarChart2,       exact: false },
]

interface AdminSidebarProps {
  profile: Profile | null
  reportCount?: number
}

export function AdminSidebar({ profile, reportCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="sidebar admin-shell" aria-label="Admin navigation">
      {/* Brand */}
      <div className="brand">
        <span
          className="brand-mark"
          style={{ background: 'var(--admin-accent)', color: '#fff' }}
          aria-hidden="true"
        >
          N
        </span>
        <span>northstar</span>
      </div>

      <div className="workspace-label">ADMIN</div>

      {/* Nav */}
      <nav className="side-nav" aria-label="Primary navigation">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${active ? ' nav-item-active admin-accent' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon aria-hidden="true" />
              {item.label}
              {item.href === '/admin/reports' && reportCount > 0 && (
                <span
                  className="nav-count"
                  style={{ background: 'var(--admin-accent)' }}
                  aria-label={`${reportCount} pending reports`}
                >
                  {reportCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        <Link
          href="/admin/settings"
          className={`nav-item${pathname === '/admin/settings' ? ' nav-item-active admin-accent' : ''}`}
          aria-current={pathname === '/admin/settings' ? 'page' : undefined}
        >
          <Settings aria-hidden="true" />
          Settings
        </Link>

        <div className="profile">
          <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
          <div>
            <strong>{profile?.full_name ?? 'Admin'}</strong>
            <span>administrator</span>
          </div>
          <MoreHorizontal aria-hidden="true" />
        </div>
      </div>
    </aside>
  )
}
