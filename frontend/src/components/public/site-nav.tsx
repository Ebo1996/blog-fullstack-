'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/events',                  label: 'Discover'    },
  { href: '/categories/technology',   label: 'Technology'  },
  { href: '/categories/music',        label: 'Music'       },
  { href: '/categories/business',     label: 'Business'    },
  { href: '/about',                   label: 'About'       },
]

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="site-nav" role="banner">
      <div className="site-nav-inner">
        {/* Brand */}
        <Link href="/" className="brand" style={{ paddingBottom: 0, gap: 10, fontSize: 18 }} aria-label="Northstar home">
          <span className="brand-mark" aria-hidden="true">N</span>
          northstar
        </Link>

        {/* Desktop nav links — hidden on mobile via CSS */}
        <nav className="site-nav-links" aria-label="Main navigation">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn('nav-link', pathname === l.href || pathname.startsWith(l.href + '/') ? 'active' : '')}
              style={{
                color: pathname === l.href || pathname.startsWith(l.href) ? 'var(--foreground)' : undefined,
                transition: 'color var(--transition-fast)',
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Desktop CTAs — hidden on mobile via CSS */}
          <Link href="/login"    className="button button-outline button-sm site-nav-desktop-only" style={{ fontSize: 12 }}>Sign in</Link>
          <Link href="/register" className="button button-primary button-sm site-nav-desktop-only" style={{ fontSize: 12 }}>Get started</Link>

          {/* Mobile hamburger — hidden on desktop via CSS */}
          <button
            className="mobile-menu site-nav-mobile-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="site-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav
          id="site-mobile-nav"
          aria-label="Mobile navigation"
          style={{
            background: 'var(--card)',
            borderTop: '1px solid var(--border)',
            padding: '8px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                padding: '13px 0',
                fontSize: 15,
                fontWeight: 500,
                borderBottom: '1px solid var(--border)',
                color: pathname === l.href || pathname.startsWith(l.href + '/') ? 'var(--primary)' : 'var(--foreground)',
              }}
            >
              {l.label}
            </Link>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Link href="/login"    className="button button-outline" style={{ flex: 1, justifyContent: 'center' }}>Sign in</Link>
            <Link href="/register" className="button button-primary" style={{ flex: 1, justifyContent: 'center' }}>Get started</Link>
          </div>
        </nav>
      )}
    </header>
  )
}

// Authenticated nav variant (shown when user is logged in)
export function SiteNavAuthenticated({ role }: { role: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const dashboardHref  = role === 'admin' ? '/admin' : role === 'organizer' ? '/organizer' : '/dashboard'
  const dashboardLabel = role === 'admin' ? 'Admin'  : role === 'organizer' ? 'Dashboard'  : 'My tickets'

  return (
    <header className="site-nav" role="banner">
      <div className="site-nav-inner">
        <Link href="/" className="brand" style={{ paddingBottom: 0, gap: 10, fontSize: 18 }} aria-label="Northstar home">
          <span className="brand-mark" aria-hidden="true">N</span>
          northstar
        </Link>

        {/* Desktop nav */}
        <nav className="site-nav-links" aria-label="Main navigation">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{ color: pathname === l.href || pathname.startsWith(l.href + '/') ? 'var(--foreground)' : undefined }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Dashboard button — desktop only */}
          <Link
            href={dashboardHref}
            className="button button-primary button-sm site-nav-desktop-only"
            style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 12 }}
          >
            <Ticket size={14} aria-hidden="true" />
            {dashboardLabel}
          </Link>

          {/* Mobile hamburger */}
          <button
            className="mobile-menu site-nav-mobile-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="site-mobile-nav-auth"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav
          id="site-mobile-nav-auth"
          aria-label="Mobile navigation"
          style={{
            background: 'var(--card)',
            borderTop: '1px solid var(--border)',
            padding: '8px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{
                padding: '13px 0',
                fontSize: 15,
                fontWeight: 500,
                borderBottom: '1px solid var(--border)',
                color: pathname === l.href || pathname.startsWith(l.href + '/') ? 'var(--primary)' : 'var(--foreground)',
              }}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href={dashboardHref}
            onClick={() => setOpen(false)}
            className="button button-primary"
            style={{ marginTop: 16, justifyContent: 'center', display: 'flex', gap: 8 }}
          >
            <Ticket size={14} aria-hidden="true" />
            {dashboardLabel}
          </Link>
        </nav>
      )}
    </header>
  )
}
