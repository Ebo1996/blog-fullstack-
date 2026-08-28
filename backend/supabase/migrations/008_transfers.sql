-- ─────────────────────────────────────────────────────────────────────────────
-- 008_transfers.sql
-- Ticket transfer requests between users. Ownership changes only on acceptance.
-- ─────────────────────────────────────────────────────────────────────────────

create type public.transfer_status as enum ('pending', 'accepted', 'rejected', 'cancelled', 'expired');

create table public.ticket_transfers (
  id            uuid primary key default gen_random_uuid(),
  ticket_id     uuid not null references public.tickets(id) on delete cascade,
  from_user_id  uuid not null references public.profiles(id) on delete cascade,
  to_user_id    uuid not null references public.profiles(id) on delete cascade,
  status        public.transfer_status not null default 'pending',
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  expires_at    timestamptz not null default (now() + interval '72 hours'),

  constraint transfers_different_users    check (from_user_id <> to_user_id),
  constraint transfers_accepted_has_date  check (
    (status = 'accepted' and accepted_at is not null) or
    (status <> 'accepted' and accepted_at is null)
  )
);

comment on table public.ticket_transfers is 'Transfer requests. Ticket ownership changes only when status = accepted.';

create index idx_transfers_ticket_id    on public.ticket_transfers(ticket_id);
create index idx_transfers_from_user    on public.ticket_transfers(from_user_id);
create index idx_transfers_to_user      on public.ticket_transfers(to_user_id);
create index idx_transfers_status       on public.ticket_transfers(status);

-- Only one pending transfer per ticket at a time
create unique index idx_transfers_one_pending
  on public.ticket_transfers(ticket_id)
  where status = 'pending';

-- ─────────────────────────────────────────────────────────────────────────────
-- ATOMIC TRANSFER RPC
-- Validates rules and marks old ticket transferred, creates new ticket for recipient.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.accept_ticket_transfer(p_transfer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  tr          record;
  ticket_rec  record;
  new_code    text;
  new_token   text;
begin
  -- Lock the transfer row
  select * into tr
  from public.ticket_transfers
  where id = p_transfer_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Transfer not found');
  end if;

  -- Only the recipient can accept
  if tr.to_user_id <> auth.uid() then
    return jsonb_build_object('success', false, 'error', 'Unauthorized');
  end if;

  if tr.status <> 'pending' then
    return jsonb_build_object('success', false, 'error', 'Transfer is no longer pending');
  end if;

  if tr.expires_at < now() then
    update public.ticket_transfers set status = 'expired' where id = tr.id;
    return jsonb_build_object('success', false, 'error', 'Transfer has expired');
  end if;

  -- Lock and validate the ticket
  select * into ticket_rec
  from public.tickets
  where id = tr.ticket_id
  for update;

  if ticket_rec.status <> 'active' then
    return jsonb_build_object(
      'success', false,
      'error', 'Ticket is no longer transferable (status: ' || ticket_rec.status || ')'
    );
  end if;

  -- Generate new codes for the recipient's ticket
  new_code  := 'NS-' || upper(substring(encode(gen_random_bytes(8), 'hex') for 8));
  new_token := encode(gen_random_bytes(24), 'hex');

  -- Mark original ticket as transferred
  update public.tickets
  set status = 'transferred', updated_at = now()
  where id = ticket_rec.id;

  -- Create new ticket for recipient (fresh code + token for security)
  insert into public.tickets (
    order_id, event_id, ticket_type_id, user_id, ticket_code, qr_token
  ) values (
    ticket_rec.order_id,
    ticket_rec.event_id,
    ticket_rec.ticket_type_id,
    tr.to_user_id,
    new_code,
    new_token
  );

  -- Mark transfer as accepted
  update public.ticket_transfers
  set status = 'accepted', accepted_at = now()
  where id = tr.id;

  return jsonb_build_object('success', true);
end;
$$;
