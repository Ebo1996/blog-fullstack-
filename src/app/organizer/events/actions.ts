'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  createEvent,
  updateEvent,
  deleteEvent,
  createTicketType,
  updateTicketType,
  deleteTicketType,
  type CreateEventInput,
  type CreateTicketTypeInput,
} from '@/services/organizer'
import {
  createEventSchema,
  updateEventSchema,
  createTicketTypeSchema,
} from '@/lib/validation/events'
import type { EventStatus } from '@/types/database'

export interface ActionResult {
  error?: string
  success?: boolean
}

// ─── Auth helper ──────────────────────────────────────────────────────────────
async function requireOrganizer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (!profile || profile.role === 'attendee') redirect('/dashboard')
  return user.id
}

// ─── CREATE EVENT ─────────────────────────────────────────────────────────────
export async function createEventAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const organizerId = await requireOrganizer()

  const raw = {
    title:         formData.get('title'),
    description:   formData.get('description'),
    category_id:   formData.get('category_id'),
    venue_name:    formData.get('venue_name'),
    venue_address: formData.get('venue_address'),
    city:          formData.get('city'),
    country:       formData.get('country'),
    start_at:      formData.get('start_at'),
    end_at:        formData.get('end_at'),
    capacity:      formData.get('capacity')
      ? Number(formData.get('capacity'))
      : null,
    image_url:     formData.get('image_url') || null,
  }

  const parsed = createEventSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await createEvent(parsed.data as CreateEventInput, organizerId)
  if (!result) return { error: 'Could not create event. Please try again.' }

  revalidatePath('/organizer/events')
  redirect(`/organizer/events/${result.id}`)
}

// ─── UPDATE EVENT ─────────────────────────────────────────────────────────────
export async function updateEventAction(
  eventId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const organizerId = await requireOrganizer()

  const raw = {
    title:         formData.get('title') || undefined,
    description:   formData.get('description') || undefined,
    category_id:   formData.get('category_id') || undefined,
    venue_name:    formData.get('venue_name') || undefined,
    venue_address: formData.get('venue_address') || undefined,
    city:          formData.get('city') || undefined,
    country:       formData.get('country') || undefined,
    start_at:      formData.get('start_at') || undefined,
    end_at:        formData.get('end_at') || undefined,
    capacity:      formData.get('capacity')
      ? Number(formData.get('capacity'))
      : undefined,
    image_url:     formData.get('image_url') || null,
  }

  const parsed = updateEventSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const ok = await updateEvent(eventId, organizerId, parsed.data as Partial<CreateEventInput>)
  if (!ok) return { error: 'Could not update event. Please try again.' }

  revalidatePath(`/organizer/events/${eventId}`)
  revalidatePath(`/organizer/events/${eventId}/edit`)
  return { success: true }
}

// ─── PUBLISH / UNPUBLISH / CANCEL ─────────────────────────────────────────────
export async function setEventStatusAction(
  eventId: string,
  status: EventStatus,
): Promise<ActionResult> {
  const organizerId = await requireOrganizer()
  const ok = await updateEvent(eventId, organizerId, { status })
  if (!ok) return { error: `Could not ${status} event.` }
  revalidatePath(`/organizer/events/${eventId}`)
  revalidatePath('/organizer/events')
  revalidatePath('/organizer')
  return { success: true }
}

// ─── DELETE EVENT (draft only) ────────────────────────────────────────────────
export async function deleteEventAction(eventId: string): Promise<ActionResult> {
  const organizerId = await requireOrganizer()
  const ok = await deleteEvent(eventId, organizerId)
  if (!ok) return { error: 'Could not delete event. Only draft events can be deleted.' }
  revalidatePath('/organizer/events')
  redirect('/organizer/events')
}

// ─── CREATE TICKET TYPE ───────────────────────────────────────────────────────
export async function createTicketTypeAction(
  eventId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const organizerId = await requireOrganizer()

  const raw = {
    name:           formData.get('name'),
    description:    formData.get('description') || null,
    price:          Math.round(Number(formData.get('price') ?? 0) * 100), // dollars → cents
    currency:       formData.get('currency') || 'USD',
    quantity:       Number(formData.get('quantity') ?? 0),
    sales_start_at: formData.get('sales_start_at') || null,
    sales_end_at:   formData.get('sales_end_at') || null,
  }

  const parsed = createTicketTypeSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  const result = await createTicketType(
    eventId,
    organizerId,
    parsed.data as CreateTicketTypeInput,
  )
  if (!result) return { error: 'Could not create ticket type.' }

  revalidatePath(`/organizer/events/${eventId}/tickets`)
  return { success: true }
}

// ─── UPDATE TICKET TYPE ───────────────────────────────────────────────────────
export async function updateTicketTypeAction(
  ticketTypeId: string,
  eventId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const organizerId = await requireOrganizer()

  const raw = {
    name:           formData.get('name') || undefined,
    description:    formData.get('description') || null,
    price:          formData.get('price')
      ? Math.round(Number(formData.get('price')) * 100)
      : undefined,
    currency:       formData.get('currency') || undefined,
    quantity:       formData.get('quantity')
      ? Number(formData.get('quantity'))
      : undefined,
    sales_start_at: formData.get('sales_start_at') || null,
    sales_end_at:   formData.get('sales_end_at') || null,
  }

  const ok = await updateTicketType(ticketTypeId, organizerId, raw as Partial<CreateTicketTypeInput>)
  if (!ok) return { error: 'Could not update ticket type.' }

  revalidatePath(`/organizer/events/${eventId}/tickets`)
  return { success: true }
}

// ─── DELETE TICKET TYPE ───────────────────────────────────────────────────────
export async function deleteTicketTypeAction(
  ticketTypeId: string,
  eventId: string,
): Promise<ActionResult> {
  const organizerId = await requireOrganizer()
  const result = await deleteTicketType(ticketTypeId, organizerId)
  if (!result.success) return { error: result.error }
  revalidatePath(`/organizer/events/${eventId}/tickets`)
  return { success: true }
}
