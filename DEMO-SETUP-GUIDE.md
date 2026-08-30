# 🎉 Northstar Demo Setup Guide

Get your Northstar event platform running with demo data in 5 minutes!

## 📋 Prerequisites

- Node.js installed (v18 or higher recommended)
- A Supabase account (free tier works!)

## 🚀 Step-by-Step Setup

### Step 1: Clone & Install

```bash
# If you haven't already, navigate to the project
cd blog-fullstack-

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies (for seeding)
cd backend
npm install
cd ..
```

### Step 2: Set Up Supabase

1. **Create a Supabase Project**
   - Go to https://app.supabase.com
   - Click "New Project"
   - Choose a name, password, and region
   - Wait for it to finish setting up (2-3 minutes)

2. **Get Your Credentials**
   - Go to Project Settings → API
   - Copy these values:
     - `Project URL` (looks like: https://xxxxx.supabase.co)
     - `anon public` key
     - `service_role` key (click "Reveal" to see it)

### Step 3: Configure Environment Variables

**Frontend (.env):**

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Backend (.env):**

```bash
cd ../backend
cp .env.example .env
```

Edit `backend/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 4: Apply Database Migrations

You have two options:

**Option A: Using Supabase Dashboard (Easier)**

1. Go to https://app.supabase.com/project/_/sql
2. Click "New Query"
3. Open `backend/supabase/combined_migration.sql`
4. Copy the entire file and paste into the SQL editor
5. Click "Run"

**Option B: Using Supabase CLI**

```bash
cd backend

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Step 5: Create an Organizer Account

1. Start your frontend:
   ```bash
   cd frontend
   npm run dev
   ```

2. Open http://localhost:3000
3. Click "Get Started" or go to `/register`
4. Register with:
   - Name: Your Name
   - Email: your-email@example.com
   - Password: (your choice)
   - **Role: Organizer** ← Important!
5. Complete registration

### Step 6: Seed Demo Data

```bash
cd backend
npm run seed
```

You should see:
```
🚀 Starting Northstar Demo Data Seed...

1️⃣  Seeding categories...
   ✓ Categories seeded

2️⃣  Seeding events...
   ✓ 8 events seeded

3️⃣  Seeding ticket types...
   ✓ 13 ticket types seeded

✨ Demo data seeded successfully!

🎉 You now have:
   • 8 events
   • 13 ticket types
   • 10 categories
```

### Step 7: Explore Your Demo!

1. **Browse Events**: http://localhost:3000/events
2. **View Categories**: http://localhost:3000/categories/technology
3. **Organizer Dashboard**: http://localhost:3000/organizer
4. **Attendee Dashboard**: http://localhost:3000/dashboard

## 🎊 What You Get

### 8 Demo Events:

1. **Future Sound** - Electronic music festival at Brooklyn Mirage
2. **New York Design Week** - 5-day design conference
3. **The Long Now** - Ambient music gathering
4. **Web Summit NYC** - Premier tech conference
5. **Founder's Forum** - Intimate founder dinner
6. **Summer Solstice Festival** - Outdoor music festival
7. **AI Engineering Summit** - AI implementation conference
8. **Digital Art Expo** - Digital art exhibitions

### 10 Categories:
Technology, Music, Business, Design, Sports, Education, Networking, Entertainment, Art, Culture

### Multiple Ticket Types:
Each event has realistic ticket types with different prices and capacities

## 🔧 Troubleshooting

### "No organizer found"
- Make sure you created an account with **Organizer** role
- Check in Supabase dashboard → Authentication → Users that your user exists
- Verify the user's role in Database → profiles table

### Frontend shows no events
- Check browser console for errors
- Verify your `.env` values are correct
- Make sure you ran the seed script successfully
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### "cookies() was called outside request scope"
- Make sure you added `export const dynamic = 'force-dynamic'` to pages
- Clear `.next` folder and restart: `rm -rf .next && npm run dev`

### Database errors
- Make sure migrations were applied successfully
- Check Supabase dashboard → Database → Tables to verify tables exist
- Look at Supabase logs for detailed error messages

## 📚 Next Steps

- **Test Ticket Purchasing**: Set up Stripe (see main README)
- **Customize Events**: Edit events in organizer dashboard
- **Add Images**: Upload event images via organizer panel
- **Create More Events**: Use the "Create Event" button
- **Test User Flows**: Register as attendee and purchase tickets

## 🆘 Need More Help?

- Check `backend/SEED-DEMO.md` for detailed seeding instructions
- Review `backend/README.md` for database setup
- See `frontend/README.md` for frontend configuration
- Check `DEPLOYMENT.md` for production deployment

---

**Happy event organizing! 🎟️**
