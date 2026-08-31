'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  ArrowLeft, Plus, Trash2, Pencil, Pause, Play,
  Ticket, Users, DollarSign, Loader2, X, Check,
} from 'lucide-react'
import { eventsApi } from '@/lib/api/events'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'

// ── Zod schema ──────────────────────────────────────────────────────
const ttSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  quantity: z.number().min(1, 'At least 1 ticket required'),
  salesStartAt: z.string().optional(),
  salesEndAt: z.string().optional(),
  minPerOrder: z.number().min(1).default(1),
  maxPerOrder: z.number().min(1).max(100).default(10),
  isTransferable: z.boolean().default(false),
  isRefundable: z.boolean().default(true),
})
type TTForm = z.infer<typeof ttSchema>

// ── Helpers ─────────────────────────────────────────────────────────
function statusBadge(status: string) {
  switch (status) {
    case 'active':    return <Badge variant="success" dot>Active</Badge>
    case 'paused':    return <Badge variant="warning" dot>Paused</Badge>
    case 'sold_out':  return <Badge variant="danger" dot>Sold out</Badge>
    case 'expired':   return <Badge variant="neutral" dot>Expired</Badge>
    default:          return <Badge variant="neutral">{status}</Badge>
  }
}

function pct(sold: number, total: number) {
  if (!total) return 0
  return Math.round((sold / total) * 100)
}

// ── Main page ────────────────────────────────────────────────────────
export default function TicketTypesPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [event, setEvent]           = useState<any>(null)
  const [ticketTypes, setTicketTypes] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [panel, setPanel]           = useState<'none' | 'add' | string>('none') // 'none' | 'add' | ttId for edit
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [actioning, setActioning]   = useState<string | null>(null)

  const form = useForm<TTForm>({
    resolver: zodResolver(ttSchema),
    defaultValues: { price: 0, quantity: 100, minPerOrder: 1, maxPerOrder: 10, isTransferable: false, isRefundable: true },
  })

  // ── Load data ──────────────────────────────────────────────────────
  const reload = async () => {
    try {
      const [evRes, ttRes] = await Promise.all([
        eventsApi.getBySlug(id),
        eventsApi.getTicketTypes(id),
      ])
      setEvent(evRes.data)
      setTicketTypes(ttRes.data ?? [])
    } catch {
      toast.error('Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [id])

  // ── Open add panel ─────────────────────────────────────────────────
  const openAdd = () => {
    form.reset({ price: 0, quantity: 100, minPerOrder: 1, maxPerOrder: 10, isTransferable: false, isRefundable: true })
    setPanel('add')
  }

  // ── Open edit panel ────────────────────────────────────────────────
  const openEdit = (tt: any) => {
    form.reset({
      name: tt.name,
      description: tt.description ?? '',
      price: tt.price,
      quantity: tt.quantity,
      salesStartAt: tt.salesStartAt?.slice(0, 16) ?? '',
      salesEndAt: tt.salesEndAt?.slice(0, 16) ?? '',
      minPerOrder: tt.minPerOrder ?? 1,
      maxPerOrder: tt.maxPerOrder ?? 10,
      isTransferable: tt.isTransferable ?? false,
      isRefundable: tt.isRefundable ?? true,
    })
    setPanel(tt._id)
  }

  // ── Submit (add or edit) ──────────────────────────────────────────
  const onSubmit = async (data: TTForm) => {
    try {
      if (panel === 'add') {
        await eventsApi.createTicketType(id, data)
        toast.success('Ticket type created')
      } else {
        await eventsApi.updateTicketType(id, panel, data)
        toast.success('Ticket type updated')
      }
      setPanel('none')
      await reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to save ticket type')
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────
  const handleDelete = async (tt: any) => {
    if (tt.soldQuantity > 0) {
      toast.error('Cannot delete — tickets have already been sold. Pause it instead.')
      return
    }
    if (!confirm(`Delete "${tt.name}"? This cannot be undone.`)) return
    setDeleting(tt._id)
    try {
      await eventsApi.deleteTicketType(id, tt._id)
      toast.success('Ticket type deleted')
      await reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  // ── Pause / Resume ─────────────────────────────────────────────────
  const handleTogglePause = async (tt: any) => {
    setActioning(tt._id)
    try {
      if (tt.status === 'active') {
        await eventsApi.pauseTicketType(id, tt._id)
        toast.success('Sales paused')
      } else {
        await eventsApi.resumeTicketType(id, tt._id)
        toast.success('Sales resumed')
      }
      await reload()
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Action failed')
    } finally {
      setActioning(null)
    }
  }

  // ── Summary stats ──────────────────────────────────────────────────
  const totalSold      = ticketTypes.reduce((s, t) => s + (t.soldQuantity ?? 0), 0)
  const totalCapacity  = ticketTypes.reduce((s, t) => s + (t.quantity ?? 0), 0)
  const totalRevenue   = ticketTypes.reduce((s, t) => s + (t.soldQuantity ?? 0) * (t.price ?? 0), 0)
  const currency       = event?.currency ?? 'ETB'

  // ── Loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-content flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" />
      </div>
    )
  }

  const isEditMode = panel !== 'none' && panel !== 'add'

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ORGANIZER · EVENTS</div>
          <h1 className="truncate max-w-xs">{event?.title ?? 'Tickets'}</h1>
        </div>
        <div className="topbar-actions">
          <Button size="sm" onClick={openAdd}>
            <Plus className="w-3.5 h-3.5" /> Add ticket type
          </Button>
        </div>
      </header>

      <div className="page-content">
        {/* Breadcrumb */}
        <Link
          href={`/organizer/events/${id}/edit`}
          className="inline-flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to event
        </Link>

        {/* Sub-nav tabs */}
        <div className="flex gap-1 mb-8 border-b border-[var(--border)]">
          {[
            { label: 'Details',  href: `/organizer/events/${id}/edit`    },
            { label: 'Tickets',  href: `/organizer/events/${id}/tickets` },
            { label: 'Scanner',  href: `/organizer/events/${id}/scanner` },
          ].map(({ label, href }) => {
            const isTicketsTab = label === 'Tickets'
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors -mb-px ${
                  isTicketsTab
                    ? 'border-[var(--primary)] text-[var(--foreground)]'
                    : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="panel stat-card">
            <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center mb-3 text-blue-400">
              <Ticket className="w-4 h-4" />
            </div>
            <p className="stat-value">{totalSold.toLocaleString()}</p>
            <p className="stat-label">Tickets sold</p>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">of {totalCapacity.toLocaleString()} total</p>
          </div>
          <div className="panel stat-card">
            <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center mb-3 text-[var(--primary)]">
              <DollarSign className="w-4 h-4" />
            </div>
            <p className="stat-value" style={{ fontSize: 20 }}>{formatCurrency(totalRevenue, currency)}</p>
            <p className="stat-label">Revenue</p>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">gross, all types</p>
          </div>
          <div className="panel stat-card">
            <div className="w-8 h-8 rounded-full bg-[var(--muted)] flex items-center justify-center mb-3 text-purple-400">
              <Users className="w-4 h-4" />
            </div>
            <p className="stat-value">{ticketTypes.length}</p>
            <p className="stat-label">Ticket types</p>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1">
              {ticketTypes.filter(t => t.status === 'active').length} active
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Ticket types list ────────────────────────────────── */}
          <div className={panel !== 'none' ? 'lg:col-span-3' : 'lg:col-span-5'}>
            {ticketTypes.length === 0 ? (
              <div className="panel py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center mx-auto">
                  <Ticket className="w-5 h-5 text-[var(--muted-foreground)]" />
                </div>
                <p className="text-sm font-medium">No ticket types yet</p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Add ticket types so attendees can purchase tickets for this event.
                </p>
                <Button size="sm" onClick={openAdd}>
                  <Plus className="w-3.5 h-3.5" /> Add first ticket type
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {ticketTypes.map((tt) => {
                  const soldPct  = pct(tt.soldQuantity, tt.quantity)
                  const isActive = panel === tt._id

                  return (
                    <div
                      key={tt._id}
                      className={`panel transition-all ${isActive ? 'border-[var(--primary)]' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Left: info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold">{tt.name}</p>
                            {statusBadge(tt.status)}
                          </div>
                          {tt.description && (
                            <p className="text-xs text-[var(--muted-foreground)] mb-2 line-clamp-1">{tt.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                            <span className="font-semibold" style={{ color: 'var(--primary)' }}>
                              {tt.price === 0 ? 'Free' : formatCurrency(tt.price, tt.currency ?? currency)}
                            </span>
                            <span>{tt.soldQuantity ?? 0} / {tt.quantity} sold</span>
                            <span>{(tt.quantity - (tt.soldQuantity ?? 0)).toLocaleString()} left</span>
                          </div>

                          {/* Progress bar */}
                          <div className="mt-3 h-1.5 rounded-full bg-[var(--muted)] overflow-hidden w-full">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${soldPct}%`,
                                background: soldPct >= 90 ? '#ef4444' : soldPct >= 60 ? '#f59e0b' : 'var(--primary)',
                              }}
                            />
                          </div>
                          <p className="text-[10px] text-[var(--muted-foreground)] mt-1">{soldPct}% sold</p>
                        </div>

                        {/* Right: actions */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Edit */}
                          <button
                            onClick={() => isActive ? setPanel('none') : openEdit(tt)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)]'}`}
                            title={isActive ? 'Close' : 'Edit'}
                          >
                            {isActive ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                          </button>

                          {/* Pause / Resume */}
                          {(tt.status === 'active' || tt.status === 'paused') && (
                            <button
                              onClick={() => handleTogglePause(tt)}
                              disabled={actioning === tt._id}
                              className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-40 transition-colors"
                              title={tt.status === 'active' ? 'Pause sales' : 'Resume sales'}
                            >
                              {actioning === tt._id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : tt.status === 'active'
                                  ? <Pause className="w-3.5 h-3.5" />
                                  : <Play className="w-3.5 h-3.5" />
                              }
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(tt)}
                            disabled={deleting === tt._id || tt.soldQuantity > 0}
                            className="w-8 h-8 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:border-red-400 hover:text-red-400 disabled:opacity-30 transition-colors"
                            title={tt.soldQuantity > 0 ? 'Cannot delete — tickets sold' : 'Delete'}
                          >
                            {deleting === tt._id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Add / Edit panel ─────────────────────────────────── */}
          {panel !== 'none' && (
            <div className="lg:col-span-2">
              <form onSubmit={form.handleSubmit(onSubmit)} className="panel space-y-4 sticky top-24">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-sm">
                    {panel === 'add' ? 'New ticket type' : 'Edit ticket type'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setPanel('none')}
                    className="w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <Input
                  label="Name *"
                  placeholder="e.g. General Admission, VIP, Early Bird"
                  error={form.formState.errors.name?.message}
                  {...form.register('name')}
                />

                <Textarea
                  label="Description"
                  placeholder="What's included with this ticket?"
                  rows={2}
                  {...form.register('description')}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Price (ETB) *"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    error={form.formState.errors.price?.message}
                    {...form.register('price', { valueAsNumber: true })}
                  />
                  <Input
                    label="Quantity *"
                    type="number"
                    min="1"
                    placeholder="100"
                    error={form.formState.errors.quantity?.message}
                    {...form.register('quantity', { valueAsNumber: true })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Min per order"
                    type="number"
                    min="1"
                    {...form.register('minPerOrder', { valueAsNumber: true })}
                  />
                  <Input
                    label="Max per order"
                    type="number"
                    min="1"
                    max="100"
                    {...form.register('maxPerOrder', { valueAsNumber: true })}
                  />
                </div>

                <Input
                  label="Sales start"
                  type="datetime-local"
                  {...form.register('salesStartAt')}
                />
                <Input
                  label="Sales end"
                  type="datetime-local"
                  {...form.register('salesEndAt')}
                />

                {/* Toggles */}
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-[var(--primary)]"
                      {...form.register('isTransferable')}
                    />
                    <div>
                      <p className="text-xs font-medium">Transferable</p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">Allow attendees to transfer this ticket</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-[var(--primary)]"
                      {...form.register('isRefundable')}
                    />
                    <div>
                      <p className="text-xs font-medium">Refundable</p>
                      <p className="text-[10px] text-[var(--muted-foreground)]">Allow refund requests for this ticket</p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    type="submit"
                    loading={form.formState.isSubmitting}
                    className="flex-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {panel === 'add' ? 'Create' : 'Save changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setPanel('none')}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
