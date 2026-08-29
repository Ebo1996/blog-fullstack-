-- Promo codes table
-- Supports percentage and fixed amount discounts
-- Tracks usage limits and redemptions

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INTEGER NOT NULL CHECK (discount_value > 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'usd',
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  min_tickets INTEGER CHECK (min_tickets IS NULL OR min_tickets > 0),
  max_discount INTEGER CHECK (max_discount IS NULL OR max_discount > 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (valid_to > valid_from),
  CONSTRAINT usage_check CHECK (used_count <= COALESCE(usage_limit, used_count))
);

-- Unique code per event
CREATE UNIQUE INDEX idx_promo_codes_event_code ON public.promo_codes(event_id, UPPER(code));

-- Other indexes
CREATE INDEX idx_promo_codes_event_id ON public.promo_codes(event_id);
CREATE INDEX idx_promo_codes_code ON public.promo_codes(UPPER(code));
CREATE INDEX idx_promo_codes_active ON public.promo_codes(active) WHERE active = true;
CREATE INDEX idx_promo_codes_valid_to ON public.promo_codes(valid_to);

-- Promo code usage tracking
CREATE TABLE IF NOT EXISTS public.promo_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  discount_amount INTEGER NOT NULL CHECK (discount_amount >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(promo_code_id, order_id)
);

-- Indexes for usage tracking
CREATE INDEX idx_promo_code_usage_promo_code_id ON public.promo_code_usage(promo_code_id);
CREATE INDEX idx_promo_code_usage_order_id ON public.promo_code_usage(order_id);
CREATE INDEX idx_promo_code_usage_user_id ON public.promo_code_usage(user_id);

-- RLS policies for promo_codes
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can view active promo codes (for validation)
CREATE POLICY "Anyone can view active promo codes"
  ON public.promo_codes
  FOR SELECT
  USING (active = true AND NOW() BETWEEN valid_from AND valid_to);

-- Organizers can manage their event promo codes
CREATE POLICY "Organizers can manage their event promo codes"
  ON public.promo_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_id
      AND organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE id = event_id
      AND organizer_id = auth.uid()
    )
  );

-- Admins can view all promo codes
CREATE POLICY "Admins can view all promo codes"
  ON public.promo_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- RLS policies for promo_code_usage
ALTER TABLE public.promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own promo code usage"
  ON public.promo_code_usage
  FOR SELECT
  USING (user_id = auth.uid());

-- Organizers can view usage for their events
CREATE POLICY "Organizers can view usage for their events"
  ON public.promo_code_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.promo_codes pc
      JOIN public.events e ON e.id = pc.event_id
      WHERE pc.id = promo_code_id
      AND e.organizer_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER set_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to validate and apply promo code
CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code TEXT,
  p_event_id UUID,
  p_ticket_count INTEGER,
  p_subtotal INTEGER
)
RETURNS TABLE (
  valid BOOLEAN,
  promo_code_id UUID,
  discount_amount INTEGER,
  error TEXT
) AS $$
DECLARE
  v_promo RECORD;
  v_discount INTEGER;
BEGIN
  -- Find promo code
  SELECT * INTO v_promo
  FROM public.promo_codes
  WHERE event_id = p_event_id
  AND UPPER(code) = UPPER(p_code)
  AND active = true;

  -- Code not found or inactive
  IF v_promo IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Invalid promo code'::TEXT;
    RETURN;
  END IF;

  -- Check date range
  IF NOW() < v_promo.valid_from THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Promo code not yet valid'::TEXT;
    RETURN;
  END IF;

  IF NOW() > v_promo.valid_to THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Promo code has expired'::TEXT;
    RETURN;
  END IF;

  -- Check usage limit
  IF v_promo.usage_limit IS NOT NULL AND v_promo.used_count >= v_promo.usage_limit THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Promo code has reached its usage limit'::TEXT;
    RETURN;
  END IF;

  -- Check minimum tickets
  IF v_promo.min_tickets IS NOT NULL AND p_ticket_count < v_promo.min_tickets THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, format('Minimum %s tickets required', v_promo.min_tickets)::TEXT;
    RETURN;
  END IF;

  -- Calculate discount
  IF v_promo.discount_type = 'percentage' THEN
    v_discount := FLOOR(p_subtotal * v_promo.discount_value / 100.0);
  ELSE
    v_discount := v_promo.discount_value;
  END IF;

  -- Apply max discount cap
  IF v_promo.max_discount IS NOT NULL AND v_discount > v_promo.max_discount THEN
    v_discount := v_promo.max_discount;
  END IF;

  -- Discount can't exceed subtotal
  IF v_discount > p_subtotal THEN
    v_discount := p_subtotal;
  END IF;

  RETURN QUERY SELECT true, v_promo.id, v_discount, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.promo_codes IS 'Promotional discount codes for events';
COMMENT ON COLUMN public.promo_codes.discount_value IS 'Percentage (1-100) or fixed amount in cents';
COMMENT ON COLUMN public.promo_codes.max_discount IS 'Maximum discount in cents (for percentage codes)';
COMMENT ON COLUMN public.promo_codes.min_tickets IS 'Minimum number of tickets required';
COMMENT ON TABLE public.promo_code_usage IS 'Tracks which orders used which promo codes';


-- Function to increment promo code usage count
CREATE OR REPLACE FUNCTION increment_promo_code_usage(p_promo_code_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.promo_codes
  SET used_count = used_count + 1
  WHERE id = p_promo_code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
