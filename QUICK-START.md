# ⚡ Quick Start

## TL;DR - Get Demo Running in 5 Minutes

```bash
# 1. Install dependencies
cd frontend && npm install && cd ../backend && npm install && cd ..

# 2. Set up Supabase
# → Go to https://app.supabase.com
# → Create new project
# → Copy URL and keys

# 3. Configure frontend
cd frontend
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Configure backend  
cd ../backend
cp .env.example .env
# Edit .env with your Supabase credentials

# 5. Apply database migrations
# Go to https://app.supabase.com/project/_/sql
# Paste contents of backend/supabase/combined_migration.sql
# Click Run

# 6. Start frontend
cd ../frontend
npm run dev
# Go to http://localhost:3000/register
# Create an account with role "Organizer"

# 7. Seed demo data
cd ../backend
npm run check    # Verify setup
npm run seed     # Add demo events

# 8. Done! 🎉
# Browse events at http://localhost:3000/events
```

## What You Get

✅ **8 Demo Events** - Music, tech, design, business, art  
✅ **10 Categories** - Fully configured  
✅ **13+ Ticket Types** - Various prices and types  
✅ **Organizer Dashboard** - Manage your events  
✅ **Attendee Dashboard** - View and purchase tickets  

## Environment Variables

### Frontend `.env`
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Backend `.env`
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

## Useful Commands

```bash
# Check if setup is correct
cd backend && npm run check

# Seed demo data
cd backend && npm run seed

# Start frontend
cd frontend && npm run dev

# Build for production
cd frontend && npm run build
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No events showing | Check browser console, verify .env, run seed script |
| "No organizer found" | Create organizer account at /register first |
| Database errors | Make sure migrations are applied in Supabase SQL editor |
| Cookies error | Add `export const dynamic = 'force-dynamic'` to pages |

## Next Steps

1. **Browse Events**: http://localhost:3000/events
2. **Organizer Dashboard**: http://localhost:3000/organizer  
3. **Create Event**: Click "Create Event" in organizer dashboard
4. **Test Purchasing**: Set up Stripe keys (optional for demo)

## Full Guides

- 📖 [Complete Demo Setup](DEMO-SETUP-GUIDE.md)
- 🗄️ [Database Seeding](backend/SEED-DEMO.md)
- 🚀 [Deployment](DEPLOYMENT.md)
- 🎨 [Frontend README](frontend/README.md)
- ⚙️ [Backend README](backend/README.md)

---

**Need help?** Check the detailed guides above or review the error logs in your console.
