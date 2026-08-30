-- ============================================================================
-- Migration: Rename Stripe-specific columns to generic payment columns
-- ============================================================================
-- Purpose: Update column names from Stripe-specific to payment-gateway-agnostic
--          Now using Chapa (Ethiopian payment gateway) instead of Stripe
-- Date: 2026-08-30
-- ============================================================================

BEGIN;

-- ─── Orders table ─────────────────────────────────────────────────────────────

-- Rename stripe_checkout_session_id -> payment_tx_ref
-- This stores the transaction reference (Chapa tx_ref, was Stripe session ID)
ALTER TABLE orders 
  RENAME COLUMN stripe_checkout_session_id TO payment_tx_ref;

-- Rename stripe_payment_intent_id -> payment_reference
-- This stores the payment gateway's reference ID (Chapa reference, was Stripe payment intent)
ALTER TABLE orders 
  RENAME COLUMN stripe_payment_intent_id TO payment_reference;

-- Update any indexes that reference the old column names
DROP INDEX IF EXISTS idx_orders_stripe_session;
CREATE INDEX idx_orders_payment_tx_ref ON orders(payment_tx_ref) WHERE payment_tx_ref IS NOT NULL;

-- ─── Refunds table ────────────────────────────────────────────────────────────

-- Rename stripe_refund_id -> payment_refund_id
-- This stores the refund reference from the payment gateway
ALTER TABLE refunds 
  RENAME COLUMN stripe_refund_id TO payment_refund_id;

-- ─── Add comments for clarity ─────────────────────────────────────────────────

COMMENT ON COLUMN orders.payment_tx_ref IS 
  'Transaction reference from payment gateway (Chapa tx_ref). Used for payment verification and refunds.';

COMMENT ON COLUMN orders.payment_reference IS 
  'Payment gateway reference ID (Chapa reference). Stored after successful payment.';

COMMENT ON COLUMN refunds.payment_refund_id IS 
  'Refund reference ID from payment gateway (Chapa refund ID).';

COMMIT;

-- ============================================================================
-- Rollback instructions (if needed):
-- ============================================================================
-- BEGIN;
-- ALTER TABLE orders RENAME COLUMN payment_tx_ref TO stripe_checkout_session_id;
-- ALTER TABLE orders RENAME COLUMN payment_reference TO stripe_payment_intent_id;
-- ALTER TABLE refunds RENAME COLUMN payment_refund_id TO stripe_refund_id;
-- DROP INDEX IF EXISTS idx_orders_payment_tx_ref;
-- CREATE INDEX idx_orders_stripe_session ON orders(stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;
-- COMMIT;
-- ============================================================================
