-- ─────────────────────────────────────────────────────────────────────────────
-- seed.sql
-- Development seed data. Run after all migrations.
-- Creates: 3 users (admin/organizer/attendee), categories, events, ticket types,
--          orders, tickets, registrations, transfers, notifications.
--
-- IMPORTANT: These UUIDs are fixed so foreign keys stay consistent across resets.
-- Passwords are all: Password1! (bcrypt hashed by Supabase Auth)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── 1. AUTH USERS ────────────────────────────────────────────────────────────
-- Insert directly into auth.users (dev only — never do this in production)

insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at,
  aud, role
) values
(
  '00000000-0000-0000-0000-000000000001',
  'admin@northstar.dev',
  crypt('Password1!', gen_salt('bf')),
  now(),
  '{"full_name": "Alex Chen", "role": "admin"}'::jsonb,
  now(), now(), 'authenticated', 'authenticated'
),
(
  '00000000-0000-0000-0000-000000000002',
  'organizer@northstar.dev',
  crypt('Password1!', gen_salt('bf')),
  now(),
  '{"full_name": "Morgan Blake", "role": "organizer"}'::jsonb,
  now(), now(), 'authenticated', 'authenticated'
),
(
  '00000000-0000-0000-0000-000000000003',
  'attendee@northstar.dev',
  crypt('Password1!', gen_salt('bf')),
  now(),
  '{"full_name": "Jordan Davis", "role": "attendee"}'::jsonb,
  now(), now(), 'authenticated', 'authenticated'
)
on conflict (id) do nothing;

-- ─── 2. PROFILES ─────────────────────────────────────────────────────────────
-- handle_new_user() trigger creates profiles automatically,
-- but since we bypass Auth here we insert manually.

insert into public.profiles (id, full_name, role) values
  ('00000000-0000-0000-0000-000000000001', 'Alex Chen',    'admin'),
  ('00000000-0000-0000-0000-000000000002', 'Morgan Blake', 'organizer'),
  ('00000000-0000-0000-0000-000000000003', 'Jordan Davis', 'attendee')
on conflict (id) do nothing;

-- ─── 3. CATEGORIES ───────────────────────────────────────────────────────────

insert into public.event_categories (id, name, slug, description) values
  ('10000000-0000-0000-0000-000000000001', 'Technology',     'technology',     'Developer conferences, hackathons, and tech meetups'),
  ('10000000-0000-0000-0000-000000000002', 'Music',          'music',          'Concerts, festivals, and live music events'),
  ('10000000-0000-0000-0000-000000000003', 'Business',       'business',       'Networking events, summits, and workshops'),
  ('10000000-0000-0000-0000-000000000004', 'Design',         'design',         'UX, product, and creative design events'),
  ('10000000-0000-0000-0000-000000000005', 'Sports',         'sports',         'Athletic competitions and sports meetups'),
  ('10000000-0000-0000-0000-000000000006', 'Education',      'education',      'Workshops, seminars, and learning events'),
  ('10000000-0000-0000-0000-000000000007', 'Networking',     'networking',     'Professional and social networking events'),
  ('10000000-0000-0000-0000-000000000008', 'Entertainment',  'entertainment',  'Film, comedy, theatre, and entertainment'),
  ('10000000-0000-0000-0000-000000000009', 'Art',            'art',            'Exhibitions, galleries, and creative showcases'),
  ('10000000-0000-0000-0000-000000000010', 'Culture',        'culture',        'Cultural festivals and community events')
on conflict (id) do nothing;

-- ─── 4. EVENTS ───────────────────────────────────────────────────────────────

insert into public.events (
  id, organizer_id, category_id, title, slug, description,
  venue_name, venue_address, city, country,
  start_at, end_at, capacity, status
) values

-- Published: Future Sound (Music)
(
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  'Future Sound',
  'future-sound',
  'An immersive electronic music experience at Brooklyn Mirage. Three stages, world-class sound design, and a lineup of the most forward-thinking artists in dance music. Expect the unexpected — Future Sound pushes the boundaries of what a live event can be.',
  'Brooklyn Mirage',
  '140 Stewart Ave',
  'Brooklyn',
  'US',
  now() + interval '52 days',
  now() + interval '53 days',
  1200,
  'published'
),

-- Published: New York Design Week (Design)
(
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000004',
  'New York Design Week',
  'new-york-design-week',
  'Five days of talks, workshops, and exhibitions from the world''s leading product designers, UX researchers, and creative directors. NYDW brings together 3,000+ designers across 40+ sessions covering the future of human-centered design.',
  'Industry City',
  '220 36th St',
  'Brooklyn',
  'US',
  now() + interval '73 days',
  now() + interval '77 days',
  3000,
  'published'
),

-- Published: The Long Now (Culture)
(
  '20000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000010',
  'The Long Now',
  'the-long-now',
  'A one-night gathering at Public Records dedicated to slow listening, long-form conversation, and ambient music. The Long Now is an antidote to the attention economy — a space to think in real time, together.',
  'Public Records',
  '233 Butler St',
  'Brooklyn',
  'US',
  now() + interval '105 days',
  now() + interval '105 days' + interval '6 hours',
  350,
  'published'
),

-- Published: Web Summit NYC (Technology)
(
  '20000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000001',
  'Web Summit NYC',
  'web-summit-nyc',
  'The premier technology conference comes to New York City. 10,000 attendees, 500 speakers, and three days of talks covering AI, infrastructure, product, and the future of the internet. Workshops, fireside chats, and the world''s best networking floor.',
  'Jacob K. Javits Convention Center',
  '429 11th Ave',
  'New York',
  'US',
  now() + interval '120 days',
  now() + interval '123 days',
  10000,
  'published'
),

-- Published: Founder''s Forum (Business)
(
  '20000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  'Founder''s Forum',
  'founders-forum',
  'An intimate dinner and talk series for early-stage founders and investors. 80 seats. No panels, no PowerPoints — just real conversation about what it takes to build something from nothing.',
  'The Wythe Hotel',
  '80 Wythe Ave',
  'Brooklyn',
  'US',
  now() + interval '40 days',
  now() + interval '40 days' + interval '5 hours',
  80,
  'published'
),

-- Draft: Summer Solstice Festival
(
  '20000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  'Summer Solstice Festival',
  'summer-solstice-festival',
  'An outdoor music and arts festival celebrating the longest day of the year.',
  'Prospect Park',
  'Prospect Park West',
  'Brooklyn',
  'US',
  now() + interval '200 days',
  now() + interval '201 days',
  5000,
  'draft'
),

-- Cancelled: Rooftop Sessions
(
  '20000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  'Rooftop Sessions',
  'rooftop-sessions',
  'Cancelled due to venue unavailability.',
  'TBD',
  'TBD',
  'New York',
  'US',
  now() - interval '10 days',
  now() - interval '9 days',
  200,
  'cancelled'
)

on conflict (id) do nothing;

-- ─── 5. TICKET TYPES ─────────────────────────────────────────────────────────

insert into public.ticket_types (
  id, event_id, name, description, price, currency, quantity, sold_quantity, status
) values

-- Future Sound
('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001',
  'General Admission', 'Access to all stages', 6500, 'USD', 800, 312, 'active'),
('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001',
  'VIP', 'VIP lounge, early entry, premium bar', 14500, 'USD', 150, 89, 'active'),
('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001',
  'Artist Circle', 'Backstage access + meet & greet', 29500, 'USD', 50, 50, 'sold_out'),

-- New York Design Week
('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002',
  'Day Pass', 'Single day access to all talks', 4500, 'USD', 600, 220, 'active'),
('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002',
  'Full Festival Pass', '5-day access + workshop access', 18000, 'USD', 300, 187, 'active'),
('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002',
  'Studio Workshop', 'Hands-on workshop with industry leaders', 8500, 'USD', 40, 40, 'sold_out'),

-- The Long Now
('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000003',
  'General', 'General admission — very limited', 2500, 'USD', 300, 267, 'active'),
('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000003',
  'Supporter', 'General admission + donation to the venue', 5000, 'USD', 50, 28, 'active'),

-- Web Summit NYC
('30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000004',
  'Startup', 'For startups < 3 years old, < 10 employees', 49900, 'USD', 2000, 1423, 'active'),
('30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000004',
  'Investor', 'VC, angels, and institutional investors', 99900, 'USD', 500, 342, 'active'),
('30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000004',
  'Press', 'Accredited media and journalists', 0, 'USD', 200, 88, 'active'),

-- Founder''s Forum
('30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000005',
  'Founder Seat', 'Dinner + talks. Application required.', 35000, 'USD', 60, 42, 'active'),
('30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000005',
  'Investor Seat', 'Dinner + talks + deal flow session.', 50000, 'USD', 20, 18, 'active')

on conflict (id) do nothing;

-- ─── 6. ORDERS ───────────────────────────────────────────────────────────────

insert into public.orders (
  id, user_id, event_id, stripe_checkout_session_id,
  stripe_payment_intent_id, status, subtotal, fees, total_amount, currency
) values
(
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000001',
  'cs_test_seed_001',
  'pi_test_seed_001',
  'paid',
  6500, 195, 6695, 'USD'
),
(
  '40000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000002',
  'cs_test_seed_002',
  'pi_test_seed_002',
  'paid',
  18000, 540, 18540, 'USD'
),
(
  '40000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000003',
  'cs_test_seed_003',
  'pi_test_seed_003',
  'paid',
  2500, 75, 2575, 'USD'
)
on conflict (id) do nothing;

-- ─── 7. ORDER ITEMS ──────────────────────────────────────────────────────────

insert into public.order_items (id, order_id, ticket_type_id, quantity, unit_price, subtotal) values
  ('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 1, 6500,  6500),
  ('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000005', 1, 18000, 18000),
  ('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000007', 1, 2500,  2500)
on conflict (id) do nothing;

-- ─── 8. TICKETS ──────────────────────────────────────────────────────────────

insert into public.tickets (
  id, order_id, event_id, ticket_type_id, user_id,
  ticket_code, qr_token, status
) values
(
  '60000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'NS-FS28491A',
  'a3f8e2c1d4b5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1',
  'active'
),
(
  '60000000-0000-0000-0000-000000000002',
  '40000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000003',
  'NS-DW19823B',
  'b4a9f3d2e5c6f8a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
  'active'
),
(
  '60000000-0000-0000-0000-000000000003',
  '40000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000003',
  'NS-LN73641C',
  'c5b0a4e3f6d7a2b1c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1',
  'active'
)
on conflict (id) do nothing;

-- ─── 9. REGISTRATIONS (RSVPs) ────────────────────────────────────────────────

insert into public.registrations (id, event_id, user_id, status) values
  ('70000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'confirmed'),
  ('70000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'waitlisted')
on conflict (id) do nothing;

-- ─── 10. NOTIFICATIONS ───────────────────────────────────────────────────────

insert into public.notifications (id, user_id, type, title, message, data) values
(
  '80000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'ticket_purchased',
  'Ticket confirmed',
  'Your ticket for Future Sound has been confirmed. See you at Brooklyn Mirage!',
  '{"event_id": "20000000-0000-0000-0000-000000000001", "ticket_id": "60000000-0000-0000-0000-000000000001"}'::jsonb
),
(
  '80000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  'payment_completed',
  'Payment received',
  'Your order #40000000 was paid successfully. Total: $66.95.',
  '{"order_id": "40000000-0000-0000-0000-000000000001"}'::jsonb
),
(
  '80000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000003',
  'rsvp_waitlisted',
  'You''re on the waitlist',
  'You''ve been added to the waitlist for Founder''s Forum. We''ll notify you if a spot opens up.',
  '{"event_id": "20000000-0000-0000-0000-000000000005"}'::jsonb
)
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- SUMMARY
-- ─────────────────────────────────────────────────────────────────────────────
-- Users:
--   admin@northstar.dev     / Password1!  (role: admin)
--   organizer@northstar.dev / Password1!  (role: organizer)
--   attendee@northstar.dev  / Password1!  (role: attendee)
--
-- Events: 5 published, 1 draft, 1 cancelled
-- Ticket types: 13 across all events (some sold out)
-- Orders: 3 paid orders for the attendee user
-- Tickets: 3 active tickets for the attendee user
-- RSVPs: 2 (1 confirmed, 1 waitlisted)
-- Notifications: 3 for the attendee
-- ─────────────────────────────────────────────────────────────────────────────
