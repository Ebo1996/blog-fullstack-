# Northstar API Documentation

Complete reference for all database RPC functions, service layer APIs, and webhook endpoints.

---

## Table of Contents

- [Database RPC Functions](#database-rpc-functions)
- [Service Layer APIs](#service-layer-apis)
- [Webhook Endpoints](#webhook-endpoints)
- [Authentication](#authentication)
- [Error Handling](#error-handling)

---

## Database RPC Functions

PostgreSQL functions callable via Supabase client using `.rpc()`.

### Ticket Management

#### `purchase_tickets`

Creates tickets and order atomically with inventory locking.

**Parameters:**
```typescript
{
  p_user_id: string           // UUID of purchasing user
  p_event_id: string          // UUID of event
  p_ticket_type_id: string    // UUID of ticket type
  p_quantity: number          // Number of tickets (1-10)
  p_payment_reference: string  // Chapa payment reference ID
}
```

**Returns:**
```typescript
{
  success: boolean
  order_id: string | null
  ticket_ids: string[] | null
  error: string | null
}
```

**Errors:**
- `"Sold out"` - Not enough tickets available
- `"Ticket type not found"` - Invalid ticket_type_id
- `"Event not published"` - Event not available for purchase

**Example:**
```typescript
const { data } = await supabase.rpc('purchase_tickets', {
  p_user_id: userId,
  p_event_id: eventId,
  p_ticket_type_id: ticketTypeId,
  p_quantity: 2,
  p_payment_reference: 'chapa_ref_abc123',
})
```

---

#### `validate_and_checkin`

Validates QR code and checks in attendee atomically.

**Parameters:**
```typescript
{
  p_qr_token: string          // 48-character QR token
  p_event_id: string          // UUID of event
  p_organizer_id: string      // UUID of organizer (verification)
}
```

**Returns:**
```typescript
{
  success: boolean
  ticket_id: string | null
  attendee_name: string | null
  ticket_type: string | null
  already_checked_in: boolean
  error: string | null
}
```

**Errors:**
- `"Invalid ticket"` - QR token not found or cancelled
- `"Wrong event"` - Ticket is for different event
- `"Not authorized"` - Organizer doesn't own this event

**Example:**
```typescript
const { data } = await supabase.rpc('validate_and_checkin', {
  p_qr_token: qrCode,
  p_event_id: eventId,
  p_organizer_id: organizerId,
})
```

---

### Transfer Management

#### `accept_ticket_transfer`

Accepts a pending ticket transfer atomically.

**Parameters:**
```typescript
{
  p_transfer_id: string       // UUID of transfer
  p_user_id: string           // UUID of accepting user
}
```

**Returns:**
```typescript
{
  success: boolean
  error: string | null
}
```

**Errors:**
- `"Transfer not found"` - Invalid transfer_id
- `"Not authorized"` - User is not the recipient
- `"Transfer expired"` - Transfer past expiry date
- `"Transfer already processed"` - Status is not 'pending'

---

### Promo Code Management

#### `validate_promo_code`

Validates promo code and calculates discount.

**Parameters:**
```typescript
{
  p_code: string              // Promo code (case-insensitive)
  p_event_id: string          // UUID of event
  p_ticket_count: number      // Number of tickets
  p_subtotal: number          // Subtotal in cents
}
```

**Returns:**
```typescript
{
  valid: boolean
  promo_code_id: string | null
  discount_amount: number     // Discount in cents
  error: string | null
}
```

**Errors:**
- `"Invalid promo code"` - Code not found or inactive
- `"Promo code not yet valid"` - Before valid_from date
- `"Promo code has expired"` - After valid_to date
- `"Promo code has reached its usage limit"` - Usage limit exceeded
- `"Minimum X tickets required"` - Below min_tickets threshold

**Business Rules:**
- Percentage discounts: `floor(subtotal * discount_value / 100)`
- Fixed discounts: `discount_value` (in cents)
- `max_discount` cap applies to percentage codes
- Discount cannot exceed subtotal

---

#### `increment_promo_code_usage`

Increments the used_count for a promo code.

**Parameters:**
```typescript
{
  p_promo_code_id: string     // UUID of promo code
}
```

**Returns:** `void`

**Note:** Called after successful order creation with promo code.

---

### Waitlist Management

#### `add_to_waitlist`

Adds user to event waitlist with automatic position assignment.

**Parameters:**
```typescript
{
  p_event_id: string          // UUID of event
  p_user_id: string           // UUID of user
  p_ticket_type_id: string    // UUID of ticket type
  p_quantity: number          // Number of tickets desired
}
```

**Returns:**
```typescript
{
  success: boolean
  registration_id: string | null
  position: number            // Position in waitlist (1-indexed)
  error: string | null
}
```

**Errors:**
- `"Already on waitlist for this event"` - User already has waitlist entry
- `"Already registered for this event"` - User has active tickets

---

#### `get_event_waitlist`

Retrieves waitlist entries for an event, ordered by position.

**Parameters:**
```typescript
{
  p_event_id: string          // UUID of event
  p_limit: number | null      // Optional limit (default: all)
}
```

**Returns:**
```typescript
Array<{
  id: string
  user_id: string
  user_email: string
  user_name: string
  ticket_type_id: string
  ticket_type_name: string
  quantity: number
  waitlist_position: number
  notified_at: string | null
  created_at: string
}>
```

---

#### `mark_waitlist_notified`

Marks a waitlist entry as notified.

**Parameters:**
```typescript
{
  p_registration_id: string   // UUID of waitlist registration
}
```

**Returns:** `void`

---

#### `convert_waitlist_to_active`

Converts waitlist entry to active registration after payment.

**Parameters:**
```typescript
{
  p_registration_id: string   // UUID of waitlist registration
  p_order_id: string          // UUID of order
}
```

**Returns:**
```typescript
boolean  // true if successful, false if no availability
```

**Business Rules:**
- Checks ticket availability before conversion
- Updates ticket_types.sold count
- Removes waitlist_position and status

---

#### `remove_from_waitlist`

Removes user from waitlist and reorders remaining entries.

**Parameters:**
```typescript
{
  p_registration_id: string   // UUID of waitlist registration
  p_user_id: string           // UUID of user (verification)
}
```

**Returns:**
```typescript
boolean  // true if removed, false if not found
```

**Side Effect:** Decrements waitlist_position for all users after removed position.

---

### User Management

#### `admin_set_user_role`

Admin-only function to change user role.

**Parameters:**
```typescript
{
  p_user_id: string           // UUID of user
  p_new_role: 'attendee' | 'organizer' | 'admin'
}
```

**Returns:**
```typescript
boolean  // true if successful
```

**Security:** Only callable with service role key (server-side only).

---

## Service Layer APIs

TypeScript service functions in `frontend/src/services/`.

### Transfers (`transfers.ts`)

#### `createTransfer`

Initiates a ticket transfer to another user.

**Signature:**
```typescript
async function createTransfer(
  ticketId: string,
  fromUserId: string,
  toEmail: string,
): Promise<{ success: boolean; transferId?: string; error?: string }>
```

**Validations:**
- Ticket must be owned by fromUserId
- Ticket status must be 'active'
- No pending transfers for this ticket
- Recipient must have account (looked up via auth.admin.listUsers)
- Cannot transfer to self

**Side Effects:**
- Creates transfer record with 7-day expiry
- Creates notification for recipient

---

#### `acceptTransfer`

Accepts a pending transfer.

**Signature:**
```typescript
async function acceptTransfer(
  transferId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }>
```

**Atomic Operations:**
1. Update transfer status to 'accepted'
2. Transfer ticket ownership
3. Create notifications for both parties

---

#### `rejectTransfer` / `cancelTransfer`

Rejects or cancels a transfer.

**Signatures:**
```typescript
async function rejectTransfer(
  transferId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }>

async function cancelTransfer(
  transferId: string,
  userId: string,
): Promise<{ success: boolean; error?: string }>
```

**Side Effects:** Creates notifications for both parties.

---

### Notifications (`notifications.ts`)

#### `createNotification`

Creates a notification for a user.

**Signature:**
```typescript
async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData,
): Promise<boolean>
```

**Notification Types:**
- `ticket_purchased`
- `payment_completed`
- `payment_failed`
- `event_reminder`
- `ticket_transfer_received`
- `ticket_transfer_accepted`
- `ticket_transfer_rejected`
- `ticket_transfer_cancelled`
- `event_updated`
- `event_cancelled`
- `waitlist_joined`
- `waitlist_available`

---

#### Helper Functions

```typescript
// Notify on order completion
notifyOrderCompleted(userId: string, orderId: string, eventTitle: string): Promise<void>

// Notify on ticket creation
notifyTicketsCreated(userId: string, ticketCount: number, eventTitle: string): Promise<void>

// Event reminders (1 day, 1 hour before)
notifyEventReminder(userId: string, eventId: string, eventTitle: string, timeframe: '1_day' | '1_hour'): Promise<void>

// Event update notification
notifyEventUpdated(userId: string, eventId: string, eventTitle: string): Promise<void>

// Event cancellation notification
notifyEventCancelled(userId: string, eventId: string, eventTitle: string): Promise<void>
```

---

### Refunds (`refunds.ts`)

#### `createRefund`

Processes a refund via Chapa and updates order.

**Signature:**
```typescript
async function createRefund(
  orderId: string,
  amount: number,
  reason: string,
  organizerId: string,
): Promise<{ success: boolean; refundId?: string; error?: string }>
```

**Process:**
1. Validate organizer owns event
2. Validate order is paid and refundable
3. Create Chapa refund via Chapa API
4. Update order status (refunded/partially_refunded)
5. Cancel tickets if full refund
6. Create refund audit record
7. Notify customer

**Business Rules:**
- Full refund = 100% of order total → cancels all tickets
- Partial refund → order remains active
- Cannot refund more than remaining refundable amount

---

#### `canRefundOrder`

Checks if an order can be refunded.

**Signature:**
```typescript
async function canRefundOrder(
  orderId: string,
  organizerId: string,
): Promise<{ canRefund: boolean; remainingAmount: number; error?: string }>
```

**Returns:** Remaining refundable amount in cents.

---

### Promo Codes (`promo-codes.ts`)

#### `createPromoCode`

Creates a new promo code for an event.

**Signature:**
```typescript
async function createPromoCode(
  input: CreatePromoCodeInput,
  organizerId: string,
): Promise<{ success: boolean; promoCode?: PromoCode; error?: string }>

interface CreatePromoCodeInput {
  event_id: string
  code: string                  // Alphanumeric + dashes/underscores
  discount_type: 'percentage' | 'fixed'
  discount_value: number        // 1-100 for percentage, cents for fixed
  valid_from: string           // ISO 8601 datetime
  valid_to: string             // ISO 8601 datetime
  usage_limit?: number | null
  min_tickets?: number | null
  max_discount?: number | null  // Cap for percentage discounts (cents)
}
```

**Validations:**
- Code format: `/^[A-Z0-9_-]+$/i`, 3-50 characters
- Percentage: 1-100
- Fixed: >= 1 cent
- valid_to > valid_from
- Unique code per event

---

#### `validatePromoCode`

Validates a promo code and calculates discount.

**Signature:**
```typescript
async function validatePromoCode(
  code: string,
  eventId: string,
  ticketCount: number,
  subtotal: number,
): Promise<PromoCodeValidation>

interface PromoCodeValidation {
  valid: boolean
  promo_code_id: string | null
  discount_amount: number
  error: string | null
}
```

**Usage:** Call before checkout to validate and display discount.

---

#### `recordPromoCodeUsage`

Records promo code usage after successful order.

**Signature:**
```typescript
async function recordPromoCodeUsage(
  promoCodeId: string,
  orderId: string,
  userId: string,
  discountAmount: number,
): Promise<boolean>
```

**Side Effects:**
- Inserts promo_code_usage record
- Increments promo_codes.used_count

---

### Waitlist (`waitlist.ts`)

#### `joinWaitlist`

Adds user to event waitlist.

**Signature:**
```typescript
async function joinWaitlist(
  eventId: string,
  userId: string,
  ticketTypeId: string,
  quantity: number = 1,
): Promise<WaitlistResult>

interface WaitlistResult {
  success: boolean
  registration_id: string | null
  position: number
  error: string | null
}
```

**Side Effect:** Creates 'waitlist_joined' notification.

---

#### `notifyWaitlistUsers`

Notifies next N users in waitlist when tickets become available.

**Signature:**
```typescript
async function notifyWaitlistUsers(
  eventId: string,
  ticketTypeId: string,
  availableSlots: number,
): Promise<number>  // Returns count of notified users
```

**Process:**
1. Fetch next N unnotified waitlist entries
2. Create 'waitlist_available' notifications
3. Mark entries as notified
4. Return count

**Notification Link:** `/events/{slug}/checkout?waitlist={registration_id}`

---

#### `checkEventAvailability`

Checks ticket availability for an event.

**Signature:**
```typescript
async function checkEventAvailability(
  eventId: string,
): Promise<{
  available: boolean
  soldOut: boolean
  ticketTypes: Array<{ id: string; name: string; available: number }>
}>
```

---

## Webhook Endpoints

### Chapa Webhooks

#### `POST /api/webhooks/chapa`

Handles Chapa webhook events.

**Headers:**
```
Content-Type: application/json
```

**Events Handled:**

##### `checkout.session.completed`

Triggered when payment succeeds.

**Process:**
1. Verify webhook signature
2. Extract metadata: `{ userId, eventId, ticketTypeId, quantity }`
3. Call `purchase_tickets()` RPC
4. Create notifications via RPC
5. Return 200 OK

**Metadata Schema:**
```typescript
{
  userId: string
  eventId: string
  ticketTypeId: string
  quantity: string  // Numeric string
}
```

##### `payment_intent.payment_failed`

Triggered when payment fails.

**Process:**
1. Extract customer email
2. Log failure
3. Create 'payment_failed' notification
4. Return 200 OK

---

**Security:**
- Verified via Chapa payment verification API
- Service role key used for database operations

**Error Responses:**
- `400` - Webhook signature verification failed
- `500` - Internal server error (logged)

**Example Webhook Test:**
```bash
# Test locally with ngrok
ngrok http 3000
# Then set webhook URL in Chapa dashboard to: https://your-ngrok-url.ngrok.io/api/webhooks/chapa
```

---

## Authentication

All service layer functions expect authenticated users. Authentication is handled via Supabase Auth.

### Server-Side Auth

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  redirect('/auth/signin')
}
```

### Client-Side Auth

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
```

### Service Role Client

For admin operations (server-only):

```typescript
import { createServiceClient } from '@/lib/supabase/service'

const service = createServiceClient()
// Has elevated permissions, bypasses RLS
```

**⚠️ Security:** Service client is guarded by `typeof window` check. Never expose to client.

---

## Error Handling

### Standard Error Response

All service functions return:

```typescript
{
  success: boolean
  error?: string
  // ... additional fields on success
}
```

### Error Categories

**Validation Errors:**
- `"Invalid input"` - Zod validation failed
- `"Required field missing"` - Missing required parameter
- `"Invalid format"` - Format validation failed

**Authorization Errors:**
- `"Not authenticated"` - User not logged in
- `"Not authorized"` - User lacks permission
- `"Forbidden"` - RLS policy denied access

**Business Logic Errors:**
- `"Sold out"` - No tickets available
- `"Already exists"` - Duplicate resource
- `"Cannot modify"` - Resource locked or immutable

**External Service Errors:**
- `"Payment failed"` - Chapa payment error
- `"Webhook verification failed"` - Invalid Chapa tx_ref
- `"Email delivery failed"` - Notification service error

### Error Logging

All service functions log errors via `console.error` with context:

```typescript
console.error('[service-name] functionName:', error)
```

**Production:** Replace with structured logging service (Sentry, Datadog, etc.)

---

## Rate Limits

**Recommended Limits:**

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth (login/register) | 5 requests | 15 minutes |
| Webhooks | 100 requests | 1 minute |
| Checkout | 10 requests | 1 minute per user |
| Promo validation | 20 requests | 1 minute per user |
| Transfers | 10 requests | 1 hour per user |

**Implementation:** See Task 4 (Rate Limiting) in Phase 9.

---

## Database Schema Reference

For complete table schemas, see:
- `backend/supabase/migrations/*.sql`
- `frontend/src/types/database.ts`

Key tables:
- `events`, `ticket_types`, `orders`, `tickets`
- `transfers`, `notifications`, `refunds`
- `promo_codes`, `promo_code_usage`
- `registrations` (includes waitlist)

---

## Support

For API questions or issues:
1. Check error logs: `console.error` output
2. Review RLS policies: `backend/supabase/migrations/011_rls.sql`
3. Test with seed data: `backend/supabase/seed.sql`
4. Verify webhook delivery in Chapa Dashboard

---

**Last Updated:** Phase 9, Task 2
**Version:** 1.0.0
