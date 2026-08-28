# Northstar — Event Management & Ticketing Platform

A production-quality, full-stack event management platform built with Next.js 15, Supabase, Stripe, and TypeScript.

## Repository Structure

```
/
├── frontend/          ← Next.js 15 App Router application
├── backend/           ← Supabase schema, migrations, seed data
└── attendee-dashboard/  ← Original UI prototype (reference only)
```

---

## Quick Start

### 1. Clone and install

```bash
# Frontend
cd frontend
npm install
cp .env.example .env.local
# Fill in your Supabase + Stripe credentials
```

### 2. Set up the database

See [backend/README.md](./backend/README.md) for full instructions.

```bash
# Push schema to your Supabase project
cd backend
supabase link --project-ref YOUR_PROJECT_REF
supabase db push

# Load seed data (dev only)
psql "YOUR_SUPABASE_DB_URL" -f supabase/seed.sql
```

### 3. Run the development server

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seed accounts

| Email | Password | Role |
|-------|----------|------|
| admin@northstar.dev | Password1! | admin |
| organizer@northstar.dev | Password1! | organizer |
| attendee@northstar.dev | Password1! | attendee |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-first) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payments | Stripe Checkout + Webhooks |
| Validation | Zod |
| QR codes | qrcode + qrcode.react |
| Charts | Recharts |
| Icons | Lucide React |

---

## Implementation Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 — Architecture | ✅ Complete | Project setup, DB schema, RLS, auth, design system |
| 2 — Public Website | 🔜 Next | Homepage, event discovery, event detail, categories |
| 3 — Attendee Dashboard | 🔜 | Tickets, orders, RSVPs, transfers, notifications |
| 4 — Organizer Dashboard | 🔜 | Event management, ticket types, scanner, analytics |
| 5 — Stripe Payments | 🔜 | Checkout, webhooks, ticket generation |
| 6 — Admin Dashboard | 🔜 | User management, events, reports, analytics |
| 7 — Advanced Features | 🔜 | Promo codes, waitlists, email notifications |
| 8 — Testing & Polish | 🔜 | Unit, integration, E2E, security review |

---

## Phase 1 Deliverables

### Frontend (`frontend/`)

```
src/
├── app/
│   ├── (auth)/              ← Login, register, forgot/reset password
│   │   ├── actions.ts       ← Server actions (Zod-validated)
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── auth/callback/       ← OAuth + email confirmation handler
│   ├── (public)/home/       ← Public homepage placeholder
│   ├── dashboard/           ← Attendee dashboard (role-protected)
│   ├── organizer/           ← Organizer dashboard (role-protected)
│   ├── admin/               ← Admin dashboard (role-protected)
│   ├── layout.tsx           ← Root layout + font loading
│   ├── globals.css          ← Complete design system (extended from prototype)
│   ├── error.tsx            ← Global error boundary
│   └── not-found.tsx        ← 404 page
│
├── components/ui/           ← Design system components
│   ├── button.tsx           ← Button (5 variants, loading state)
│   ├── input.tsx            ← Input, Textarea, Select
│   ├── badge.tsx            ← Badge + semantic status badges
│   ├── skeleton.tsx         ← Skeleton + presets (card, table, stat)
│   ├── empty-state.tsx      ← Empty state with actions
│   ├── alert.tsx            ← Alert (info/success/warning/error)
│   ├── tabs.tsx             ← Tabs + TabPanel (ARIA compliant)
│   ├── dialog.tsx           ← Native <dialog> modal
│   ├── table.tsx            ← DataTable with loading/empty states
│   ├── avatar.tsx           ← Avatar with image + initials fallback
│   ├── pagination.tsx       ← Pagination component
│   └── stat-card.tsx        ← Stat card with delta indicator
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts        ← Browser client (singleton)
│   │   ├── server.ts        ← Server client (cookie-based)
│   │   ├── service.ts       ← Service role (server-only, guarded)
│   │   └── middleware.ts    ← Session refresh for Next.js middleware
│   ├── auth/index.ts        ← requireAuth, requireRole, getProfile
│   ├── validation/
│   │   ├── auth.ts          ← Login, register, password schemas
│   │   └── events.ts        ← Event, ticket type, checkout schemas
│   └── utils/
│       ├── cn.ts            ← clsx + tailwind-merge
│       └── format.ts        ← Currency, date, number, string helpers
│
├── types/
│   ├── database.ts          ← All DB table types + Database schema type
│   └── index.ts             ← API results, pagination, filters, forms
│
├── config/index.ts          ← App-wide constants
└── middleware.ts            ← Route protection + session refresh
```

### Backend (`backend/`)

```
supabase/
├── migrations/
│   ├── 001_profiles.sql     ← Users, role enum, auto-create trigger
│   ├── 002_categories.sql   ← Event categories
│   ├── 003_events.sql       ← Events + compound indexes
│   ├── 004_ticket_types.sql ← Ticket types + auto sold_out trigger
│   ├── 005_orders.sql       ← Orders + order items
│   ├── 006_tickets.sql      ← Tickets + purchase_tickets() + validate_and_checkin() RPCs
│   ├── 007_registrations.sql← RSVPs with unique constraint
│   ├── 008_transfers.sql    ← Ticket transfers + accept_ticket_transfer() RPC
│   ├── 009_check_ins.sql    ← Immutable check-in audit trail
│   ├── 010_notifications.sql← In-app notifications
│   ├── 011_rls.sql          ← Full Row Level Security (deny-by-default)
│   └── 012_storage.sql      ← event-images + avatars buckets + policies
└── seed.sql                 ← 3 users, 10 categories, 7 events, 13 ticket types, orders, tickets
```

### Key Security Properties

- Every table has RLS enabled with deny-by-default
- Ticket inventory protected by `FOR UPDATE` row locks in `purchase_tickets()` RPC
- Check-in atomicity guaranteed by `FOR UPDATE` in `validate_and_checkin()` RPC
- QR tokens are 48-character cryptographically random hex strings
- Role escalation blocked at DB level — only `admin_set_user_role()` RPC can change roles
- Service role key is server-only, guarded by a `typeof window` check
- Auth server actions return deliberately vague error messages
- Storage paths enforce ownership via path-prefix matching in policies
