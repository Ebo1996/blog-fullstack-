# Eventify Ethiopia 🎉

A production-grade **Event Management & Ticketing Platform** built for Ethiopia's live-event industry.

[![Production Ready](https://img.shields.io/badge/production-ready-brightgreen)](docs/DEPLOYMENT_GUIDE.md)
[![Docker](https://img.shields.io/badge/docker-supported-blue)](docker-compose.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

```
Next.js 14 · NestJS · MongoDB Atlas · Chapa Payments · TypeScript · JWT/Passport · QR Tickets
```

---

## 🚀 Quick Links

- **[Quick Start Guide](docs/QUICK_START.md)** - Deploy in 30 minutes
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Complete production deployment
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Pre-launch tasks
- **[Sentry Setup](docs/SENTRY_SETUP.md)** - Error monitoring
- **[Logging Guidelines](docs/LOGGING_GUIDELINES.md)** - Best practices

---

## ✨ Features

### For Attendees
- 🎫 Browse and purchase event tickets
- 💳 Secure payments via Chapa (Ethiopian payment gateway)
- 📱 Digital QR code tickets
- 🔄 Transfer tickets to other users
- 📧 Email confirmations
- 👤 Profile management

### For Organizers
- 📅 Create and manage events
- 🎟️ Multiple ticket types (free, paid, VIP)
- 📊 Real-time analytics dashboard
- ✅ QR code check-in scanner
- 💰 Revenue tracking
- 👥 Attendee management

### For Admins
- 🛡️ Platform administration
- 👥 User management (organizers, attendees)
- 📋 Audit logs
- 📈 Platform-wide analytics
- 🏷️ Category management

---

## 🏗️ Architecture

```
frontend/        ← Next.js 14 App Router (public site + all dashboards)
backend/         ← NestJS REST API (business logic, auth, payments)
nginx/           ← Reverse proxy configuration
scripts/         ← Deployment and maintenance scripts
docs/            ← Documentation
```

```
Next.js → REST/HTTPS → NestJS → MongoDB Atlas
                              → Chapa (payments)
                              → Cloudinary (images)
                              → Resend (emails)
```

---

## 🚀 Deployment

### Production (Recommended)

```bash
# Run pre-flight checks
.\scripts\preflight-check.ps1  # Windows
./scripts/preflight-check.sh   # Linux/Mac

# Deploy with Docker
docker-compose up -d --build

# Or use deployment script
.\scripts\deploy.ps1           # Windows
./scripts/deploy.sh            # Linux/Mac
```

**See [Quick Start Guide](docs/QUICK_START.md) for step-by-step instructions.**

### Development

#### 1. Backend

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

#### 2. Frontend

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

---

## 📚 Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - Deploy to production in 30 minutes
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Deployment Checklist](DEPLOYMENT_CHECKLIST.md)** - Pre-launch checklist
- **[Sentry Setup](docs/SENTRY_SETUP.md)** - Error monitoring configuration
- **[Logging Guidelines](docs/LOGGING_GUIDELINES.md)** - Logging best practices

---

## 🔧 Maintenance

### Backups

```bash
# Create backup
.\scripts\backup-db.ps1   # Windows
./scripts/backup-db.sh    # Linux/Mac

# Restore from backup
.\scripts\restore-db.ps1  # Windows
./scripts/restore-db.sh   # Linux/Mac
```

### Monitoring

Health check endpoints:
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with dependencies
- `GET /api/health/ready` - Kubernetes readiness probe
- `GET /api/health/live` - Kubernetes liveness probe

### Updates

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build

# Verify deployment
curl https://api.yourdomain.com/api/health
```

---

## 🔒 Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting (5-200 req/min depending on endpoint)
- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Input validation with class-validator
- ✅ MongoDB injection protection
- ✅ HTTPS enforcement in production
- ✅ Secure payment verification
- ✅ HMAC webhook signature validation
- ✅ Audit logging for sensitive actions
- ✅ Environment variable validation on startup

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui, Radix UI
- **Forms:** React Hook Form + Zod validation
- **State:** React Context API
- **Icons:** Lucide React
- **QR Codes:** qrcode.react

### Backend
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** Passport.js + JWT
- **Validation:** class-validator, class-transformer
- **API Docs:** Swagger/OpenAPI
- **File Upload:** Multer + Cloudinary
- **Email:** Resend
- **Payments:** Chapa (Ethiopian payment gateway)

### DevOps
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt (Certbot)
- **Monitoring:** Sentry (error tracking)
- **CI/CD Ready:** GitHub Actions compatible

---

## 📦 Project Structure

```
eventify-ethiopia/
├── backend/
│   ├── src/
│   │   ├── auth/              # Authentication & authorization
│   │   ├── users/             # User management
│   │   ├── events/            # Event CRUD
│   │   ├── ticket-types/      # Ticket type management
│   │   ├── orders/            # Order processing
│   │   ├── payments/          # Chapa integration
│   │   ├── tickets/           # QR ticket generation
│   │   ├── check-ins/         # QR check-in system
│   │   ├── transfers/         # Ticket transfers
│   │   ├── notifications/     # Notification system
│   │   ├── analytics/         # Analytics & reporting
│   │   ├── admin/             # Admin operations
│   │   ├── health/            # Health checks
│   │   ├── storage/           # File storage (Cloudinary)
│   │   └── common/            # Shared utilities
│   ├── scripts/               # Database scripts
│   ├── Dockerfile
│   └── nest-cli.json
│
├── frontend/
│   ├── app/
│   │   ├── (public)/          # Public pages
│   │   ├── admin/             # Admin dashboard
│   │   ├── dashboard/         # Attendee dashboard
│   │   └── organizer/         # Organizer dashboard
│   ├── components/            # Reusable components
│   ├── lib/                   # Utilities & API client
│   ├── Dockerfile
│   └── next.config.js
│
├── nginx/
│   └── nginx.conf             # Reverse proxy config
│
├── scripts/
│   ├── deploy.sh/.ps1         # Deployment scripts
│   ├── backup-db.sh/.ps1      # Database backup
│   ├── restore-db.sh/.ps1     # Database restore
│   └── preflight-check.sh/.ps1 # Pre-deployment checks
│
├── docs/
│   ├── DEPLOYMENT_GUIDE.md    # Complete deployment guide
│   ├── QUICK_START.md         # Quick start guide
│   ├── SENTRY_SETUP.md        # Error monitoring setup
│   └── LOGGING_GUIDELINES.md  # Logging best practices
│
├── docker-compose.yml         # Multi-container setup
├── DEPLOYMENT_CHECKLIST.md    # Pre-launch checklist
└── README.md                  # This file
```

---

## 🚨 Known Issues

### Fixed
- ✅ Free tickets (0 ETB) now bypass payment and create tickets immediately
- ✅ Duplicate ticket generation prevented with idempotency checks
- ✅ Profile picture uploads working across all interfaces
- ✅ Ticket transfer ownership checks handle populated fields
- ✅ Organizer notifications triggered on ticket sales
- ✅ User notifications display proper title/body

### Minor (Non-Critical)
- ⚠️ Cloudinary upload occasionally times out (retry logic recommended)
- ⚠️ Email requires domain verification at resend.com for production

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 💬 Support

For deployment help or questions:
- Check the [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- Review the [Quick Start Guide](docs/QUICK_START.md)
- Check [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Multi-language support (Amharic, Oromo)
- [ ] SMS notifications
- [ ] Seat selection for venues
- [ ] Recurring events
- [ ] Discount codes & promotions
- [ ] Social media integration
- [ ] Advanced analytics dashboard
- [ ] Export reports (PDF, Excel)
- [ ] API rate limiting per user

---

**Built with ❤️ for Ethiopia's event industry**

*Last Updated: September 1, 2026*
