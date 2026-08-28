# Backend — Northstar Event Platform

This folder contains the Supabase database schema, migrations, seed data, and configuration for the Northstar Event Management & Ticketing Platform.

## Structure

```
backend/
├── supabase/
│   ├── config.toml          ← Local Supabase CLI configuration
│   ├── migrations/          ← Ordered SQL migration files
│   │   ├── 001_profiles.sql
│   │   ├── 002_categories.sql
│   │   ├── 003_events.sql
│   │   ├── 004_ticket_types.sql
│   │   ├── 005_orders.sql
│   │   ├── 006_tickets.sql
│   │   ├── 007_registrations.sql
│   │   ├── 008_transfers.sql
│   │   ├── 009_check_ins.sql
│   │   ├── 010_notifications.sql
│   │   ├── 011_rls.sql
│   │   └── 012_storage.sql
│   └── seed.sql             ← Development seed data
└── .env.example             ← Required environment variables
```

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- A Supabase project created at [app.supabase.com](https://app.supabase.com)

Install the CLI:

```bash
# macOS
brew install supabase/tap/supabase

# Windows (via scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# npm (cross-platform)
npm install -g supabase
```

## Quick Start — Cloud (Recommended)

### 1. Create a Supabase project

Go to [app.supabase.com](https://app.supabase.com), create a new project, and note your project reference ID.

### 2. Configure environment

```bash
cp .env.example .env
# Fill in SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD, SUPABASE_ACCESS_TOKEN
```

### 3. Link to your project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 4. Push migrations

```bash
supabase db push
```

This applies all migration files in order.

### 5. Run seed data (development only)

```bash
# Via the Supabase dashboard SQL editor, run:
# backend/supabase/seed.sql

# Or via psql (replace connection string from Supabase dashboard > Settings > Database):
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  -f supabase/seed.sql
```

### 6. Generate TypeScript types (optional — types are pre-written)

```bash
supabase gen types typescript \
  --project-id YOUR_PROJECT_REF \
  --schema public \
  > ../frontend/src/types/supabase-generated.ts
```

---

## Quick Start — Local Development

```bash
# Start local Supabase stack (Docker required)
supabase start

# Apply migrations
supabase db reset   # resets + replays all migrations

# Load seed data
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f supabase/seed.sql

# Stop
supabase stop
```

Local dashboard: http://localhost:54323

---

## Database Schema Overview

| Table | Description |
|-------|-------------|
| `profiles` | One row per auth user. Role: attendee / organizer / admin |
| `event_categories` | Platform-level categories. Admin-managed |
| `events` | Events created by organizers. Status controls visibility |
| `ticket_types` | Ticket tiers per event. Price in cents |
| `orders` | One order per checkout. Amounts immutable |
| `order_items` | Line items per order. Locks price at purchase time |
| `tickets` | One row per purchased seat. QR token for scanning |
| `registrations` | Free RSVP / waitlist records |
| `ticket_transfers` | Transfer requests between users |
| `check_ins` | Immutable check-in audit trail |
| `notifications` | In-app notifications |

## Key PostgreSQL Functions

| Function | Description |
|----------|-------------|
| `purchase_tickets(order_id, items)` | Atomic inventory check + ticket creation. Prevents oversell via `FOR UPDATE` row locks |
| `validate_and_checkin(qr_token, event_id, checked_in_by)` | Atomic QR validation + check-in. Prevents double check-in |
| `accept_ticket_transfer(transfer_id)` | Atomic transfer acceptance. Creates new ticket for recipient |
| `admin_set_user_role(user_id, role)` | Admin-only role change. Prevents self-escalation |
| `create_notification(...)` | Helper to insert notification records |

## Security Model

- **Default DENY**: RLS is enabled on every table. No policy = no access.
- **Public**: Only published events, active ticket types, and categories are readable without auth.
- **Attendees**: Read/write only their own profile, orders, tickets, registrations, transfers, notifications.
- **Organizers**: Full CRUD on their own events and ticket types. Read-only access to orders/attendees/check-ins for their events.
- **Admin**: Platform-wide read access. Role changes only via `admin_set_user_role()` RPC.
- **Service role**: Used by webhook handlers and trusted server-side operations only. Never exposed to clients.
- **Storage**: Event images keyed by `{event_id}/{filename}` — only the owning organizer can upload/delete. Avatars keyed by `{user_id}/{filename}` — owner-only write.

## Seed Accounts

After running seed.sql, these accounts are available for local development:

| Email | Password | Role |
|-------|----------|------|
| admin@northstar.dev | Password1! | admin |
| organizer@northstar.dev | Password1! | organizer |
| attendee@northstar.dev | Password1! | attendee |

**Never run seed.sql against a production database.**

## Resetting Local Database

```bash
supabase db reset
# Then re-run seed.sql
```
