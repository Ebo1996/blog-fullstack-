# Eventify Ethiopia

**A modern event management and ticketing platform for Ethiopia.**

[![Live](https://img.shields.io/badge/live-production-brightgreen)](https://eventify-ethiopia-psi.vercel.app)
[![Backend](https://img.shields.io/badge/API-live-blue)](https://eventify-ethiopia.onrender.com/api)

---

## Overview

Eventify Ethiopia is a full-stack event management platform that enables organizers to create events, sell tickets, and manage attendees while providing users with a seamless ticket purchasing and event discovery experience.

**Live Demo:** https://eventify-ethiopia-psi.vercel.app

---

## Features

### For Event Organizers
- Create and manage events
- Multiple ticket types (Free, Paid, VIP)
- Real-time sales analytics
- QR code check-in system
- Revenue tracking

### For Attendees
- Browse and discover events
- Secure ticket purchases via Chapa
- Digital QR code tickets
- Transfer tickets to others
- Event RSVPs

### For Administrators
- Platform management
- User moderation
- Event featuring
- Audit logs

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

### Backend
- **Framework:** NestJS
- **Database:** MongoDB Atlas
- **Authentication:** JWT + Passport
- **Payments:** Chapa (Ethiopian Payment Gateway)
- **Storage:** Cloudinary
- **Email:** Resend
- **Deployment:** Render

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Chapa account (for payments)
- Cloudinary account (for images)

### Backend Setup

```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run start:dev
# → http://localhost:3001/api
```

### Frontend Setup

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

## Environment Variables

### Backend `.env`

```env
# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=eventify

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Chapa Payment
CHAPA_SECRET_KEY=your_chapa_secret
CHAPA_RETURN_URL=http://localhost:3000/payment/success

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
RESEND_API_KEY=your_resend_key

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Deployment

### Frontend (Vercel)
1. Connect repository to Vercel
2. Set root directory to `frontend`
3. Add environment variables
4. Deploy

### Backend (Render)
1. Create Web Service
2. Set root directory to `backend`
3. Build command: `npm ci --include=dev && npx tsc -p tsconfig.build.json`
4. Start command: `npm run start:prod`
5. Add environment variables
6. Deploy

---

## API Documentation

Swagger documentation available at: `/api/docs`

**Example:** https://eventify-ethiopia.onrender.com/api/docs

---

## Project Structure

```
eventify-ethiopia/
├── backend/          # NestJS API
│   ├── src/
│   │   ├── auth/
│   │   ├── events/
│   │   ├── tickets/
│   │   ├── payments/
│   │   └── ...
│   └── package.json
│
├── frontend/         # Next.js App
│   ├── app/
│   │   ├── (public)/
│   │   ├── dashboard/
│   │   ├── organizer/
│   │   └── admin/
│   ├── components/
│   └── package.json
│
└── README.md
```

---

## Security

- JWT authentication with refresh tokens
- Password hashing (bcrypt)
- Role-based access control
- Rate limiting
- CORS protection
- Input validation
- Secure payment verification

---

## License

MIT License - see LICENSE file for details.

---

## Contact

For questions or support, please open an issue on GitHub.

---

**© 2026 Eventify Ethiopia. All rights reserved.**
