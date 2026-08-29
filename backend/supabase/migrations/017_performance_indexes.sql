-- Performance optimization indexes for Phase 8 features
-- These indexes support common query patterns for transfers, notifications, refunds, promo codes, and waitlist

-- ─── TRANSFERS ────────────────────────────────────────────────────────────────

-- Index for querying transfers by sender
CREATE INDEX IF NOT EXISTS idx_transfers_from_user_id 
ON public.transfers(from_user_id);

-- Index for querying transfers by recipient
CREATE INDEX IF NOT EXISTS idx_transfers_to_user_id 
ON public.transfers(to_user_id);

-- Index for checking if a ticket has pending transfers
CREATE INDEX IF NOT EXISTS idx_transfers_ticket_id_status 
ON public.transfers(ticket_id, status) 
WHERE status = 'pending';

-- Index for finding expired transfers (for cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_transfers_expires_at 
ON public.transfers(expires_at) 
WHERE status = 'pending';

-- Composite index for user's incoming transfers by status
CREATE INDEX IF NOT EXISTS idx_transfers_to_user_status 
ON public.transfers(to_user_id, status, created_at DESC);

-- Composite index for user's outgoing transfers by status
CREATE INDEX IF NOT EXISTS idx_transfers_from_user_status 
ON public.transfers(from_user_id, status, created_at DESC);

-- ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

-- Index for user's notifications (most common query)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created 
ON public.notifications(user_id, created_at DESC);

-- Index for unread notifications count
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, read_at) 
WHERE read_at IS NULL;

-- Index for notification type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_user_type 
ON public.notifications(user_id, type, created_at DESC);

-- Index for cleanup of old read notifications (>90 days)
CREATE INDEX IF NOT EXISTS idx_notifications_read_at 
ON public.notifications(read_at) 
WHERE read_at IS NOT NULL;

-- ─── REFUNDS ──────────────────────────────────────────────────────────────────

-- Index for order refunds lookup
CREATE INDEX IF NOT EXISTS idx_refunds_order_id 
ON public.refunds(order_id, created_at DESC);

-- Index for organizer refund queries (via orders)
CREATE INDEX IF NOT EXISTS idx_refunds_created_at 
ON public.refunds(created_at DESC);

-- Index for refund status queries
CREATE INDEX IF NOT EXISTS idx_refunds_status 
ON public.refunds(status, created_at DESC);

-- Index for Stripe refund ID lookup (for webhook processing)
CREATE INDEX IF NOT EXISTS idx_refunds_stripe_refund_id 
ON public.refunds(stripe_refund_id) 
WHERE stripe_refund_id IS NOT NULL;

-- ─── PROMO CODES ──────────────────────────────────────────────────────────────

-- Index for code validation (case-insensitive lookup)
CREATE INDEX IF NOT EXISTS idx_promo_codes_event_code_upper 
ON public.promo_codes(event_id, UPPER(code)) 
WHERE active = true;

-- Index for active promo codes by event
CREATE INDEX IF NOT EXISTS idx_promo_codes_event_active 
ON public.promo_codes(event_id, active, valid_to);

-- Index for finding expired promo codes (cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_promo_codes_valid_to 
ON public.promo_codes(valid_to) 
WHERE active = true;

-- ─── PROMO CODE USAGE ─────────────────────────────────────────────────────────

-- Index for user's promo code usage history
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_user_id 
ON public.promo_code_usage(user_id, created_at DESC);

-- Index for promo code usage analytics
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_promo_code_created 
ON public.promo_code_usage(promo_code_id, created_at DESC);

-- Index for order's promo code
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_order_id 
ON public.promo_code_usage(order_id);

-- ─── WAITLIST ─────────────────────────────────────────────────────────────────

-- Already created in 016_waitlist.sql:
-- - idx_registrations_status
-- - idx_registrations_waitlist (event_id, status, waitlist_position)

-- Additional index for user's waitlist entries
CREATE INDEX IF NOT EXISTS idx_registrations_user_waitlist 
ON public.registrations(user_id, status, created_at DESC) 
WHERE status = 'waitlist';

-- Index for notified waitlist entries (follow-up queries)
CREATE INDEX IF NOT EXISTS idx_registrations_notified_at 
ON public.registrations(event_id, notified_at) 
WHERE status = 'waitlist' AND notified_at IS NOT NULL;

-- ─── EXISTING TABLE OPTIMIZATIONS ────────────────────────────────────────────

-- Orders: Add index for user's order history
CREATE INDEX IF NOT EXISTS idx_orders_user_id_created 
ON public.orders(user_id, created_at DESC);

-- Orders: Add index for organizer order queries (via events)
CREATE INDEX IF NOT EXISTS idx_orders_event_id_status 
ON public.orders(event_id, status, created_at DESC);

-- Tickets: Add index for user's tickets
CREATE INDEX IF NOT EXISTS idx_tickets_user_id 
ON public.tickets(user_id, created_at DESC);

-- Tickets: Add index for event check-in queries
CREATE INDEX IF NOT EXISTS idx_tickets_event_status 
ON public.tickets(event_id, status);

-- Tickets: Add index for QR code lookup (check-in scanning)
CREATE INDEX IF NOT EXISTS idx_tickets_qr_token 
ON public.tickets(qr_token) 
WHERE status != 'cancelled';

-- Events: Add index for organizer's events
CREATE INDEX IF NOT EXISTS idx_events_organizer_status 
ON public.events(organizer_id, status, start_time DESC);

-- Events: Add index for public event discovery
CREATE INDEX IF NOT EXISTS idx_events_published_start 
ON public.events(status, start_time DESC) 
WHERE status = 'published';

-- Registrations: Add index for event registrations
CREATE INDEX IF NOT EXISTS idx_registrations_event_user 
ON public.registrations(event_id, user_id);

-- ─── STATISTICS UPDATE ───────────────────────────────────────────────────────

-- Update table statistics for query planner
ANALYZE public.transfers;
ANALYZE public.notifications;
ANALYZE public.refunds;
ANALYZE public.promo_codes;
ANALYZE public.promo_code_usage;
ANALYZE public.registrations;
ANALYZE public.orders;
ANALYZE public.tickets;
ANALYZE public.events;

-- ─── COMMENTS ─────────────────────────────────────────────────────────────────

COMMENT ON INDEX idx_transfers_from_user_id IS 'Lookup transfers sent by a user';
COMMENT ON INDEX idx_transfers_to_user_id IS 'Lookup transfers received by a user';
COMMENT ON INDEX idx_transfers_ticket_id_status IS 'Check if ticket has pending transfers';
COMMENT ON INDEX idx_transfers_expires_at IS 'Find expired transfers for cleanup';

COMMENT ON INDEX idx_notifications_user_id_created IS 'User notification feed (primary query)';
COMMENT ON INDEX idx_notifications_user_unread IS 'Count unread notifications';
COMMENT ON INDEX idx_notifications_user_type IS 'Filter notifications by type';

COMMENT ON INDEX idx_refunds_order_id IS 'Lookup refunds for an order';
COMMENT ON INDEX idx_refunds_stripe_refund_id IS 'Webhook processing by Stripe refund ID';

COMMENT ON INDEX idx_promo_codes_event_code_upper IS 'Validate promo code (case-insensitive)';
COMMENT ON INDEX idx_promo_code_usage_user_id IS 'User promo code history';

COMMENT ON INDEX idx_registrations_user_waitlist IS 'User waitlist entries';
COMMENT ON INDEX idx_registrations_notified_at IS 'Track notified waitlist users';

COMMENT ON INDEX idx_tickets_qr_token IS 'Fast QR code scanning at check-in';
COMMENT ON INDEX idx_events_published_start IS 'Public event discovery page';
