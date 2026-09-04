'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { ChevronRight, ChevronLeft, Check, Upload, X, ImageIcon, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { eventsApi } from '@/lib/api/events'
import apiClient from '@/lib/api/client'

const STEPS = ['Basic Info', 'Date & Time', 'Venue', 'Image', 'Ticket Types', 'Review & Publish']

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(10000),
  shortDescription: z.string().max(300).optional(),
  type: z.enum(['in_person', 'online', 'hybrid']).default('in_person'),
  startAt: z.string().min(1, 'Start date is required'),
  endAt: z.string().min(1, 'End date is required'),
  venue: z.object({
    name: z.string().min(1, 'Venue name is required'),
    address: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    country: z.string().default('Ethiopia'),
    onlineUrl: z.string().optional(),
  }),
  capacity: z.number().min(1).optional(),
  currency: z.string().default('ETB'),
  tags: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface TicketType {
  name: string
  description: string
  price: number
  quantity: number
  minPerOrder: number
  maxPerOrder: number
  currency: string
}

export default function CreateEventPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [savedEventId, setSavedEventId] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  
  // Ticket types state
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { name: 'General Admission', description: '', price: 0, quantity: 100, minPerOrder: 1, maxPerOrder: 10, currency: 'ETB' }
  ])

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'in_person', currency: 'ETB', venue: { country: 'Ethiopia' } },
  })

  const values = watch()

  const stepFields: Record<number, (keyof FormData)[]> = {
    0: ['title', 'description', 'shortDescription'],
    1: ['startAt', 'endAt'],
    2: ['venue'],
    3: [],
    4: [],
    5: [],
  }

  const next = async () => {
    const fields = stepFields[step]
    const valid = fields.length === 0 || await trigger(fields)
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const back = () => setStep((s) => Math.max(s - 1, 0))

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const uploadImage = async (eventId: string): Promise<string | null> => {
    if (!imageFile) return null
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', imageFile)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/storage/upload/event/${eventId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` },
          body: formData,
        }
      )
      if (!res.ok) throw new Error('Upload failed')
      const json = await res.json()
      return json.data?.url ?? null
    } catch {
      toast.error('Image upload failed — event saved without image')
      return null
    } finally {
      setUploading(false)
    }
  }

  const createTicketTypes = async (eventId: string) => {
    if (ticketTypes.length === 0) return
    
    const promises = ticketTypes.map((tt) =>
      apiClient.post(`/events/${eventId}/ticket-types`, tt)
    )
    
    try {
      await Promise.all(promises)
      toast.success(`${ticketTypes.length} ticket type(s) created`)
    } catch (err) {
      toast.error('Some ticket types failed to create. You can add them later.')
    }
  }

  const onSubmit = async (data: FormData, publish = false) => {
    setSubmitting(true)
    try {
      const tags = data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
      const payload = { ...data, tags, capacity: data.capacity ? Number(data.capacity) : undefined }
      const res = await eventsApi.create(payload)
      const eventId = res.data._id
      setSavedEventId(eventId)

      // Upload image if one was selected
      if (imageFile) {
        const imageUrl = await uploadImage(eventId)
        if (imageUrl) {
          // Update event with imageUrl
          await apiClient.patch(`/events/${eventId}`, { imageUrl })
        }
      }

      // Create ticket types
      await createTicketTypes(eventId)

      if (publish) {
        if (ticketTypes.length === 0) {
          toast.error('At least one ticket type is required. Event saved as draft.')
          router.push(`/organizer/events/${eventId}/edit`)
        } else {
          await eventsApi.publish(eventId)
          toast.success('Event published! 🎉')
          router.push('/organizer/events')
        }
      } else {
        toast.success('Event saved as draft')
        router.push(`/organizer/events/${eventId}/edit`)
      }
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create event')
    } finally {
      setSubmitting(false)
    }
  }

  // Ticket type management
  const addTicketType = () => {
    setTicketTypes([...ticketTypes, {
      name: '',
      description: '',
      price: 0,
      quantity: 100,
      minPerOrder: 1,
      maxPerOrder: 10,
      currency: values.currency || 'ETB',
    }])
  }

  const removeTicketType = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index))
  }

  const updateTicketType = (index: number, field: keyof TicketType, value: any) => {
    setTicketTypes(ticketTypes.map((tt, i) =>
      i === index ? { ...tt, [field]: value } : tt
    ))
  }

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">ORGANIZER</div>
          <h1>Create event</h1>
        </div>
      </header>

      <div className="page-content max-w-2xl">
        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' :
                i === step ? 'border-2 border-[var(--primary)] text-[var(--primary)]' :
                'border border-[var(--border)] text-[var(--muted-foreground)]'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'font-semibold' : 'text-[var(--muted-foreground)]'} hidden sm:inline`}>{s}</span>
              {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-[var(--border)] flex-shrink-0" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit((d) => onSubmit(d, false))}>
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-serif text-xl">Basic information</h2>
              <Input label="Event title *" placeholder="e.g. Addis Tech Summit 2027" error={errors.title?.message} {...register('title')} />
              <Textarea label="Description *" placeholder="Describe your event in detail…" rows={6} error={errors.description?.message} {...register('description')} />
              <Input label="Short description" placeholder="One sentence summary (shown in cards)" error={errors.shortDescription?.message} {...register('shortDescription')} />
              <div className="input-group">
                <span className="input-label">Event type</span>
                <div className="grid grid-cols-3 gap-2">
                  {[['in_person', '📍 In-person'], ['online', '💻 Online'], ['hybrid', '🌐 Hybrid']].map(([val, label]) => (
                    <label key={val} className={`flex items-center justify-center py-2.5 rounded-[var(--radius-sm)] border text-xs cursor-pointer transition-colors ${values.type === val ? 'border-[var(--primary)] text-[var(--primary)] bg-[rgba(215,243,106,0.06)]' : 'border-[var(--border)] text-[var(--muted-foreground)]'}`}>
                      <input type="radio" value={val} className="sr-only" {...register('type')} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <Input label="Tags (comma-separated)" placeholder="music, conference, networking" {...register('tags')} />
            </div>
          )}

          {/* Step 1: Date & Time */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-serif text-xl">Date & time</h2>
              <Input label="Start date & time *" type="datetime-local" error={errors.startAt?.message} {...register('startAt')} />
              <Input label="End date & time *" type="datetime-local" error={errors.endAt?.message} {...register('endAt')} />
              <Input label="Currency" placeholder="ETB" {...register('currency')} />
              <Input label="Capacity (leave blank for unlimited)" type="number" placeholder="500" {...register('capacity', { valueAsNumber: true })} />
            </div>
          )}

          {/* Step 2: Venue */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-serif text-xl">Venue</h2>
              <Input label="Venue name *" placeholder="Millennium Hall" error={(errors.venue as any)?.name?.message} {...register('venue.name')} />
              <Input label="Address" placeholder="123 Main Street" {...register('venue.address')} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="City *" placeholder="Addis Ababa" error={(errors.venue as any)?.city?.message} {...register('venue.city')} />
                <Input label="Country" placeholder="Ethiopia" {...register('venue.country')} />
              </div>
              {values.type !== 'in_person' && (
                <Input label="Online URL" placeholder="https://zoom.us/j/..." {...register('venue.onlineUrl')} />
              )}
            </div>
          )}

          {/* Step 3: Event Image */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-serif text-xl">Event image</h2>
              <p className="text-xs text-[var(--muted-foreground)]">
                Upload a high-quality image for your event. Recommended size: 1200×630px. Max 5 MB. Required to publish.
              </p>

              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                className={`rounded-[var(--radius-lg)] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden ${
                  imagePreview ? 'border-[var(--primary)]/40' : 'border-[var(--border)] hover:border-[var(--primary)]/40'
                }`}
                style={{ minHeight: 240 }}
                role="button"
                tabIndex={0}
                aria-label="Upload event image"
                onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="relative w-full h-60">
                    <Image src={imagePreview} alt="Event preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null) }}
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
                    <span className="btn btn-outline btn-sm gap-2 pointer-events-none">
                      <Upload className="w-3.5 h-3.5" /> Choose file
                    </span>
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
                  Selected: <span className="font-medium text-[var(--foreground)]">{imageFile.name}</span> ({(imageFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
              {!imageFile && (
                <p className="text-xs text-[var(--muted-foreground)]">You can skip this step and add an image later. An image is required to publish.</p>
              )}
            </div>
          )}

          {/* Step 4: Ticket Types - COMPLETELY REWRITTEN */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-serif text-xl">Ticket types</h2>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Define ticket types for your event. You can also add more later from the event management page.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTicketType}
                >
                  <Plus className="w-3.5 h-3.5" /> Add type
                </Button>
              </div>

              {ticketTypes.length === 0 && (
                <div className="card p-6 text-center space-y-3">
                  <p className="text-sm text-[var(--muted-foreground)]">
                    No ticket types yet. Click "Add type" to create your first one.
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {ticketTypes.map((tt, index) => (
                  <div key={index} className="panel space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="eyebrow">TICKET TYPE #{index + 1}</span>
                      {ticketTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicketType(index)}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <Input
                        label="Name *"
                        placeholder="e.g. General Admission, VIP, Early Bird"
                        value={tt.name}
                        onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                      />
                      
                      <Textarea
                        label="Description"
                        placeholder="Optional description of what's included..."
                        rows={2}
                        value={tt.description}
                        onChange={(e) => updateTicketType(index, 'description', e.target.value)}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Price *"
                          type="number"
                          placeholder="0"
                          min="0"
                          step="0.01"
                          value={tt.price}
                          onChange={(e) => updateTicketType(index, 'price', parseFloat(e.target.value) || 0)}
                        />
                        <Input
                          label="Quantity *"
                          type="number"
                          placeholder="100"
                          min="1"
                          value={tt.quantity}
                          onChange={(e) => updateTicketType(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          label="Min per order"
                          type="number"
                          placeholder="1"
                          min="1"
                          value={tt.minPerOrder}
                          onChange={(e) => updateTicketType(index, 'minPerOrder', parseInt(e.target.value) || 1)}
                        />
                        <Input
                          label="Max per order"
                          type="number"
                          placeholder="10"
                          min="1"
                          max="100"
                          value={tt.maxPerOrder}
                          onChange={(e) => updateTicketType(index, 'maxPerOrder', parseInt(e.target.value) || 10)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {ticketTypes.length > 0 && (
                <div className="card p-4" style={{ background: 'rgba(215,243,106,0.05)', borderColor: 'var(--primary)' }}>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    💡 <strong>{ticketTypes.length} ticket type(s)</strong> will be created when you save the event.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review & Publish */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-serif text-xl">Review & publish</h2>
              <div className="panel space-y-3 text-sm">
                <ReviewRow label="Title" value={values.title} />
                <ReviewRow label="Type" value={values.type?.replace('_', '-')} />
                <ReviewRow label="Start" value={values.startAt} />
                <ReviewRow label="End" value={values.endAt} />
                <ReviewRow label="Venue" value={values.venue ? `${values.venue.name}, ${values.venue.city}` : '—'} />
                <ReviewRow label="Currency" value={values.currency ?? 'ETB'} />
                <ReviewRow label="Image" value={imageFile ? imageFile.name : 'No image selected'} />
                <ReviewRow label="Ticket types" value={`${ticketTypes.length} type(s)`} />
              </div>
              
              {!imageFile && !imagePreview && (
                <div className="card p-4" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: '#f59e0b' }}>
                  <p className="text-xs flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    <span><strong>Event must have an image before publishing.</strong> Upload an image in step 4 or save as draft and add it later.</span>
                  </p>
                </div>
              )}
              
              {ticketTypes.length === 0 && (
                <div className="card p-4 border-[var(--warning)]/40" style={{ borderColor: '#f59e0b55' }}>
                  <p className="text-xs text-yellow-400">⚠️ No ticket types added. Required to publish.</p>
                </div>
              )}
              
              <p className="text-xs text-[var(--muted-foreground)]">
                Save as draft to continue editing, or publish immediately to make the event visible.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-10 pt-6 border-t border-[var(--border)]">
            <Button type="button" variant="outline" onClick={back} disabled={step === 0}>
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={next}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button type="submit" variant="outline" loading={submitting || uploading}>
                  Save as draft
                </Button>
                <Button
                  type="button"
                  loading={submitting || uploading}
                  onClick={handleSubmit((d) => onSubmit(d, true))}
                  disabled={!imageFile && !imagePreview}
                  title={!imageFile && !imagePreview ? 'Event must have an image before publishing' : undefined}
                >
                  Publish event 🚀
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  )
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between border-b border-[var(--border)] pb-2 last:border-0 last:pb-0">
      <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
      <span className="text-xs font-medium truncate max-w-[200px]">{value || '—'}</span>
    </div>
  )
}
