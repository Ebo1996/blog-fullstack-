import type { Metadata } from 'next'
import Link from 'next/link'
import { QrCode, ShieldCheck, Zap, Users, BarChart3, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Eventify Ethiopia',
  description: "Ethiopia's premier event management and ticketing platform. Learn about our mission, team, and platform.",
}

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-5 py-24">
        <div className="max-w-3xl">
          <span className="eyebrow mb-4 block">About Eventify</span>
          <h1 className="text-serif" style={{ fontSize: 'clamp(38px, 5vw, 64px)', lineHeight: 1.05, marginBottom: 20 }}>
            Built for Ethiopia's growing event culture.
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed max-w-xl" style={{ fontSize: 16 }}>
            Eventify Ethiopia is a production-grade event management and ticketing platform built for organizers,
            attendees, and the thriving live-event industry across Ethiopia and East Africa.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="border-t border-[var(--border)] bg-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-5 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="eyebrow mb-3 block">Our mission</span>
              <h2 className="text-serif" style={{ fontSize: 'clamp(26px, 3vw, 38px)', marginBottom: 16 }}>
                Make great events accessible to everyone.
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                We believe that great events — whether a tech summit in Bole, a music festival in the park, or a
                community meetup in Bahir Dar — deserve world-class tooling. Eventify gives organizers the power to
                create, manage, and grow their events with secure payments, digital QR tickets, and real-time analytics.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: QrCode, label: 'Digital QR Tickets', desc: 'Secure, scannable QR codes for every ticket' },
                { icon: ShieldCheck, label: 'Secure Payments', desc: 'Chapa-powered payments verified server-side' },
                { icon: BarChart3, label: 'Real Analytics', desc: 'Live aggregation from MongoDB pipelines' },
                { icon: Globe, label: 'Built for Ethiopia', desc: 'ETB currency, local payment provider, local team' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="card p-5">
                  <div className="w-9 h-9 rounded-full bg-[var(--muted)] flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <p className="text-xs font-semibold mb-1">{label}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="max-w-7xl mx-auto px-5 py-20 border-t border-[var(--border)]">
        <div className="text-center mb-12">
          <span className="eyebrow mb-3 block">Technology</span>
          <h2 className="text-serif" style={{ fontSize: 'clamp(24px, 3vw, 36px)' }}>Built on production-grade stack</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: 'Next.js 14', role: 'Frontend' },
            { name: 'NestJS', role: 'Backend API' },
            { name: 'MongoDB Atlas', role: 'Database' },
            { name: 'Chapa', role: 'Payments' },
            { name: 'TypeScript', role: 'Language' },
            { name: 'JWT + Passport', role: 'Auth' },
          ].map(({ name, role }) => (
            <div key={name} className="card p-5 text-center">
              <p className="text-xs font-bold mb-1">{name}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-5 py-16 border-t border-[var(--border)]">
        <div className="card p-12 text-center" style={{ background: 'linear-gradient(135deg, #30342a 0%, #1a1916 100%)' }}>
          <h2 className="text-serif" style={{ fontSize: 'clamp(24px, 3vw, 36px)', marginBottom: 12 }}>
            Ready to host your next event?
          </h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-8 max-w-md mx-auto">
            Join organizers across Ethiopia using Eventify to sell tickets, manage attendees, and grow their events.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/register?role=organizer" className="btn btn-primary btn-lg">Start for free</Link>
            <Link href="/events" className="btn btn-outline btn-lg">Browse events</Link>
          </div>
        </div>
      </section>
    </>
  )
}
