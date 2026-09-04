'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Search, Bell, Menu, X, ChevronDown,
  LayoutDashboard, Ticket, LogOut, Settings, User,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { getInitials } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const navLinks = [
    { href: '/events', label: 'Events' },
    { href: '/categories', label: 'Categories' },
    { href: '/about', label: 'About' },
  ]

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)] backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center gap-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-[17px] tracking-tight flex-shrink-0">
          <span className="brand-mark text-sm">E</span>
          <span>eventify</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-sm transition-colors ${
                isActive(link.href)
                  ? 'text-[var(--foreground)] bg-[var(--muted)]'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <Link
          href="/search"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] border border-[var(--border)] text-[var(--muted-foreground)] text-xs hover:border-[var(--primary)] transition-colors"
          style={{ width: 200 }}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search events…</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3 ml-auto">
          {user ? (
            <>
              {/* Notifications */}
              <Link href="/dashboard/notifications" className="icon-btn relative">
                <Bell className="w-4.5 h-4.5" />
                <span className="notification-dot" />
              </Link>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="avatar w-8 h-8 text-xs"
                      aria-label={user.name}
                    >
                      {getInitials(user.name)}
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-10 w-52 card shadow-xl py-1 z-50 animate-fade-in"
                    onBlur={() => setUserMenuOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <p className="text-xs font-semibold">{user.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate">{user.email}</p>
                    </div>
                    <MenuLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={() => setUserMenuOpen(false)} />
                    <MenuLink href="/dashboard/tickets" icon={Ticket} label="My Tickets" onClick={() => setUserMenuOpen(false)} />
                    {user.role === 'organizer' && (
                      <MenuLink href="/organizer" icon={LayoutDashboard} label="Organizer Dashboard" onClick={() => setUserMenuOpen(false)} />
                    )}
                    {user.role === 'admin' && (
                      <MenuLink href="/admin" icon={Settings} label="Admin Panel" onClick={() => setUserMenuOpen(false)} />
                    )}
                    <MenuLink href="/dashboard/settings" icon={Settings} label="Settings" onClick={() => setUserMenuOpen(false)} />
                    <div className="border-t border-[var(--border)] mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[var(--muted)] transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Get started</Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="icon-btn md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--background)] py-3 px-5 flex flex-col gap-1 animate-fade-in">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="py-2.5 px-3 text-sm rounded-[var(--radius-sm)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/search"
            onClick={() => setMenuOpen(false)}
            className="py-2.5 px-3 text-sm flex items-center gap-2 text-[var(--muted-foreground)]"
          >
            <Search className="w-4 h-4" /> Search events
          </Link>
        </div>
      )}
    </header>
  )
}

function MenuLink({ href, icon: Icon, label, onClick }: { href: string; icon: any; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </Link>
  )
}
