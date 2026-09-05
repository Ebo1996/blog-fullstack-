# ⚡ Quick Start: Deploy to Vercel + Render

**Time:** 30 minutes | **Cost:** Free tier available

---

## ✅ Pre-Flight Check

```powershell
# 1. Make sure code is pushed to GitHub
cd "c:\Users\HP\Documents\GitHub\New folder\navigation\eventify-ethiopia"
git status
git push origin main

# 2. Verify builds work locally
cd backend
npm run build  # Should complete without errors

cd ../frontend
npm run build  # May show fetch errors (OK for now)
```

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend (Render) - 15 min

1. **Sign up:** https://render.com (use GitHub login)

2. **Create Web Service:**
   - New + → Web Service
   - Connect repository: `eventify-ethiopia`
   - Settings:
     ```
     Name: eventify-backend
     Root Directory: backend
     Build Command: npm install && npm run build
     Start Command: node dist/main.js
     ```

3. **Add Environment Variables:**
   - Copy from `backend/.env.production`
   - Update these after frontend deployment:
     - `FRONTEND_URL`
     - `CORS_ORIGIN`
     - `CHAPA_RETURN_URL`

4. **Deploy** → Copy URL: `https://eventify-backend.onrender.com`

### Step 2: Deploy Frontend (Vercel) - 10 min

1. **Sign up:** https://vercel.com (use GitHub login)

2. **Import Project:**
   - Add New → Project
   - Import: `eventify-ethiopia`
   - Root Directory: `frontend`

3. **Add Environment Variables:**
   ```bash
   NEXT_PUBLIC_API_URL=https://eventify-backend.onrender.com/api
   NEXT_PUBLIC_APP_URL=https://eventify-ethiopia.vercel.app
   ```
   ⚠️ Use YOUR actual Render URL!

4. **Deploy** → Copy URL: `https://eventify-ethiopia.vercel.app`

### Step 3: Connect Them - 5 min

1. **Update Render backend:**
   - Go to Render → eventify-backend → Environment
   - Update:
     ```bash
     FRONTEND_URL=https://eventify-ethiopia.vercel.app
     CORS_ORIGIN=https://eventify-ethiopia.vercel.app
     CHAPA_RETURN_URL=https://eventify-ethiopia.vercel.app/payment/success
     ```
   - Save (auto-redeploys)

2. **Test:**
   - Visit: `https://eventify-ethiopia.vercel.app`
   - Register → Login → Browse events ✅

---

## 🎯 That's It!

**Live URLs:**
- 🎨 Frontend: `https://eventify-ethiopia.vercel.app`
- ⚙️ Backend: `https://eventify-backend.onrender.com/api/health`

**Auto-Deploy Enabled:**
```powershell
git push origin main  # Automatically deploys to both!
```

---

## 📚 Full Guide

For detailed instructions, troubleshooting, and custom domains:
→ Read `DEPLOY_VERCEL_RENDER.md`

---

## ⚠️ First Request Takes Time

Render free tier spins down after inactivity.
First request may take 30-60 seconds (cold start).

**Solution:** Upgrade to Render Starter ($7/mo) for always-on.

---

**Need Help?** Check `DEPLOY_VERCEL_RENDER.md` for troubleshooting!
