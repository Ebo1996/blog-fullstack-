# Google OAuth - Production Environment Variables

## Render (Backend)

Go to: https://dashboard.render.com → eventify-ethiopia → Environment

**Add these 3 environment variables:**

```
GOOGLE_CLIENT_ID=<your_client_id_from_google_cloud>

GOOGLE_CLIENT_SECRET=<your_client_secret_from_google_cloud>

GOOGLE_CALLBACK_URL=https://eventify-ethiopia-psi.vercel.app
```

Click **"Save Changes"** - Render will redeploy automatically (~2 minutes)

---

## Vercel (Frontend)

Go to: https://vercel.com → eventify-ethiopia → Settings → Environment Variables

**Add this 1 environment variable:**

```
Name: NEXT_PUBLIC_GOOGLE_CLIENT_ID
Value: <your_client_id_from_google_cloud>
```

Click **"Save"**

Then go to Deployments → Click the "..." menu → **"Redeploy"** (~2 minutes)

---

## ✅ Once Both Are Deployed:

1. Go to: https://eventify-ethiopia-psi.vercel.app/register
2. Click "Continue with Google"
3. Sign in with your Google account
4. You'll be logged in automatically! 🎉

---

## Local Testing (Already Configured!)

Your local files are already set up:
- ✅ `backend/.env` - has Google OAuth credentials
- ✅ `frontend/.env.local` - has Google Client ID

**To test locally:**
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

Then go to: http://localhost:3000/register and click "Continue with Google"!
