'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Search, Menu, X, Plus } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { Profile } from '@/types/database'

interface OrganizerHeaderProps {
  title: string
  eyebrow?: string
  profile: Profile | null
  actions?: React.ReactNode
  /** Show a "New event" CTA in the header */
  showNewEvent?: boolean
}

export function OrganizerHeader({
  title,
  eyebrow,
  profile,
  actions,
  showNewEvent = false,
}: OrganizerHeaderProps) {
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
        <label className="search" htmlFor="org-search">
          <Search aria-hidden="true" />
          <input id="org-search" type="search" aria-label="Search" placeholder="Search" />
        </label>

        {showNewEvent && (
          <Link
            href="/organizer/events/new"
            className="button button-primary button-sm"
            style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12 }}
          >
            <Plus size={13} aria-hidden="true" />
            New event
          </Link>
        )}

        {actions}

        <button className="icon-button" aria-label="Notifications">
          <Bell aria-hidden="true" />
        </button>

        <Link href="/organizer/settings" aria-label="Settings">
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
          {[
            { href: '/organizer',        label: 'Overview' },
            { href: '/organizer/events', label: 'Events' },
            { href: '/organizer/settings', label: 'Settings' },
          ].map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
