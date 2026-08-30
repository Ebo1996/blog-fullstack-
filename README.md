# 🎟️ Eventify Ethiopia

> The modern event ticketing platform built for Ethiopia.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com)
[![Chapa](https://img.shields.io/badge/Chapa-Payments-blue)](https://chapa.co)
[![Resend](https://img.shields.io/badge/Resend-Email-purple)](https://resend.com)
[![Sentry](https://img.shields.io/badge/Sentry-Monitoring-red?logo=sentry)](https://sentry.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)

---

## 📌 What is Eventify Ethiopia?

Eventify Ethiopia is a full-stack event management and ticketing platform built specifically for the Ethiopian market. It allows event organizers to create and publish events, sell tickets in Ethiopian Birr (ETB), and manage attendees — while giving attendees a seamless way to discover events, purchase tickets, and receive digital QR codes for entry.

---

## ✨ Features

### For Attendees
- Browse and discover events by category, city, and date
- Purchase tickets securely with Chapa (Telebirr, bank transfer, cards)
- Receive digital tickets with QR codes via email
- Manage tickets, transfers, and RSVPs from a personal dashboard
- Join waitlists for sold-out events

### For Organizers
- Create and publish events with rich details and images
- Set up multiple ticket types with custom pricing in ETB
- Real-time sales analytics and revenue tracking
- Attendee management and CSV export
- QR code scanner for event check-in
- Process refunds directly through Chapa
- Promo code management

### For Admins
- Platform-wide analytics and reporting
- User management and role assignment
- Category management
- Full visibility across all events and orders

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 15** | React framework with App Router and Server Actions |
| **TypeScript** | Type-safe development throughout |
| **Tailwind CSS** | Utility-first styling |
| **Lucide React** | Modern icon library |
| **React Hook Form + Zod** | Form handling with validation |
| **Recharts** | Analytics charts and data visualization |
| **QRCode.react** | QR code generation for tickets |
| **html5-qrcode** | QR code scanning for check-in |

### Backend & Infrastructure
| Technology | Purpose |
|---|---|
| **Supabase** | PostgreSQL database, authentication, real-time, and storage |
| **Supabase Auth** | User authentication with email verification |
| **Supabase Storage** | Event images and avatar uploads |
| **Row Level Security** | Database-level access control per user role |

### Integrations
| Service | Purpose |
|---|---|
| **Chapa** | Ethiopian payment gateway — accepts Telebirr, bank transfers, and cards in ETB |
| **Resend** | Transactional email delivery — order confirmations, ticket delivery, refund notifications |
| **Sentry** | Error monitoring and performance tracking in production |

---

## 🏗️ Project Structure

```
eventify-ethiopia/
├── frontend/                    # Next.js 15 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/          # Login, register, forgot/reset password
│   │   │   ├── (public)/        # Home, events, categories, checkout
│   │   │   ├── admin/           # Admin dashboard
│   │   │   ├── organizer/       # Organizer dashboard
│   │   │   ├── dashboard/       # Attendee dashboard
│   │   │   └── api/             # API routes (checkout, webhooks, uploads)
│   │   ├── components/          # Reusable UI components
│   │   ├── lib/                 # Core utilities
│   │   │   ├── chapa/           # Chapa payment integration
│   │   │   ├── email/           # Resend email templates
│   │   │   ├── storage/         # Supabase Storage helpers
│   │   │   ├── supabase/        # Supabase client setup
│   │   │   └── monitoring/      # Rate limiting and logging
│   │   ├── services/            # Business logic layer
│   │   └── types/               # TypeScript type definitions
│   ├── sentry.client.config.ts  # Sentry browser config
│   ├── sentry.server.config.ts  # Sentry server config
│   └── next.config.ts           # Next.js + Sentry config
└── backend/
    └── supabase/
        ├── migrations/          # 19 ordered SQL migration files
        ├── combined_migration.sql # All migrations in one file
        └── seed.sql             # Development seed data
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Chapa](https://dashboard.chapa.co) account (Ethiopian payment gateway)
- A [Resend](https://resend.com) account (for emails)
- A [Sentry](https://sentry.io) project (for error monitoring)

### 1. Clone the repository
```bash
git clone https://github.com/Ebo1996/eventify-ethiopia.git
cd eventify-ethiopia
```

### 2. Set up the database
Go to your **Supabase Dashboard → SQL Editor**, paste the contents of `backend/supabase/combined_migration.sql` and run it.

Then run the storage policies:
```sql
-- Run in Supabase SQL Editor
-- (already included in combined_migration.sql)
```

Grant permissions:
```sql
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.events TO anon;
GRANT SELECT ON public.event_categories TO anon;
GRANT SELECT ON public.ticket_types TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
```

### 3. Configure environment variables
Create `frontend/.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Chapa (Ethiopian Payment Gateway)
CHAPA_SECRET_KEY=CHASECK_TEST-your-test-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_your-api-key

# Error Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project
```

### 4. Install and run
```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:3000** 🎉

---

## 👤 User Roles

| Role | Access |
|---|---|
| `attendee` | Browse events, purchase tickets, manage personal dashboard |
| `organizer` | All attendee access + create/manage events and ticket sales |
| `admin` | Full platform access, user management, analytics |

To make yourself admin, run in Supabase SQL Editor:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your@email.com';
```

---

## 💳 Payment Flow (Chapa)

1. Attendee selects tickets and clicks "Pay"
2. Backend creates a pending order and calls Chapa's initialize API
3. Attendee is redirected to Chapa's hosted checkout (Telebirr, bank, card)
4. After payment, Chapa sends a webhook to `/api/webhooks/chapa`
5. Webhook verifies payment via Chapa's verify API (HMAC signature checked)
6. Order is marked as paid, tickets are generated with QR codes
7. Confirmation email sent via Resend, tickets delivered via email

---

## 📧 Email Notifications (Resend)

The following emails are sent automatically:
- **Order confirmation** — when payment is successful
- **Ticket delivery** — tickets with QR codes after payment
- **Refund notification** — when a refund is processed
- **Event updates** — when organizer sends an update to attendees
- **Email verification** — on account registration (via Supabase SMTP)

---

## 🔒 Security

- **Row Level Security (RLS)** — every table has policies, default deny
- **HMAC webhook verification** — Chapa webhooks verified with signature
- **Rate limiting** — all critical API endpoints protected
- **Content Security Policy** — XSS protection headers
- **Input validation** — Zod schemas on all API routes and forms
- **Email enumeration protection** — auth errors are deliberately vague
- **Source map deletion** — source maps uploaded to Sentry then deleted

---

## 🌍 Deployment

### Deploy to Vercel (Recommended)
1. Push to GitHub
2. Connect repo to [Vercel](https://vercel.com)
3. Set root directory to `frontend`
4. Add all environment variables
5. Deploy

### Switch to live Chapa key for production
Replace `CHASECK_TEST-...` with your live `CHASECK-...` key from [dashboard.chapa.co](https://dashboard.chapa.co).

---

---

## 👨‍💻 Author

**Ebisa Berhanu**
- GitHub: [@Ebo1996](https://github.com/Ebo1996)

---

## 📄 License

MIT License — Copyright (c) 2026 Ebisa Berhanu ([@Ebo1996](https://github.com/Ebo1996))

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

**Built with ❤️ in Ethiopia 🇪🇹**

*Empowering Ethiopian event organizers with modern ticketing technology.*
