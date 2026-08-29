'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Menu, X } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { NotificationBell } from '@/components/ui/notification-bell'
import type { Profile, Notification } from '@/types/database'

const mobileLinks = [
  { href: '/dashboard',           label: 'Overview' },
  { href: '/dashboard/tickets',   label: 'My tickets' },
  { href: '/dashboard/orders',    label: 'Orders' },
  { href: '/dashboard/rsvps',     label: 'RSVPs' },
  { href: '/dashboard/transfers', label: 'Transfers' },
  { href: '/dashboard/settings',  label: 'Settings' },
]

interface DashboardHeaderProps {
  title: string
  eyebrow?: string
  profile: Profile | null
  unreadCount?: number
  userId?: string
  initialNotifications?: Notification[]
  markAsReadAction?: (id: string, userId: string) => Promise<{ success: boolean }>
}

export function DashboardHeader({
  title,
  eyebrow,
  profile,
  unreadCount = 0,
  userId,
  initialNotifications = [],
  markAsReadAction,
}: DashboardHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  // Today label e.g. SATURDAY, AUGUST 28, 2026
  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase()

  return (
    <header className="topbar">
      {/* Mobile menu toggle */}
      <button
        className="mobile-menu"
        aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={menuOpen}
        aria-controls="mobile-dashboard-nav"
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      {/* Title */}
      <div>
        <div className="eyebrow">{eyebrow ?? todayLabel}</div>
        <h1>{title}</h1>
      </div>

      {/* Top actions */}
      <div className="top-actions">
        <label className="search" htmlFor="dashboard-search">
          <Search aria-hidden="true" />
          <input
            id="dashboard-search"
            type="search"
            aria-label="Search"
            placeholder="Search"
          />
        </label>

        {userId && markAsReadAction ? (
          <NotificationBell
            userId={userId}
            initialUnreadCount={unreadCount}
            initialNotifications={initialNotifications}
            markAsReadAction={markAsReadAction}
          />
        ) : (
          <Link
            href="/dashboard/notifications"
            className="icon-button"
            aria-label={
              unreadCount > 0
                ? `${unreadCount} unread notifications`
                : 'Notifications'
            }
          >
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: 'var(--error)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        )}

        <Link href="/dashboard/settings" aria-label="Account settings">
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name}
            size="sm"
            className="avatar-top"
          />
        </Link>
      </div>

      {/* Mobile dropdown nav */}
      {menuOpen && (
        <nav
          id="mobile-dashboard-nav"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          {mobileLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}

// Alias for consistency with other files
export { DashboardHeader as AttendeeHeader }
