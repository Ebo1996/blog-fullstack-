-- Add waitlist support to registrations table
-- Waitlist entries are created when an event is sold out
-- Users can be notified and converted to actual tickets when availability opens up

-- Add waitlist fields to registrations table
ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'cancelled', 'waitlist'));

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS waitlist_position INTEGER CHECK (waitlist_position > 0);

ALTER TABLE public.registrations
ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- Index for waitlist queries
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);
CREATE INDEX IF NOT EXISTS idx_registrations_waitlist ON public.registrations(event_id, status, waitlist_position)
  WHERE status = 'waitlist';

-- Function to get next waitlist position
CREATE OR REPLACE FUNCTION get_next_waitlist_position(p_event_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_max_position INTEGER;
BEGIN
  SELECT COALESCE(MAX(waitlist_position), 0) INTO v_max_position
  FROM public.registrations
  WHERE event_id = p_event_id
  AND status = 'waitlist';
  
  RETURN v_max_position + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to add user to waitlist
CREATE OR REPLACE FUNCTION add_to_waitlist(
  p_event_id UUID,
  p_user_id UUID,
  p_ticket_type_id UUID,
  p_quantity INTEGER DEFAULT 1
)
RETURNS TABLE (
  success BOOLEAN,
  registration_id UUID,
  position INTEGER,
  error TEXT
) AS $$
DECLARE
  v_registration_id UUID;
  v_position INTEGER;
  v_existing_count INTEGER;
BEGIN
  -- Check if user already has a waitlist entry for this event
  SELECT COUNT(*) INTO v_existing_count
  FROM public.registrations
  WHERE event_id = p_event_id
  AND user_id = p_user_id
  AND status = 'waitlist';

  IF v_existing_count > 0 THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Already on waitlist for this event'::TEXT;
    RETURN;
  END IF;

  -- Check if user already has active tickets
  SELECT COUNT(*) INTO v_existing_count
  FROM public.registrations
  WHERE event_id = p_event_id
  AND user_id = p_user_id
  AND status = 'active';

  IF v_existing_count > 0 THEN
    RETURN QUERY SELECT false, NULL::UUID, 0, 'Already registered for this event'::TEXT;
    RETURN;
  END IF;

  -- Get next position
  v_position := get_next_waitlist_position(p_event_id);

  -- Create waitlist registration
  INSERT INTO public.registrations (
    event_id,
    user_id,
    ticket_type_id,
    quantity,
    status,
    waitlist_position,
    attended,
    checked_in_at
  ) VALUES (
    p_event_id,
    p_user_id,
    p_ticket_type_id,
    p_quantity,
    'waitlist',
    v_position,
    false,
    NULL
  )
  RETURNING id INTO v_registration_id;

  RETURN QUERY SELECT true, v_registration_id, v_position, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get waitlist entries for an event
CREATE OR REPLACE FUNCTION get_event_waitlist(
  p_event_id UUID,
  p_limit INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  ticket_type_id UUID,
  ticket_type_name TEXT,
  quantity INTEGER,
  waitlist_position INTEGER,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.user_id,
    p.email,
    p.full_name,
    r.ticket_type_id,
    tt.name,
    r.quantity,
    r.waitlist_position,
    r.notified_at,
    r.created_at
  FROM public.registrations r
  JOIN public.profiles p ON p.id = r.user_id
  JOIN public.ticket_types tt ON tt.id = r.ticket_type_id
  WHERE r.event_id = p_event_id
  AND r.status = 'waitlist'
  ORDER BY r.waitlist_position ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark waitlist entry as notified
CREATE OR REPLACE FUNCTION mark_waitlist_notified(p_registration_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.registrations
  SET notified_at = NOW()
  WHERE id = p_registration_id
  AND status = 'waitlist';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to convert waitlist to active registration
-- This should be called after successful payment
CREATE OR REPLACE FUNCTION convert_waitlist_to_active(
  p_registration_id UUID,
  p_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_event_id UUID;
  v_ticket_type_id UUID;
  v_quantity INTEGER;
  v_available INTEGER;
BEGIN
  -- Get registration details
  SELECT event_id, ticket_type_id, quantity
  INTO v_event_id, v_ticket_type_id, v_quantity
  FROM public.registrations
  WHERE id = p_registration_id
  AND status = 'waitlist';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check availability
  SELECT capacity - sold INTO v_available
  FROM public.ticket_types
  WHERE id = v_ticket_type_id;

  IF v_available < v_quantity THEN
    RETURN false;
  END IF;

  -- Update registration status
  UPDATE public.registrations
  SET status = 'active',
      waitlist_position = NULL,
      updated_at = NOW()
  WHERE id = p_registration_id;

  -- Update ticket type sold count
  UPDATE public.ticket_types
  SET sold = sold + v_quantity
  WHERE id = v_ticket_type_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove from waitlist
CREATE OR REPLACE FUNCTION remove_from_waitlist(
  p_registration_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_position INTEGER;
  v_event_id UUID;
BEGIN
  -- Get position and event
  SELECT waitlist_position, event_id
  INTO v_position, v_event_id
  FROM public.registrations
  WHERE id = p_registration_id
  AND user_id = p_user_id
  AND status = 'waitlist';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Delete the registration
  DELETE FROM public.registrations
  WHERE id = p_registration_id;

  -- Reorder remaining waitlist entries
  UPDATE public.registrations
  SET waitlist_position = waitlist_position - 1
  WHERE event_id = v_event_id
  AND status = 'waitlist'
  AND waitlist_position > v_position;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON COLUMN public.registrations.status IS 'Registration status: active (purchased), cancelled, or waitlist';
COMMENT ON COLUMN public.registrations.waitlist_position IS 'Position in waitlist queue (1-indexed, NULL for non-waitlist)';
COMMENT ON COLUMN public.registrations.notified_at IS 'When user was notified about ticket availability';
COMMENT ON FUNCTION add_to_waitlist IS 'Add user to event waitlist, returns position';
COMMENT ON FUNCTION get_event_waitlist IS 'Get waitlist entries for an event, ordered by position';
COMMENT ON FUNCTION convert_waitlist_to_active IS 'Convert waitlist entry to active registration after payment';
COMMENT ON FUNCTION remove_from_waitlist IS 'Remove user from waitlist and reorder remaining entries';
