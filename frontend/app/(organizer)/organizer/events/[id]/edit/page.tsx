'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { eventsApi } from '@/lib/api/events'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  shortDescription: z.string().max(300).optional(),
  startAt: z.string().min(1),
  endAt: z.string().min(1),
  venue: z.object({
    name: z.string().min(1),
    address: z.string().optional(),
    city: z.string().min(1),
    country: z.string().default('Ethiopia'),
  }),
  capacity: z.number().min(1).optional(),
  currency: z.string().default('ETB'),
})

type FormData = z.infer<typeof schema>

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<any>(null)
  const [ticketTypes, setTicketTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  const loadData = async () => {
    try {
      const [evRes, ttRes] = await Promise.all([
        eventsApi.getBySlug(id),
        eventsApi.getTicketTypes(id),
      ])
      const ev = evRes.data
      setEvent(ev)
      setTicketTypes(ttRes.data ?? [])
      form.reset({
        title: ev.title,
        description: ev.description,
        shortDescription: ev.shortDescription ?? '',
        startAt: ev.startAt?.slice(0, 16),
        endAt: ev.endAt?.slice(0, 16),
        venue: { name: ev.venue?.name ?? '', address: ev.venue?.address ?? '', city: ev.venue?.city ?? '', country: ev.venue?.country ?? 'Ethiopia' },
        capacity: ev.capacity,
        currency: ev.currency ?? 'ETB',
      })
    } catch { toast.error('Event not found') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [id])

  const onSave = async (data: FormData) => {
    try {
      await eventsApi.update(id, data)
      toast.success('Event updated')
    } catch (err: any) { toast.error(err?.message ?? 'Update failed') }
  }

  if (loading) return (
    <div className="page-content flex items-center justify-center min-h-[300px]">
      <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" />
    </div>
  )

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ORGANIZER · EVENTS</div>
          <h1>Edit event</h1>
        </div>
      </header>

      <div className="page-content max-w-2xl">
        <Link href="/organizer/events" className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to events
        </Link>

        {/* Sub-nav tabs */}
        <div className="flex gap-1 mb-8 border-b border-[var(--border)]">
          {[
            { label: 'Details',  href: `/organizer/events/${id}/edit`    },
            { label: 'Tickets',  href: `/organizer/events/${id}/tickets` },
            { label: 'Scanner',  href: `/organizer/events/${id}/scanner` },
          ].map(({ label, href }) => {
            const active = typeof window !== 'undefined' && window.location.pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors -mb-px ${
                  active
                    ? 'border-[var(--primary)] text-[var(--foreground)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Event form */}
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-5 mb-10">
          <h2 className="text-serif text-xl">Event details</h2>
          <Input label="Title *" error={form.formState.errors.title?.message} {...form.register('title')} />
          <Textarea label="Description *" rows={5} error={form.formState.errors.description?.message} {...form.register('description')} />
          <Input label="Short description" {...form.register('shortDescription')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start date & time *" type="datetime-local" error={form.formState.errors.startAt?.message} {...form.register('startAt')} />
            <Input label="End date & time *" type="datetime-local" error={form.formState.errors.endAt?.message} {...form.register('endAt')} />
          </div>
          <Input label="Venue name *" {...form.register('venue.name')} />
          <Input label="Address" {...form.register('venue.address')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="City *" {...form.register('venue.city')} />
            <Input label="Country" {...form.register('venue.country')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Capacity" type="number" {...form.register('capacity', { valueAsNumber: true })} />
            <Input label="Currency" {...form.register('currency')} />
          </div>
          <Button type="submit" loading={form.formState.isSubmitting}>Save changes</Button>
        </form>

        {/* Ticket types shortcut */}
        <div className="border-t border-[var(--border)] pt-8">
          <div className="panel flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">Ticket types</p>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {ticketTypes.length === 0
                  ? 'No ticket types yet — add some so attendees can register'
                  : `${ticketTypes.length} type${ticketTypes.length !== 1 ? 's' : ''} · ${ticketTypes.reduce((s, t) => s + (t.soldQuantity ?? 0), 0)} sold`
                }
              </p>
            </div>
            <Link href={`/organizer/events/${id}/tickets`} className="btn btn-primary btn-sm gap-2 flex-shrink-0">
              Manage tickets
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
