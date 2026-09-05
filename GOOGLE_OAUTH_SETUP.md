# Google OAuth Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Name it "Eventify Ethiopia"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click **Enable**

## Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: **Eventify Ethiopia**
   - User support email: your email
   - Developer contact: your email
   - Add scopes: `email`, `profile`
4. Create OAuth client ID:
   - Application type: **Web application**
   - Name: **Eventify Ethiopia Web**
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://eventify-ethiopia-psi.vercel.app` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000` (development)
     - `https://eventify-ethiopia-psi.vercel.app` (production)
5. Click **CREATE**
6. Copy the **Client ID** and **Client Secret**

## Step 4: Add Environment Variables

### Backend (.env)
```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
```

### Production (Render)
Add these environment variables:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL=https://eventify-ethiopia-psi.vercel.app`

### Production (Vercel)
Add this environment variable:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Step 5: Test

1. Start backend: `cd backend && npm run start:dev`
2. Start frontend: `cd frontend && npm run dev`
3. Go to `http://localhost:3000/register` or `/login`
4. Click "Continue with Google"
5. Sign in with your Google account
6. You should be redirected to the dashboard!

## Features

✅ **Sign up with Google** - Creates new account
✅ **Sign in with Google** - Logs in existing account  
✅ **One-Tap Sign In** - Quick Google sign-in popup
✅ **Account Linking** - Links Google to existing email account
✅ **Email Pre-verified** - Google emails are automatically verified
✅ **Profile Picture** - Uses Google profile picture
✅ **No Password Required** - OAuth users don't need passwords

## Security

- Google tokens are verified server-side
- JWT tokens are generated after verification
- Google ID is stored for account linking
- Existing accounts with same email are linked automatically

---

**Note:** For production, make sure to update the authorized origins and redirect URIs in Google Cloud Console to include your production domains.
