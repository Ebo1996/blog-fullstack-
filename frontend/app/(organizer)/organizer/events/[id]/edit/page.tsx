'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, ArrowLeft, Upload, X, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  const loadData = async () => {
    try {
      const [evRes, ttRes] = await Promise.all([
        eventsApi.getById(id),
        eventsApi.getTicketTypes(id),
      ])
      const ev = evRes.data
      if (!ev) {
        toast.error('Event not found')
        return
      }
      setEvent(ev)
      setTicketTypes(ttRes.data ?? [])
      // Set existing image preview if available
      if (ev.imageUrl) {
        setImagePreview(ev.imageUrl)
      }
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
    } catch (err: any) { 
      console.error('Failed to load event:', err)
      toast.error(err?.message || 'Failed to load event') 
    }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [id])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { 
      toast.error('Please select an image file')
      return 
    }
    if (file.size > 5 * 1024 * 1024) { 
      toast.error('Image must be under 5 MB')
      return 
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', imageFile)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/storage/upload/event-image`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: formData,
        }
      )
      if (!res.ok) throw new Error('Upload failed')
      const json = await res.json()
      return json.data?.url ?? null
    } catch {
      toast.error('Image upload failed')
      return null
    } finally {
      setUploading(false)
    }
  }

  const onSave = async (data: FormData) => {
    try {
      // Upload image if a new one was selected
      let imageUrl = event.imageUrl
      if (imageFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }
      
      await eventsApi.update(id, { ...data, imageUrl })
      toast.success('Event updated')
      // Reload to show updated image
      loadData()
    } catch (err: any) { 
      toast.error(err?.message ?? 'Update failed') 
    }
  }

  if (loading) return (
    <div className="page-content flex items-center justify-center min-h-[300px]">
      <Loader2 className="w-6 h-6 animate-spin text-[var(--muted-foreground)]" />
    </div>
  )

  if (!event) return (
    <div className="page-content max-w-2xl">
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
        <p className="text-[var(--muted-foreground)] mb-4">Event not found</p>
        <Link href="/organizer/events">
          <Button>Back to events</Button>
        </Link>
      </div>
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
          
          {/* Image upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Event image {!event.imageUrl && '*'}</label>
            <div
              onClick={() => fileRef.current?.click()}
              className={`rounded-[var(--radius-lg)] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                imagePreview ? 'border-[var(--primary)]/40' : 'border-[var(--border)] hover:border-[var(--primary)]/40'
              }`}
              style={{ minHeight: 200 }}
              role="button"
              tabIndex={0}
              aria-label="Upload event image"
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative w-full h-52">
                  <Image src={imagePreview} alt="Event preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.stopPropagation()
                      setImageFile(null)
                      setImagePreview(event.imageUrl || null)
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--muted)] flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-[var(--muted-foreground)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Click to upload image</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">PNG, JPG, WebP — max 5 MB</p>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleImageChange}
              aria-label="Image file input"
            />
            {imageFile && (
              <p className="text-xs text-[var(--muted-foreground)]">
                New image selected: <span className="font-medium">{imageFile.name}</span>
              </p>
            )}
            {!event.imageUrl && !imageFile && (
              <p className="text-xs text-orange-500">⚠️ Event must have an image before publishing</p>
            )}
          </div>

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
          <Button type="submit" loading={form.formState.isSubmitting || uploading}>
            {uploading ? 'Uploading image...' : 'Save changes'}
          </Button>
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
