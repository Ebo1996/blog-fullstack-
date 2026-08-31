# Eventify Ethiopia

A production-grade **Event Management & Ticketing Platform** built for Ethiopia's live-event industry.

```
Next.js 14 · NestJS · MongoDB Atlas · Chapa Payments · TypeScript · JWT/Passport · QR Tickets
```

---

## Architecture

```
frontend/        ← Next.js 14 App Router (public site + all dashboards)
backend/         ← NestJS REST API (business logic, auth, payments)
```

```
Next.js → REST/HTTPS → NestJS → MongoDB Atlas
                              → Chapa (payments)
                              → Cloudinary (images)
```

---

## Quick Start

### 1. Backend

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Fill in: MONGODB_URI, CHAPA_SECRET_KEY, JWT_SECRET, JWT_REFRESH_SECRET

# Seed database
npm run seed

# Start development server
npm run start:dev
# → http://localhost:3001/api
# → http://localhost:3001/api/docs  (Swagger)
```

### 2. Frontend

```bash
cd frontend
npm install

# Configure environment
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local

# Start development server
npm run dev
# → http://localhost:3000
```

---

## Test Accounts (after seeding)

| Role       | Email                     | Password       | URL                            |
|------------|---------------------------|----------------|--------------------------------|
| Admin      | admin@eventify.et         | Admin1234!     | http://localhost:3000/admin    |
| Organizer  | organizer@eventify.et     | Organizer1234! | http://localhost:3000/organizer|
| Attendee   | attendee@eventify.et      | Attendee1234!  | http://localhost:3000/dashboard|

---

## Environment Variables

### Backend (`backend/.env`)

```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=eventify

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

CHAPA_SECRET_KEY=CHASECK_TEST-...
CHAPA_WEBHOOK_SECRET=your_webhook_secret
CHAPA_BASE_URL=https://api.chapa.co/v1
CHAPA_CALLBACK_URL=http://localhost:3001/api/payments/chapa/callback
CHAPA_RETURN_URL=http://localhost:3000/payment/success

PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Features

### Public Website
- Homepage with hero, featured events, categories, upcoming/trending
- Event discovery with server-side search, filter, sort, pagination
- Event detail pages with sticky ticket purchase panel
- Category pages, search, about, contact

### Attendee Dashboard (`/dashboard`)
- Overview with next event, recent tickets, recent orders
- My Tickets with digital QR tickets
- Orders history
- RSVPs management
- Ticket transfers (send/accept/reject)
- Notifications
- Profile settings

### Organizer Dashboard (`/organizer`)
- Overview with revenue, tickets sold, upcoming events
- Event management (create/edit/publish/unpublish/cancel/duplicate)
- Multi-step event creation form
- Ticket type management (create, pause, resume)
- Orders per event
- Attendee list with check-in status
- QR scanner for event check-in
- Analytics (per-event + overview)

### Admin Dashboard (`/admin`)
- Platform overview with real aggregation stats
- User management (suspend, change role)
- Event management (feature/unfeature, moderate)
- Order monitoring
- Category management
- Audit logs

### Payment Flow (Chapa)
1. Attendee selects tickets → NestJS creates pending order → initializes Chapa
2. Attendee pays on Chapa → webhook hits NestJS
3. NestJS verifies payment server-side → MongoDB transaction: order paid + inventory updated + tickets generated
4. Attendee sees QR tickets in dashboard

### Security
- JWT + refresh tokens (bcrypt hashed)
- Role-based guards (JwtAuthGuard + RolesGuard)
- Server-side payment verification (never trust frontend)
- Idempotent webhook handling
- Atomic inventory updates (prevents overselling)
- HMAC webhook signature validation
- Rate limiting, CORS, Helmet

---

## API Documentation

Swagger UI available at: `http://localhost:3001/api/docs`

---

## Backend Modules

| Module | Description |
|--------|-------------|
| auth | JWT auth, Passport strategies, guards |
| users | User profiles, role management |
| events | Event CRUD, publish/cancel/duplicate |
| categories | Event categories |
| ticket-types | Ticket type management, inventory |
| orders | Order creation with Chapa integration |
| payments | Chapa service, webhook handling |
| tickets | QR ticket generation |
| check-ins | Atomic QR scanning + check-in |
| transfers | Ticket transfer between users |
| registrations | RSVP for free events |
| analytics | MongoDB aggregation pipelines |
| notifications | In-app notification system |
| admin | Platform management |
| audit-logs | Sensitive action tracking |
| storage | Cloudinary file upload abstraction |
