'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Search, Menu, X } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { Profile } from '@/types/database'

const mobileLinks = [
  { href: '/admin',            label: 'Overview' },
  { href: '/admin/users',      label: 'Users' },
  { href: '/admin/events',     label: 'Events' },
  { href: '/admin/orders',     label: 'Orders' },
  { href: '/admin/reports',    label: 'Reports' },
  { href: '/admin/categories', label: 'Categories' },
  { href: '/admin/analytics',  label: 'Analytics' },
  { href: '/admin/settings',   label: 'Settings' },
]

interface AdminHeaderProps {
  title: string
  eyebrow?: string
  profile: Profile | null
  actions?: React.ReactNode
}

export function AdminHeader({ title, eyebrow, profile, actions }: AdminHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const todayLabel = new Date()
    .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .toUpperCase()

  return (
    <header className="topbar">
      {/* Mobile toggle */}
      <button
        className="mobile-menu"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="eyebrow">{eyebrow ?? todayLabel}</div>
        <h1 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </h1>
      </div>

      {/* Actions */}
      <div className="top-actions">
        <label className="search" htmlFor="admin-search">
          <Search aria-hidden="true" />
          <input id="admin-search" type="search" aria-label="Search" placeholder="Search" />
        </label>

        {actions}

        <button className="icon-button" aria-label="Notifications">
          <Bell aria-hidden="true" />
        </button>

        <Link href="/admin/settings" aria-label="Settings">
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name}
            size="sm"
            className="avatar-top"
          />
        </Link>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {mobileLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
