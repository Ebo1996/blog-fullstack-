# 🚀 Deployment Guide

Quick guide to deploy the event ticketing platform to production.

## Prerequisites

- Supabase project (production)
- Chapa account with **LIVE** API key
- Resend account for emails
- Vercel/Netlify account (or your hosting provider)
- Domain name (for webhooks)

---

## Step 1: Database Setup

### 1.1 Link to Production Supabase

```bash
cd backend
supabase link --project-ref your-production-project-ref
```

### 1.2 Apply Migrations

```bash
supabase db push
```

This applies:
- ✅ All table schemas
- ✅ RLS policies
- ✅ Storage buckets (event-images, avatars)
- ✅ Renamed payment columns

### 1.3 Verify in Supabase Dashboard

1. Go to **Table Editor** → Check tables exist
2. Go to **Storage** → Verify `event-images` and `avatars` buckets
3. Go to **Authentication** → Enable Email provider

---

## Step 2: Environment Variables

### 2.1 Get Your Keys

**Supabase:**
- Go to Project Settings → API
- Copy `Project URL` and `anon public` key
- Copy `service_role` key (keep secret!)

**Chapa:**
- Go to https://dashboard.chapa.co
- Get your **LIVE** API key (starts with `CHASECK-`)
- ⚠️ Don't use TEST key in production!

**Resend:**
- Go to https://resend.com/api-keys
- Create new API key

### 2.2 Set in Vercel/Hosting

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...  # ⚠️ Keep secret!
CHAPA_SECRET_KEY=CHASECK-your-live-key  # ⚠️ LIVE key!
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # ⚠️ Your domain!

# Recommended
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=Northstar <noreply@yourdomain.com>
```

### 2.3 Verify Validation Works

After deployment, check logs for:
```
✅ Environment variables validated successfully
   💳 Chapa: LIVE mode
```

If you see errors, the app won't start (by design).

---

## Step 3: Deploy Frontend

### Option A: Vercel (Recommended)

```bash
cd frontend
vercel --prod
```

Or connect your GitHub repo to Vercel for auto-deploys.

### Option B: Netlify

```bash
cd frontend
npm run build
netlify deploy --prod
```

### Option C: Docker

```bash
cd frontend
docker build -t eventplatform .
docker run -p 3000:3000 eventplatform
```

---

## Step 4: Test the Deployment

### 4.1 Basic Checks

✅ Site loads at your domain  
✅ Can create account  
✅ Can browse events  
✅ Environment validation passed (check logs)

### 4.2 Payment Flow Test

1. **Create test event** (as organizer)
2. **Purchase ticket** with Chapa test card:
   - Card: `5299 1234 5678 9012`
   - CVV: Any 3 digits
   - Expiry: Any future date
3. **Verify webhook** receives callback
4. **Check email** arrives
5. **View ticket** in dashboard

Expected result:
- ✅ Order created
- ✅ Payment processed
- ✅ Webhook called
- ✅ Tickets created
- ✅ Emails sent
- ✅ Order visible in dashboard

### 4.3 Upload Test

1. **Upload event image** (as organizer)
2. **Upload avatar** (any user)
3. **Verify images** load correctly

### 4.4 Rate Limit Test

Make 11 rapid checkout requests:
```bash
for i in {1..11}; do curl -X POST https://yourdomain.com/api/checkout; done
```

Expected: 11th request gets `429 Too Many Requests`

---

## Step 5: Production Checklist

### Security ✅

- [ ] Supabase RLS policies enabled
- [ ] Service role key is secret (not in client code)
- [ ] HTTPS enabled on domain
- [ ] CORS configured correctly
- [ ] Rate limiting working

### Monitoring ✅

- [ ] Set up Sentry for error tracking (optional)
- [ ] Set up UptimeRobot for uptime monitoring
- [ ] Monitor Chapa dashboard for webhook failures
- [ ] Monitor Resend dashboard for email bounces

### Performance ✅

- [ ] Images optimized (WebP format)
- [ ] CDN configured (Vercel/Cloudflare)
- [ ] Database indexes created (done via migrations)
- [ ] Connection pooling configured (Supabase handles this)

---

## Step 6: Go Live!

### 6.1 Switch to Live Mode

Once testing passes:

1. **Update Chapa key** to live mode:
   ```bash
   CHAPA_SECRET_KEY=CHASECK-your-live-key
   ```

2. **Redeploy** to apply new env var

3. **Test with real payment** (small amount)

### 6.2 Launch Announcement

- Update DNS to point to your domain
- Announce on social media
- Send invites to early users
- Monitor for 24 hours

---

## Troubleshooting

### ❌ "Missing environment variable" error

- Check all required env vars are set
- Verify no typos in variable names
- Restart deployment after adding vars

### ❌ Webhook not receiving calls

- Verify `NEXT_PUBLIC_APP_URL` is your public domain
- Check Chapa dashboard for delivery failures
- Ensure `/api/webhooks/chapa` is publicly accessible
- Test webhook URL: `curl https://yourdomain.com/api/webhooks/chapa`

### ❌ Emails not sending

- Check Resend dashboard for logs
- Verify `RESEND_API_KEY` is set
- Check spam folder
- Verify domain is verified in Resend (for custom from addresses)

### ❌ Images not loading

- Check storage buckets are public in Supabase
- Verify RLS policies allow SELECT
- Check browser console for CORS errors

### ❌ "Too many requests" on legitimate traffic

- Adjust rate limits in `frontend/src/lib/monitoring/rate-limiter.ts`
- For high traffic, migrate to Redis-based rate limiting

---

## Rollback Plan

If something goes wrong:

### Option 1: Revert Deployment

```bash
vercel rollback  # Vercel
netlify rollback  # Netlify
```

### Option 2: Database Rollback

```bash
cd backend
supabase db reset --linked  # ⚠️ Destructive! Only if needed
```

### Option 3: Switch to Maintenance Mode

Create `/api/health/route.ts`:
```typescript
export async function GET() {
  return new Response('Maintenance', { status: 503 })
}
```

---

## Post-Launch Monitoring

### Day 1

- [ ] Monitor error logs every hour
- [ ] Check webhook delivery rate
- [ ] Verify email delivery rate
- [ ] Watch for rate limit hits

### Week 1

- [ ] Review Sentry errors
- [ ] Check database performance
- [ ] Monitor storage usage
- [ ] Review user feedback

### Month 1

- [ ] Analyze conversion rates
- [ ] Review payment success rate
- [ ] Optimize slow queries
- [ ] Plan feature updates

---

## Support

If you need help:
1. Check logs in Vercel/hosting dashboard
2. Check Supabase logs
3. Check Chapa dashboard
4. Review PRODUCTION_READINESS.md

---

## Success! 🎉

Your event platform is now live!

- ✅ Payments with Chapa
- ✅ Email notifications
- ✅ File uploads
- ✅ Rate limiting
- ✅ Database migrations applied

**Next steps:**
- Add more events
- Invite organizers
- Market to attendees
- Monitor and optimize

Good luck! 🚀
