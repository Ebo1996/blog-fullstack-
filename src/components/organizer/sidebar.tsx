'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CalendarDays,
  ShoppingBag,
  Users,
  BarChart2,
  Settings,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import type { Profile } from '@/types/database'

const nav = [
  { href: '/organizer',        label: 'Overview',  icon: LayoutDashboard, exact: true },
  { href: '/organizer/events', label: 'Events',    icon: CalendarDays,    exact: false },
]

interface OrganizerSidebarProps {
  profile: Profile | null
  /** Currently viewed event for contextual sub-nav */
  activeEventId?: string
  activeEventTitle?: string
}

const eventSubNav = [
  { segment: '',           label: 'Overview'   },
  { segment: 'tickets',    label: 'Tickets'    },
  { segment: 'orders',     label: 'Orders'     },
  { segment: 'attendees',  label: 'Attendees'  },
  { segment: 'check-ins',  label: 'Check-ins'  },
  { segment: 'scanner',    label: 'Scanner'    },
  { segment: 'analytics',  label: 'Analytics'  },
  { segment: 'settings',   label: 'Settings'   },
]

export function OrganizerSidebar({
  profile,
  activeEventId,
  activeEventTitle,
}: OrganizerSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="sidebar organizer-shell" aria-label="Organizer navigation">
      {/* Brand */}
      <div className="brand">
        <span
          className="brand-mark"
          style={{ background: 'var(--organizer-accent)', color: '#fff' }}
          aria-hidden="true"
        >
          N
        </span>
        <span>northstar</span>
      </div>

      <div className="workspace-label">ORGANIZER</div>

      {/* Primary nav */}
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
              className={`nav-item${active ? ' nav-item-active organizer-accent' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon aria-hidden="true" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Event sub-nav — shown when inside an event */}
      {activeEventId && (
        <>
          <div className="nav-section-label" style={{ marginTop: 16 }}>
            <span
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              <ChevronRight size={10} aria-hidden="true" />
              {activeEventTitle ?? 'Event'}
            </span>
          </div>
          <nav className="side-nav" aria-label="Event navigation">
            {eventSubNav.map((item) => {
              const href = `/organizer/events/${activeEventId}${item.segment ? `/${item.segment}` : ''}`
              const active = item.segment === ''
                ? pathname === href
                : pathname.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`nav-item${active ? ' nav-item-active organizer-accent' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  style={{ paddingLeft: 24, fontSize: 12 }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </>
      )}

      {/* Bottom */}
      <div className="sidebar-bottom">
        <Link
          href="/organizer/settings"
          className={`nav-item${pathname === '/organizer/settings' ? ' nav-item-active organizer-accent' : ''}`}
        >
          <Settings aria-hidden="true" />
          Settings
        </Link>

        <div className="profile">
          <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
          <div>
            <strong>{profile?.full_name ?? 'Organizer'}</strong>
            <span>organizer</span>
          </div>
          <MoreHorizontal aria-hidden="true" />
        </div>
      </div>
    </aside>
  )
}
