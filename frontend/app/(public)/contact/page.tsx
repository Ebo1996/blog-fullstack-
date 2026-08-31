'use client'

import type { Metadata } from 'next'
import { useState } from 'react'
import { Mail, MapPin, Phone, CheckCircle } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate send — connect to email service when ready
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="max-w-lg mx-auto px-5 py-32 text-center">
        <div className="w-14 h-14 rounded-full bg-[rgba(200,231,107,0.1)] flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-7 h-7 text-[var(--primary)]" />
        </div>
        <h1 className="text-serif text-2xl mb-3">Message sent!</h1>
        <p className="text-sm text-[var(--muted-foreground)]">
          We'll get back to you within 1–2 business days.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-5 py-16">
      <div className="mb-12">
        <span className="eyebrow mb-3 block">Contact us</span>
        <h1 className="text-serif" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>Get in touch</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contact info */}
        <div className="space-y-6">
          {[
            { icon: Mail, label: 'Email', value: 'hello@eventify.et' },
            { icon: Phone, label: 'Phone', value: '+251 11 XXX XXXX' },
            { icon: MapPin, label: 'Address', value: 'Bole Road, Addis Ababa, Ethiopia' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-[var(--primary)]" />
              </div>
              <div>
                <p className="text-xs font-semibold mb-1">{label}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{value}</p>
              </div>
            </div>
          ))}

          <div className="panel mt-6">
            <p className="text-xs font-semibold mb-2">Support hours</p>
            <p className="text-xs text-[var(--muted-foreground)]">Monday – Friday</p>
            <p className="text-xs text-[var(--muted-foreground)]">9:00 AM – 6:00 PM EAT</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5 panel p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Your name"
              placeholder="Abebe Bekele"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <Input
            label="Subject"
            placeholder="How can we help?"
            required
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          />
          <Textarea
            label="Message"
            placeholder="Tell us more…"
            rows={6}
            required
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          />
          <Button type="submit" loading={loading}>Send message</Button>
        </form>
      </div>
    </div>
  )
}
