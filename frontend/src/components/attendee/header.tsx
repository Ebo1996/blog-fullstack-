'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Search, Menu, X } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { Profile } from '@/types/database'

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
}

export function DashboardHeader({
  title,
  eyebrow,
  profile,
  unreadCount = 0,
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

        <Link
          href="/dashboard/notifications"
          className="icon-button"
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : 'Notifications'
          }
        >
          <Bell aria-hidden="true" />
          {unreadCount > 0 && <i aria-hidden="true" />}
        </Link>

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
