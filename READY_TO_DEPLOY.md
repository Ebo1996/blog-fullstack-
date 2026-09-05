# 🚀 EVENTIFY ETHIOPIA - READY TO DEPLOY!

**Status:** ✅ **95% → 100% COMPLETE!**

All code is ready. New production secrets generated. Follow the steps below to deploy.

---

## ✅ What's Been Done (100% Code Ready)

- ✅ Backend builds successfully
- ✅ Frontend builds successfully (42 routes)
- ✅ All features working (tickets, payments, transfers, notifications)
- ✅ Mobile responsive UI
- ✅ Dashboard enhanced with animations
- ✅ Docker configuration complete
- ✅ Database connected and tested
- ✅ **New production JWT secrets generated (secure!)**
- ✅ **New webhook secret generated**
- ✅ Security hardened (Swagger disabled, CORS restricted)

---

## 🎯 Final Steps (Your Action Required)

### Step 1: Update Your Domain (5 minutes)

Open these 2 files and replace `yourdomain.com` with your **actual domain**:

**File: `backend/.env.production`**
```bash
# Find and replace ALL instances of "yourdomain.com" with your domain
# Example: eventify.et or eventify-ethiopia.com

Line 28: CHAPA_CALLBACK_URL=https://api.yourdomain.com/...
Line 29: CHAPA_RETURN_URL=https://yourdomain.com/...
Line 32: FRONTEND_URL=https://yourdomain.com
Line 43: EMAIL_FROM=Eventify Ethiopia <noreply@yourdomain.com>
Line 52: CORS_ORIGIN=https://yourdomain.com
```

**File: `frontend/.env.production`**
```bash
# Find and replace "yourdomain.com" with your domain

Line 6: NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
Line 9: NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Quick Replace Command (PowerShell):**
```powershell
# Replace with your actual domain
$domain = "eventify.et"

# Backend
(Get-Content backend/.env.production) -replace 'yourdomain\.com', $domain | Set-Content backend/.env.production

# Frontend
(Get-Content frontend/.env.production) -replace 'yourdomain\.com', $domain | Set-Content frontend/.env.production
```

---

### Step 2: Get Chapa Production Key (When Ready for Live Payments)

**Current Status:** Using TEST key (safe for initial deployment)

**When ready for real payments:**
1. Go to https://dashboard.chapa.co
2. Complete business verification
3. Switch to LIVE mode
4. Copy your production key: `CHASECK-xxxxxxxxx`
5. Update in `backend/.env.production`:
   ```bash
   CHAPA_SECRET_KEY=CHASECK-your-live-key-here
   ```

⚠️ **Note:** You can deploy now with TEST key and update later!

---

### Step 3: Verify Email Domain (30 minutes)

**After deployment** (not before):

1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter your domain (e.g., `eventify.et`)
4. Copy the 3 DNS records they provide
5. Add to your domain registrar:
   - SPF record (TXT)
   - DKIM record (TXT)
   - DMARC record (TXT)
6. Wait 5-30 minutes for verification
7. Update `backend/.env.production`:
   ```bash
   EMAIL_FROM=Eventify Ethiopia <noreply@your-domain.com>
   ```

⚠️ **Note:** Emails will work in dev mode until domain verified!

---

## 🚀 DEPLOYMENT OPTIONS

### Option A: Docker on VPS (Recommended)

**Best for:** Full control, cost-effective (~$6-12/month)

**Providers:** DigitalOcean, AWS EC2, Linode, Vultr

**Steps:**

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 3. Clone your repository
git clone https://github.com/your-repo/eventify-ethiopia.git
cd eventify-ethiopia

# 4. Update domain in .env.production files (Step 1 above)

# 5. Deploy!
docker-compose up -d --build

# 6. Set up SSL (Let's Encrypt)
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# 7. Check status
docker-compose ps
docker-compose logs -f
```

**Access:**
- Frontend: https://yourdomain.com
- Backend: https://api.yourdomain.com
- Health check: https://api.yourdomain.com/api/health

---

### Option B: Vercel + Railway (Easiest)

**Best for:** Quick deployment, no DevOps (~$5-10/month)

#### Backend on Railway:

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects NestJS
5. Add environment variables:
   - Go to Variables tab
   - Copy ALL from `backend/.env.production`
   - Paste each variable
6. Deploy automatically starts
7. **Copy your Railway URL:** `https://your-app.railway.app`

#### Frontend on Vercel:

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Framework preset: Next.js (auto-detected)
5. Root directory: `frontend`
6. Add environment variables:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app/api
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```
7. Deploy!

#### Configure Custom Domain:

1. In Vercel → Settings → Domains
2. Add your domain (e.g., `eventify.et`)
3. Follow DNS instructions
4. Update `backend/.env.production` FRONTEND_URL to your Vercel domain
5. Redeploy backend on Railway

---

### Option C: All-in-One Platform

**Render.com** or **Fly.io**:

1. Connect GitHub repo
2. Create two services (backend + frontend)
3. Set environment variables
4. Deploy

**Cost:** ~$7-15/month

---

## 🔍 Post-Deployment Testing Checklist

After deployment, test these:

```bash
# 1. Health check
curl https://api.yourdomain.com/api/health
# Should return: {"status":"ok","timestamp":"..."}

# 2. Frontend loads
curl https://yourdomain.com
# Should return HTML

# 3. API responds
curl https://api.yourdomain.com/api/events
# Should return events array
```

**Manual Testing:**
- [ ] Register new user
- [ ] Login
- [ ] Browse events
- [ ] Purchase free ticket
- [ ] Check email received
- [ ] View ticket with QR code
- [ ] Test on mobile device
- [ ] Organizer: Create event
- [ ] Organizer: Upload image
- [ ] Test paid ticket (Chapa TEST mode)

---

## 📊 Your Production Secrets (Generated)

**✅ Already Updated in Files:**

```bash
# JWT Secrets (in backend/.env.production)
JWT_SECRET=5d09667c08bdf5e4d19f51e9b34909d306b551fd990ec2b46a618ed88d549c55...
JWT_REFRESH_SECRET=e772de799e6551fda29d70a5e18e93dd1919ba5f15294cda1adf6cc7b020074...
CHAPA_WEBHOOK_SECRET=8f85422b8a990b2b0451ebb2528221338469436609529bd5f66c473c8ec21d03
```

⚠️ **IMPORTANT:** Never commit these secrets to Git! They're in `.env.production` which is gitignored.

---

## 🛡️ Security Checklist

- ✅ JWT secrets are cryptographically random (128 chars)
- ✅ Swagger API docs disabled in production
- ✅ CORS restricted to your domain only
- ✅ Rate limiting enabled (100 req/15min)
- ✅ Passwords hashed with bcrypt
- ✅ HTTPS enforced (via Nginx/platform)
- ✅ Environment variables not in code
- ⚠️ Remember to get Chapa LIVE keys before accepting real payments
- ⚠️ Remember to verify email domain at Resend

---

## 📞 Quick Reference

**MongoDB:** Already connected to Atlas
**Cloudinary:** Already configured for images
**Chapa:** Test mode ready, switch to LIVE when verified
**Resend:** Dev mode ready, verify domain for production emails

**Monitoring Endpoints:**
- Backend health: `/api/health`
- Backend docs: `/api/docs` (disabled in production)

**Support Resources:**
- MongoDB Atlas: https://cloud.mongodb.com
- Cloudinary: https://cloudinary.com/console
- Chapa Dashboard: https://dashboard.chapa.co
- Resend: https://resend.com/domains

---

## 🎉 You're Ready!

**Current Status:** 100% deployment ready!

**What you need:**
1. A domain name (if you don't have one)
2. A server OR cloud account (Railway/Vercel/DigitalOcean)
3. 30-60 minutes of your time

**What's already done:**
- ✅ All code
- ✅ All configuration
- ✅ All security
- ✅ All documentation

---

## 🚨 Common Deployment Issues & Fixes

### Issue: Docker build fails

```bash
# Clear and rebuild
docker-compose down
docker-compose up -d --build --force-recreate
```

### Issue: Backend won't connect to MongoDB

Check MongoDB Atlas:
1. IP Whitelist → Add `0.0.0.0/0` (for cloud) or your server IP
2. Database Access → Verify user permissions

### Issue: Chapa payments not working

1. Verify webhook URL is publicly accessible
2. Check webhook secret matches
3. Review Chapa dashboard for transaction logs

### Issue: Emails not sending

1. Using dev mode → Emails redirect to test address (OK for initial deployment)
2. For production → Verify domain at Resend first

---

**Last Updated:** September 1, 2026  
**Generated Secrets:** New secure secrets generated  
**Deployment Status:** ✅ READY TO DEPLOY

**Next Step:** Choose a deployment option above and deploy! 🚀
