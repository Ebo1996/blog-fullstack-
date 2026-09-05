# 🚀 Deploy Eventify Ethiopia - Vercel + Render

**Frontend:** Vercel (Free tier available)  
**Backend:** Render (Free tier available)  
**Time Required:** 30-45 minutes

---

## 📋 Pre-Deployment Checklist

Before you start, make sure you have:

- [ ] GitHub account (to connect repositories)
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Render account (sign up at https://render.com)
- [ ] Your code pushed to GitHub
- [ ] Domain name (optional, can use provided subdomains)

---

## 🎯 PART 1: Deploy Backend to Render (15 minutes)

### Step 1.1: Push Code to GitHub

```powershell
# If not already done
cd "c:\Users\HP\Documents\GitHub\New folder\navigation\eventify-ethiopia"

git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 1.2: Create Render Account

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended)
4. Authorize Render to access your repositories

### Step 1.3: Create New Web Service

1. Click "New +" → "Web Service"
2. Connect your repository: `eventify-ethiopia`
3. Configure the service:

```
Name: eventify-backend
Region: Choose closest to your users (e.g., Oregon, Frankfurt)
Branch: main
Root Directory: backend
Runtime: Node
Build Command: npm install && npm run build
Start Command: node dist/main.js
Instance Type: Free (or Starter $7/month for better performance)
```

### Step 1.4: Add Environment Variables

Click "Advanced" → "Add Environment Variable" and add these **one by one**:

```bash
# Application
NODE_ENV=production
PORT=3001

# Database
MONGODB_URI=mongodb+srv://melalabirhanu285_db_user:0nMAIxnpBUI8UomN@cluster0.g8pncn1.mongodb.net/eventify?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=eventify

# JWT Secrets (from backend/.env.production)
JWT_SECRET=5d09667c08bdf5e4d19f51e9b34909d306b551fd990ec2b46a618ed88d549c55ac38bded0ef19e96048e0c7068a6a311fb6fa23ca98a67310fd0742039ad87a1
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=e772de799e6551fda29d70a5e18e93dd1919ba5f15294cda1adf6cc7b020074996164db5799fac7bfe484c006b61a8432cf89a97bb7d92c47d60d1c5ac02a528
JWT_REFRESH_EXPIRES_IN=7d

# Chapa Payment
CHAPA_SECRET_KEY=CHASECK_TEST-w2ls9o3vPhrqtdbsOLPhinab8PHKgpsD
CHAPA_WEBHOOK_SECRET=8f85422b8a990b2b0451ebb2528221338469436609529bd5f66c473c8ec21d03
CHAPA_BASE_URL=https://api.chapa.co/v1
CHAPA_CALLBACK_URL=https://eventify-backend.onrender.com/api/payments/chapa/callback
CHAPA_RETURN_URL=https://your-frontend-url.vercel.app/payment/success

# Frontend URL (UPDATE after deploying frontend)
FRONTEND_URL=https://your-frontend-url.vercel.app

# Cloudinary
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=jn4eunye
CLOUDINARY_API_KEY=169766247288789
CLOUDINARY_API_SECRET=ncR7lpz0fCWqugpJbzQl9uY_SQQ

# Email
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=YOUR_RESEND_API_KEY_HERE
EMAIL_FROM=Eventify Ethiopia <onboarding@resend.dev>
RESEND_API_KEY=YOUR_RESEND_API_KEY_HERE

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
SWAGGER_ENABLED=false
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

⚠️ **Note:** You'll update `FRONTEND_URL`, `CHAPA_RETURN_URL`, and `CORS_ORIGIN` after deploying the frontend!

### Step 1.5: Deploy Backend

1. Click "Create Web Service"
2. Wait 5-10 minutes for build and deployment
3. **Copy your backend URL:** `https://eventify-backend.onrender.com`
4. Test health check: `https://eventify-backend.onrender.com/api/health`

✅ **Backend deployed!**

---

## 🎨 PART 2: Deploy Frontend to Vercel (10 minutes)

### Step 2.1: Create Vercel Account

1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)
4. Authorize Vercel to access your repositories

### Step 2.2: Import Project

1. Click "Add New..." → "Project"
2. Import your repository: `eventify-ethiopia`
3. Configure project:

```
Framework Preset: Next.js (auto-detected)
Root Directory: frontend
Build Command: npm run build (auto-detected)
Output Directory: .next (auto-detected)
Install Command: npm install (auto-detected)
```

### Step 2.3: Add Environment Variables

Click "Environment Variables" and add:

```bash
# Backend API URL (use your Render backend URL)
NEXT_PUBLIC_API_URL=https://eventify-backend.onrender.com/api

# App URL (use your Vercel URL after deployment)
NEXT_PUBLIC_APP_URL=https://eventify-ethiopia.vercel.app
```

⚠️ **Important:** Replace `eventify-backend.onrender.com` with YOUR actual Render URL!

### Step 2.4: Deploy Frontend

1. Click "Deploy"
2. Wait 3-5 minutes for build and deployment
3. **Copy your frontend URL:** `https://eventify-ethiopia.vercel.app`
4. Visit the URL to see your app live!

✅ **Frontend deployed!**

---

## 🔄 PART 3: Connect Frontend & Backend (5 minutes)

Now that both are deployed, you need to update the backend to allow the frontend domain.

### Step 3.1: Update Render Environment Variables

1. Go to Render Dashboard → eventify-backend
2. Click "Environment" tab
3. Update these variables:

```bash
FRONTEND_URL=https://eventify-ethiopia.vercel.app
CHAPA_RETURN_URL=https://eventify-ethiopia.vercel.app/payment/success
CORS_ORIGIN=https://eventify-ethiopia.vercel.app
```

Replace with YOUR actual Vercel URL!

### Step 3.2: Redeploy Backend

1. After updating environment variables
2. Render automatically redeploys (or click "Manual Deploy")
3. Wait 2-3 minutes

### Step 3.3: Update Chapa Webhook

1. Go to https://dashboard.chapa.co
2. Settings → Webhooks
3. Set webhook URL: `https://eventify-backend.onrender.com/api/payments/chapa/webhook`
4. Save

✅ **Everything connected!**

---

## 🎉 PART 4: Test Your Deployment (5 minutes)

### Test Backend

Open in browser:
```
https://eventify-backend.onrender.com/api/health
```

Should return:
```json
{"status":"ok","timestamp":"2026-09-01T...","uptime":123.45}
```

### Test Frontend

1. Visit: `https://eventify-ethiopia.vercel.app`
2. You should see the homepage with events
3. Try registering a new user
4. Try logging in
5. Browse events
6. Test mobile responsiveness

### Test Full Flow

- [ ] Register new user
- [ ] Login successfully
- [ ] Browse events
- [ ] Purchase a free ticket
- [ ] Check if email received
- [ ] View ticket with QR code
- [ ] Test on mobile device

---

## 🌐 PART 5: Custom Domain (Optional - 15 minutes)

### For Frontend (Vercel)

1. Go to Vercel → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `eventify.et`
4. Vercel will provide DNS records
5. Add to your domain registrar:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel's IP)
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
6. Wait 5-60 minutes for DNS propagation
7. SSL certificate auto-generated by Vercel

### For Backend (Render)

1. Go to Render → eventify-backend → Settings → Custom Domain
2. Click "Add Custom Domain"
3. Enter: `api.eventify.et`
4. Render provides a CNAME record
5. Add to your domain registrar:
   ```
   Type: CNAME
   Name: api
   Value: eventify-backend.onrender.com
   ```
6. Wait for DNS propagation
7. SSL certificate auto-generated by Render

### Update Environment Variables After Custom Domain

**Render (Backend):**
```bash
FRONTEND_URL=https://eventify.et
CHAPA_RETURN_URL=https://eventify.et/payment/success
CORS_ORIGIN=https://eventify.et
```

**Vercel (Frontend):**
```bash
NEXT_PUBLIC_API_URL=https://api.eventify.et/api
NEXT_PUBLIC_APP_URL=https://eventify.et
```

Redeploy both services after updating.

---

## 📊 Cost Breakdown

### Free Tier (Both Render & Vercel)

**Render Free:**
- ✅ Backend hosting
- ⚠️ Spins down after 15 min inactivity (30-60 sec cold start)
- ⚠️ 750 hours/month (enough for testing)

**Vercel Free:**
- ✅ Frontend hosting
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ SSL certificate
- ✅ Fast global CDN

**Total: $0/month** (Good for testing & low traffic)

### Paid Tier (Recommended for Production)

**Render Starter:**
- 💰 $7/month
- ✅ Always on (no cold starts)
- ✅ 512 MB RAM
- ✅ Better for production

**Vercel Pro:**
- 💰 $20/month
- ✅ 1 TB bandwidth
- ✅ Priority support
- ✅ Better analytics

**Total: $27/month** (Production-ready)

---

## 🐛 Troubleshooting

### Backend Build Fails on Render

**Error:** `Cannot find module 'dist/main.js'`

**Fix:**
```
Build Command: npm install && npm run build
Start Command: node dist/main.js
```

### Frontend Build Fails on Vercel

**Error:** `ECONNREFUSED during build`

**Fix:** This is normal - frontend tries to fetch data during build. Add:

File: `frontend/next.config.js`
```javascript
module.exports = {
  // ... existing config
  output: 'standalone', // Add this
}
```

Then redeploy.

### CORS Errors in Browser

**Error:** `Access-Control-Allow-Origin`

**Fix:** Update `CORS_ORIGIN` in Render to match your Vercel URL exactly (including https://)

### Backend Health Check Fails

**Error:** 503 Service Unavailable

**Cause:** Render free tier spins down after inactivity

**Fix:** 
- First request may take 30-60 seconds (cold start)
- Or upgrade to Render Starter ($7/month)

### MongoDB Connection Issues

**Error:** `MongoNetworkError`

**Fix:**
1. Go to MongoDB Atlas
2. Network Access → Add `0.0.0.0/0` to IP whitelist
3. Database Access → Verify user has read/write permissions

---

## 🔄 How to Redeploy Updates

### Update Backend (Render)

```powershell
# Make your changes
git add .
git commit -m "Update backend"
git push origin main
```

Render auto-deploys on git push!

### Update Frontend (Vercel)

```powershell
# Make your changes
git add .
git commit -m "Update frontend"
git push origin main
```

Vercel auto-deploys on git push!

### Manual Redeploy

**Render:** Dashboard → eventify-backend → "Manual Deploy" button  
**Vercel:** Dashboard → Project → Deployments → "Redeploy"

---

## 📱 Mobile Testing

Your app is now accessible from anywhere!

**On your phone:**
1. Open browser
2. Visit: `https://eventify-ethiopia.vercel.app`
3. Test all features
4. Add to home screen for app-like experience

---

## 🎯 Next Steps

### 1. Verify Email Domain (For Production Emails)

1. Go to https://resend.com/domains
2. Add your domain
3. Add DNS records to domain registrar
4. Wait for verification
5. Update `EMAIL_FROM` in Render environment variables

### 2. Get Chapa Production Keys

1. Go to https://dashboard.chapa.co
2. Complete business verification
3. Switch to LIVE mode
4. Update `CHAPA_SECRET_KEY` in Render

### 3. Set Up Monitoring

**Render:** Built-in monitoring in dashboard  
**Vercel:** Built-in analytics in dashboard  
**Optional:** Add Sentry for error tracking

---

## ✅ Deployment Complete!

Your Eventify Ethiopia is now live! 🎉

**Your URLs:**
- Frontend: `https://eventify-ethiopia.vercel.app`
- Backend: `https://eventify-backend.onrender.com`
- API Health: `https://eventify-backend.onrender.com/api/health`

**What's Working:**
- ✅ User registration & login
- ✅ Event browsing
- ✅ Ticket purchasing (free & paid)
- ✅ QR code generation
- ✅ Email notifications
- ✅ Mobile responsive
- ✅ Image uploads
- ✅ Payment processing (Chapa)

**Support:**
- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- Your deployment guide: `READY_TO_DEPLOY.md`

---

**Deployed:** September 1, 2026  
**Status:** ✅ Production Ready  
**Auto-Deploy:** ✅ Enabled (git push)
