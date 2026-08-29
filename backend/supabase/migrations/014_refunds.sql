-- Refunds table for audit trail
-- Tracks all refund operations with Stripe integration

CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  stripe_refund_id VARCHAR(255),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_refunds_order_id ON public.refunds(order_id);
CREATE INDEX idx_refunds_created_by ON public.refunds(created_by);
CREATE INDEX idx_refunds_status ON public.refunds(status);
CREATE INDEX idx_refunds_created_at ON public.refunds(created_at DESC);

-- RLS policies
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Organizers can view refunds for their own events
CREATE POLICY "Organizers can view their event refunds"
  ON public.refunds
  FOR SELECT
  USING (
    created_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.events e ON e.id = o.event_id
      WHERE o.id = refunds.order_id
      AND e.organizer_id = auth.uid()
    )
  );

-- Admins can view all refunds
CREATE POLICY "Admins can view all refunds"
  ON public.refunds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only organizers and admins can create refunds
CREATE POLICY "Organizers can create refunds for their events"
  ON public.refunds
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.events e ON e.id = o.event_id
      WHERE o.id = order_id
      AND e.organizer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER set_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comments
COMMENT ON TABLE public.refunds IS 'Audit trail for all refund operations';
COMMENT ON COLUMN public.refunds.amount IS 'Refund amount in cents';
COMMENT ON COLUMN public.refunds.stripe_refund_id IS 'Stripe refund ID for reconciliation';
COMMENT ON COLUMN public.refunds.created_by IS 'Organizer or admin who initiated the refund';
