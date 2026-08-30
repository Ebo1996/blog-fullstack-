import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { AdminHeader } from '@/components/admin/header'
import { getPlatformStats } from '@/services/admin'
import { formatDate, formatNumber } from '@/lib/utils/format'
import {
  Users, CalendarDays, ShoppingBag, Database,
  ExternalLink, Shield, Bell,
} from 'lucide-react'
import type { Profile } from '@/types/database'

export const metadata: Metadata = { title: 'Admin — Settings' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single<Profile>()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const stats = await getPlatformStats()

  return (
    <>
      <AdminHeader title="Settings" eyebrow="PLATFORM SETTINGS" profile={profile} />

      <main className="content" style={{ maxWidth: 800 }}>

        {/* ── Account section ──────────────────────────────────── */}
        <section aria-labelledby="admin-account-heading" className="settings-panel">
          <div className="setting-row" style={{ paddingTop: 0 }}>
            <h2
              id="admin-account-heading"
              style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}
            >
              Admin account
            </h2>
          </div>
          <div className="setting-row">
            <div>
              <strong>Name</strong>
              <span>{profile.full_name ?? '—'}</span>
            </div>
            <Link href="/dashboard/settings" className="button button-outline button-sm">
              Edit profile
            </Link>
          </div>
          <div className="setting-row">
            <div>
              <strong>Role</strong>
              <span>Administrator — full platform access</span>
            </div>
            <span className="badge badge-error" style={{ textTransform: 'capitalize' }}>admin</span>
          </div>
          <div className="setting-row" style={{ paddingBottom: 0 }}>
            <div>
              <strong>Member since</strong>
              <span>
                {profile.created_at
                  ? formatDate(profile.created_at, 'MMMM d, yyyy')
                  : '—'}
              </span>
            </div>
          </div>
        </section>

        {/* ── Platform snapshot ─────────────────────────────────── */}
        <section aria-labelledby="platform-snapshot-heading" className="settings-panel" style={{ marginTop: 20 }}>
          <div className="setting-row" style={{ paddingTop: 0 }}>
            <h2
              id="platform-snapshot-heading"
              style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}
            >
              Platform snapshot
            </h2>
          </div>
          {[
            { icon: <Users size={14} />,      label: 'Total users',    value: formatNumber(stats.totalUsers) },
            { icon: <CalendarDays size={14} />, label: 'Total events',  value: formatNumber(stats.totalEvents) },
            { icon: <ShoppingBag size={14} />, label: 'Tickets sold',   value: formatNumber(stats.totalTicketsSold) },
          ].map((item) => (
            <div key={item.label} className="setting-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--admin-accent)' }} aria-hidden="true">{item.icon}</span>
                <strong>{item.label}</strong>
              </div>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 400, color: 'var(--foreground)' }}>
                {item.value}
              </span>
            </div>
          ))}
          <div className="setting-row" style={{ paddingBottom: 0 }}>
            <div>
              <strong>View full analytics</strong>
              <span>Charts, trends, and platform growth metrics</span>
            </div>
            <Link href="/admin/analytics" className="button button-outline button-sm" style={{ gap: 6 }}>
              <ExternalLink size={12} aria-hidden="true" />
              Analytics
            </Link>
          </div>
        </section>

        {/* ── Integrations ──────────────────────────────────────── */}
        <section aria-labelledby="integrations-heading" className="settings-panel" style={{ marginTop: 20 }}>
          <div className="setting-row" style={{ paddingTop: 0 }}>
            <h2
              id="integrations-heading"
              style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}
            >
              Integrations
            </h2>
          </div>
          {[
            {
              icon: <Database size={14} />,
              label: 'Supabase',
              desc:  'Database, auth, and storage',
              href:  'https://app.supabase.com',
              cta:   'Open dashboard',
            },
            {
              icon: <ShoppingBag size={14} />,
              label: 'Chapa',
              desc:  'Payments, webhooks, and refunds',
              href:  'https://dashboard.chapa.co',
              cta:   'Open dashboard',
            },
          ].map((item) => (
            <div key={item.label} className="setting-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--admin-accent)' }} aria-hidden="true">{item.icon}</span>
                <div>
                  <strong>{item.label}</strong>
                  <span>{item.desc}</span>
                </div>
              </div>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-outline button-sm"
                style={{ gap: 6 }}
              >
                <ExternalLink size={12} aria-hidden="true" />
                {item.cta}
              </a>
            </div>
          ))}
        </section>

        {/* ── Security ──────────────────────────────────────────── */}
        <section aria-labelledby="security-heading" className="settings-panel" style={{ marginTop: 20 }}>
          <div className="setting-row" style={{ paddingTop: 0 }}>
            <h2
              id="security-heading"
              style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: 0, letterSpacing: '-0.01em' }}
            >
              Security
            </h2>
          </div>
          <div className="setting-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={14} style={{ color: 'var(--admin-accent)' }} aria-hidden="true" />
              <div>
                <strong>Row Level Security</strong>
                <span>All tables are protected by Supabase RLS policies</span>
              </div>
            </div>
            <span className="badge badge-success">Enabled</span>
          </div>
          <div className="setting-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={14} style={{ color: 'var(--admin-accent)' }} aria-hidden="true" />
              <div>
                <strong>Webhook signature verification</strong>
                <span>All Chapa webhooks are verified via payment verification API</span>
              </div>
            </div>
            <span className="badge badge-success">Active</span>
          </div>
          <div className="setting-row" style={{ paddingBottom: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={14} style={{ color: 'var(--admin-accent)' }} aria-hidden="true" />
              <div>
                <strong>Audit trail</strong>
                <span>Check-in events logged in check_ins table</span>
              </div>
            </div>
            <span className="badge badge-success">Active</span>
          </div>
        </section>

        {/* ── Danger zone ───────────────────────────────────────── */}
        <section
          aria-labelledby="danger-zone-heading"
          className="settings-panel"
          style={{ marginTop: 20, borderColor: 'rgba(224,107,107,0.25)' }}
        >
          <div className="setting-row" style={{ paddingTop: 0 }}>
            <h2
              id="danger-zone-heading"
              style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 400, margin: 0, letterSpacing: '-0.01em', color: 'var(--error)' }}
            >
              Danger zone
            </h2>
          </div>
          <div className="setting-row" style={{ paddingBottom: 0 }}>
            <div>
              <strong>Seed data</strong>
              <span>
                Development seed data is in{' '}
                <code style={{ fontSize: 11, background: 'var(--muted)', padding: '2px 5px', borderRadius: 4 }}>
                  backend/supabase/seed.sql
                </code>
                . Never run against production.
              </span>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
