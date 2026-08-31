'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { eventsApi } from '@/lib/api/events'
import { Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

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

const ttSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  quantity: z.number().min(1),
  salesStartAt: z.string().optional(),
  salesEndAt: z.string().optional(),
  maxPerOrder: z.number().min(1).default(10),
})

type TTFormData = z.infer<typeof ttSchema>

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [ticketTypes, setTicketTypes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTTForm, setShowTTForm] = useState(false)

  const form = useForm<FormData>({ resolver: zodResolver(schema) })
  const ttForm = useForm<TTFormData>({ resolver: zodResolver(ttSchema), defaultValues: { maxPerOrder: 10, price: 0, quantity: 100 } })

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

  const onAddTicketType = async (data: TTFormData) => {
    try {
      await eventsApi.createTicketType(id, data)
      toast.success('Ticket type added')
      ttForm.reset({ maxPerOrder: 10, price: 0, quantity: 100 })
      setShowTTForm(false)
      const ttRes = await eventsApi.getTicketTypes(id)
      setTicketTypes(ttRes.data ?? [])
    } catch (err: any) { toast.error(err?.message ?? 'Failed to add ticket type') }
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

        {/* Ticket Types */}
        <div className="border-t border-[var(--border)] pt-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-serif text-xl">Ticket types</h2>
            <button onClick={() => setShowTTForm(!showTTForm)} className="btn btn-primary btn-sm gap-2">
              <Plus className="w-3.5 h-3.5" /> Add type
            </button>
          </div>

          {/* Add ticket type form */}
          {showTTForm && (
            <form onSubmit={ttForm.handleSubmit(onAddTicketType)} className="panel space-y-4 mb-6 animate-fade-in">
              <h3 className="font-semibold text-sm">New ticket type</h3>
              <Input label="Name *" placeholder="e.g. General Admission, VIP" error={ttForm.formState.errors.name?.message} {...ttForm.register('name')} />
              <Textarea label="Description" rows={2} {...ttForm.register('description')} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Price (ETB)" type="number" step="0.01" error={ttForm.formState.errors.price?.message} {...ttForm.register('price', { valueAsNumber: true })} />
                <Input label="Quantity *" type="number" error={ttForm.formState.errors.quantity?.message} {...ttForm.register('quantity', { valueAsNumber: true })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Sales start" type="datetime-local" {...ttForm.register('salesStartAt')} />
                <Input label="Sales end" type="datetime-local" {...ttForm.register('salesEndAt')} />
              </div>
              <Input label="Max per order" type="number" {...ttForm.register('maxPerOrder', { valueAsNumber: true })} />
              <div className="flex gap-3">
                <Button type="submit" loading={ttForm.formState.isSubmitting}>Add ticket type</Button>
                <Button type="button" variant="outline" onClick={() => setShowTTForm(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {/* Ticket types list */}
          {ticketTypes.length === 0 ? (
            <div className="panel py-8 text-center">
              <p className="text-xs text-[var(--muted-foreground)]">No ticket types yet. Add one to start selling.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ticketTypes.map((tt) => (
                <div key={tt._id} className="panel flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold">{tt.name}</p>
                      <Badge variant={tt.status === 'active' ? 'success' : tt.status === 'sold_out' ? 'danger' : 'neutral'}>
                        {tt.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {formatCurrency(tt.price, tt.currency)} · {tt.soldQuantity}/{tt.quantity} sold · {tt.availableQuantity ?? (tt.quantity - tt.soldQuantity)} available
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {tt.status === 'active' && (
                      <button
                        onClick={async () => {
                          await eventsApi.pauseTicketType(id, tt._id)
                          const ttRes = await eventsApi.getTicketTypes(id)
                          setTicketTypes(ttRes.data ?? [])
                          toast.success('Sales paused')
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        Pause
                      </button>
                    )}
                    {tt.status === 'paused' && (
                      <button
                        onClick={async () => {
                          await eventsApi.resumeTicketType(id, tt._id)
                          const ttRes = await eventsApi.getTicketTypes(id)
                          setTicketTypes(ttRes.data ?? [])
                          toast.success('Sales resumed')
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Scanner link */}
          {event?.status === 'published' && (
            <div className="mt-6 panel flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">QR Check-in Scanner</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">Scan tickets at the event entrance</p>
              </div>
              <Link href={`/organizer/events/${id}/scanner`} className="btn btn-primary btn-sm gap-2">
                Open scanner
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
