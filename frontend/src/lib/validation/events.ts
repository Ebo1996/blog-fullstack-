import { z } from 'zod'

// datetime-local inputs produce "YYYY-MM-DDTHH:MM" (no seconds, no timezone)
// We accept that format and coerce it to a full ISO string
const datetimeLocal = z
  .string()
  .min(1, 'Date is required')
  .refine(
    (val) => !isNaN(Date.parse(val)),
    { message: 'Invalid datetime' },
  )
  .transform((val) => new Date(val).toISOString())

export const createEventSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(200, 'Title is too long'),
    description: z
      .string()
      .min(20, 'Description must be at least 20 characters')
      .max(10000, 'Description is too long'),
    category_id: z.string().uuid('Please select a category'),
    venue_name: z.string().min(2, 'Venue name is required').max(200),
    venue_address: z.string().min(5, 'Address is required').max(500),
    city: z.string().min(2, 'City is required').max(100),
    country: z.string().min(2, 'Country is required').max(100),
    start_at: datetimeLocal,
    end_at: datetimeLocal,
    capacity: z.number().int().positive('Capacity must be positive').nullable(),
    image_url: z.string().url().optional().nullable(),
  })
  .refine((data) => new Date(data.end_at) > new Date(data.start_at), {
    message: 'End date must be after start date',
    path: ['end_at'],
  })

export const updateEventSchema = z
  .object({
    title:         z.string().min(3).max(200).optional(),
    description:   z.string().min(20).max(10000).optional(),
    category_id:   z.string().uuid().optional(),
    venue_name:    z.string().min(2).max(200).optional(),
    venue_address: z.string().min(5).max(500).optional(),
    city:          z.string().min(2).max(100).optional(),
    country:       z.string().min(2).max(100).optional(),
    start_at:      datetimeLocal.optional(),
    end_at:        datetimeLocal.optional(),
    capacity:      z.number().int().positive().nullable().optional(),
    image_url:     z.string().url().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.start_at && data.end_at) {
        return new Date(data.end_at) > new Date(data.start_at)
      }
      return true
    },
    {
      message: 'End date must be after start date',
      path: ['end_at'],
    },
  )

export const createTicketTypeSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional().nullable(),
    price: z
      .number()
      .int('Price must be in whole cents')
      .min(0, 'Price cannot be negative')
      .max(100_000_00, 'Price is too high'),
    currency: z.string().length(3, 'Currency must be 3 characters').default('USD'),
    quantity: z.number().int().positive('Quantity must be positive').max(100000),
    sales_start_at: datetimeLocal.optional().nullable(),
    sales_end_at: datetimeLocal.optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.sales_start_at && data.sales_end_at) {
        return new Date(data.sales_end_at) > new Date(data.sales_start_at)
      }
      return true
    },
    {
      message: 'Sales end must be after sales start',
      path: ['sales_end_at'],
    },
  )

export const checkoutSchema = z.object({
  eventId: z.string().uuid(),
  items: z
    .array(
      z.object({
        ticketTypeId: z.string().uuid(),
        quantity: z.number().int().positive().max(20),
      }),
    )
    .min(1, 'Select at least one ticket')
    .max(10, 'Too many ticket types in one order'),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type CreateTicketTypeInput = z.infer<typeof createTicketTypeSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
