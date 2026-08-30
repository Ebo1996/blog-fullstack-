'use client'

import Link from 'next/link'

const footerLinks = {
  Discover: [
    { href: '/events', label: 'All events' },
    { href: '/categories/music', label: 'Music' },
    { href: '/categories/technology', label: 'Technology' },
    { href: '/categories/business', label: 'Business' },
    { href: '/categories/art', label: 'Art' },
  ],
  Organizers: [
    { href: '/organizer', label: 'Create an event' },
    { href: '/organizer', label: 'Organizer dashboard' },
    { href: '/about', label: 'How it works' },
  ],
  Company: [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy policy' },
    { href: '/terms', label: 'Terms of service' },
  ],
}

export function SiteFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer-inner">
        {/* Brand col */}
        <div>
          <Link
            href="/"
            className="brand"
            style={{ paddingBottom: 0, marginBottom: 16, display: 'inline-flex', fontSize: 17 }}
            aria-label="Northstar home"
          >
            <span className="brand-mark" style={{ marginRight: 10 }} aria-hidden="true">N</span>
            northstar
          </Link>
          <p style={{ color: 'var(--muted-foreground)', fontSize: 13, lineHeight: 1.65, maxWidth: 260, margin: 0 }}>
            Discover events worth attending. The platform for organisers and attendees who care about great experiences.
          </p>
        </div>

        {/* Link columns */}
        {Object.entries(footerLinks).map(([group, items]) => (
          <div key={group}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              {group}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover-fg"
                    style={{
                      fontSize: 13,
                      color: 'var(--muted-foreground)',
                    }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          maxWidth: 1200,
          margin: '32px auto 0',
          padding: '20px 24px 0',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
          color: 'var(--muted-foreground)',
          fontSize: 12,
        }}
      >
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} Northstar. All rights reserved.</p>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/privacy" style={{ color: 'var(--muted-foreground)' }}>Privacy</Link>
          <Link href="/terms" style={{ color: 'var(--muted-foreground)' }}>Terms</Link>
          <Link href="/contact" style={{ color: 'var(--muted-foreground)' }}>Contact</Link>
        </div>
      </div>
    </footer>
  )
}
