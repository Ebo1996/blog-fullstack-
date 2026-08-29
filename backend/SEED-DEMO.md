# Seeding Demo Data

This guide will help you populate your Northstar database with demo events, categories, and ticket types.

## Prerequisites

1. A Supabase project set up
2. Migrations applied to your database
3. Your Supabase credentials

## Quick Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find these:**
- Go to https://app.supabase.com/project/_/settings/api
- Copy your project URL (SUPABASE_URL)
- Copy your service_role key (SUPABASE_SERVICE_ROLE_KEY) - **Keep this secret!**

### Step 3: Create an Organizer Account

Before seeding, you need at least one organizer account:

1. Go to your frontend app
2. Register a new account at `/register`
3. Choose **Organizer** as the role
4. Complete registration

The seed script will use this organizer to create all demo events.

### Step 4: Run the Seed Script

```bash
npm run seed
```

This will create:
- ✅ 10 event categories (Technology, Music, Business, Design, etc.)
- ✅ 8 demo events with realistic descriptions and dates
- ✅ 13+ ticket types across all events

## What Gets Created

### Categories
- Technology, Music, Business, Design, Sports, Education, Networking, Entertainment, Art, Culture

### Demo Events

1. **Future Sound** (Music)
   - Brooklyn Mirage
   - Electronic music festival
   - General Admission ($65) + VIP ($145)

2. **New York Design Week** (Design)
   - Industry City
   - 5-day design conference
   - Day Pass ($45) + Full Festival Pass ($180)

3. **The Long Now** (Culture)
   - Public Records
   - Ambient music gathering
   - General Admission ($25)

4. **Web Summit NYC** (Technology)
   - Javits Center
   - Tech conference
   - Startup Pass ($499) + Investor Pass ($999)

5. **Founder's Forum** (Business)
   - The Wythe Hotel
   - Intimate founder dinner
   - Founder Seat ($350)

6. **Summer Solstice Festival** (Music)
   - Prospect Park
   - Outdoor festival
   - General ($85) + VIP ($225)

7. **AI Engineering Summit** (Technology)
   - Manhattan Conference Center
   - AI implementation conference
   - Individual ($599) + Team 5-pack ($2499)

8. **Digital Art Expo** (Art)
   - Chelsea Gallery District
   - Digital art exhibitions
   - General Admission ($35)

## Troubleshooting

### "No organizer found"
You need to create an organizer account first. See Step 3 above.

### "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
Check your `.env` file has the correct values from Supabase dashboard.

### "Error seeding data"
- Make sure migrations are applied first
- Check your service role key has admin permissions
- Verify your Supabase project is active

### Events not showing in frontend
- Check that events have `status: 'published'`
- Verify the frontend `.env` has the correct Supabase URL and anon key
- Check browser console for errors

## Manual Seeding (Alternative)

If you prefer to run the full SQL seed file:

```bash
# Using psql (if installed)
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" -f supabase/seed.sql

# Or use Supabase SQL Editor
# 1. Go to https://app.supabase.com/project/_/sql
# 2. Create new query
# 3. Paste contents of supabase/seed.sql
# 4. Run query
```

The full seed file includes test users:
- `admin@northstar.dev` / `Password1!`
- `organizer@northstar.dev` / `Password1!`
- `attendee@northstar.dev` / `Password1!`

## Next Steps

After seeding:

1. Visit your frontend at `http://localhost:3000`
2. Browse events at `/events`
3. Login as an organizer to manage events
4. Test the ticket purchasing flow
5. Check the attendee dashboard

## Need Help?

- Check the main `README.md` for full setup instructions
- Review `API.md` for API endpoint documentation
- Check Supabase logs in your dashboard

---

**Note:** This seed data is for development/demo purposes only. Never use these scripts or credentials in production.
