# Deployment Guide

Complete guide for deploying Northstar to production.

---

## Table of Contents

- [Environment Setup](#environment-setup)
- [Database Migration](#database-migration)
- [Stripe Configuration](#stripe-configuration)
- [Storage Configuration](#storage-configuration)
- [Deployment Platforms](#deployment-platforms)
- [Post-Deployment Checklist](#post-deployment-checklist)

---

## Environment Setup

### Required Environment Variables

#### Frontend (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### Obtaining Credentials

#### Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Navigate to Settings > API
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

#### Stripe

1. Go to [stripe.com/dashboard](https://dashboard.stripe.com)
2. Toggle to Live mode (top right)
3. Navigate to Developers > API keys
4. Copy:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY` (⚠️ Keep secret!)
5. For webhook secret, see [Stripe Configuration](#stripe-configuration)

---

## Database Migration

### Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Project linked: `supabase link --project-ref YOUR_PROJECT_REF`

### Migration Steps

1. **Link your project**
   ```bash
   cd backend
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. **Push all migrations**
   ```bash
   supabase db push
   ```

3. **Verify migrations**
   ```bash
   supabase db remote diff
   # Should show no differences
   ```

4. **Load seed data (optional, dev only)**
   ```bash
   psql "YOUR_DATABASE_URL" -f supabase/seed.sql
   ```

### Migration Order

Migrations run in order:

1. `001_profiles.sql` - User profiles and roles
2. `002_categories.sql` - Event categories
3. `003_events.sql` - Events table
4. `004_ticket_types.sql` - Ticket types and inventory
5. `005_orders.sql` - Orders and order items
6. `006_tickets.sql` - Tickets and RPCs
7. `007_registrations.sql` - RSVP registrations
8. `008_transfers.sql` - Ticket transfers
9. `009_check_ins.sql` - Check-in audit trail
10. `010_notifications.sql` - Notifications
11. `011_rls.sql` - Row Level Security
12. `012_storage.sql` - Storage buckets
13. `013_webhook_events.sql` - Webhook tracking
14. `014_refunds.sql` - Refund system
15. `015_promo_codes.sql` - Promo codes
16. `016_waitlist.sql` - Waitlist system
17. `017_performance_indexes.sql` - Performance indexes

### Rollback

```bash
# Revert last migration
supabase db reset

# Reset to specific migration
supabase db reset --version 20240315000000
```

---

## Stripe Configuration

### Webhook Setup

1. **Create webhook endpoint**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Click "Add endpoint"
   - Enter URL: `https://yourdomain.com/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `payment_intent.payment_failed`

2. **Get webhook secret**
   - After creating endpoint, click "Reveal" under "Signing secret"
   - Copy to `STRIPE_WEBHOOK_SECRET`

3. **Test webhook (local development)**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

### Payment Settings

Configure in Stripe Dashboard:

1. **Business settings**
   - Company name
   - Support email
   - Business address

2. **Branding**
   - Logo
   - Brand colors
   - Custom email templates

3. **Checkout settings**
   - Success/cancel URLs (handled by app)
   - Payment methods (card, Apple Pay, Google Pay)

---

## Storage Configuration

### Supabase Storage Buckets

Already created by `012_storage.sql`:

- `event-images` - Event cover images
- `avatars` - User profile pictures

### Bucket Policies

```sql
-- Event images: Public read, owner write
CREATE POLICY "Public read event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

CREATE POLICY "Organizers upload event images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-images' AND auth.uid() = owner);

-- Avatars: Public read, owner write
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid() = owner);
```

### File Upload Limits

Configure in Supabase Dashboard > Storage > Settings:

- Max file size: 5MB (images)
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

---

## Deployment Platforms

### Vercel (Recommended)

**Advantages:**
- Zero-config Next.js deployment
- Automatic HTTPS
- Edge network (CDN)
- Preview deployments for PRs

**Steps:**

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Link project**
   ```bash
   cd frontend
   vercel link
   ```

3. **Set environment variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL production
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
   vercel env add STRIPE_SECRET_KEY production
   vercel env add STRIPE_WEBHOOK_SECRET production
   vercel env add NEXT_PUBLIC_APP_URL production
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Configure custom domain** (optional)
   - Vercel Dashboard > Project > Settings > Domains
   - Add your domain
   - Update DNS records as instructed

### Alternative: Self-Hosted (Docker)

**Dockerfile:**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**docker-compose.yml:**

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '3000:3000'
    env_file:
      - .env.production
    restart: unless-stopped
```

**Deploy:**

```bash
docker compose up -d
```

---

## Post-Deployment Checklist

### Verification

- [ ] App loads at production URL
- [ ] All environment variables set correctly
- [ ] Database migrations applied
- [ ] Stripe webhooks receiving events
- [ ] Image uploads work
- [ ] Email verification works
- [ ] Checkout flow completes
- [ ] QR code scanning works

### Security

- [ ] Service role key not exposed to client
- [ ] HTTPS enabled (Vercel automatic)
- [ ] Security headers configured
- [ ] RLS policies active
- [ ] Webhook signature verification working
- [ ] CORS configured correctly

### Monitoring

- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring (Vercel, UptimeRobot)
- [ ] Database performance monitoring
- [ ] Stripe webhook delivery monitoring
- [ ] Log aggregation service connected

### Performance

- [ ] Run Lighthouse audit (score > 90)
- [ ] Test on slow network (throttling)
- [ ] Verify image optimization
- [ ] Check bundle size (`npm run build`)
- [ ] Enable CDN/edge caching
- [ ] Database indexes applied

### Testing

- [ ] Test registration flow
- [ ] Test ticket purchase (test mode first!)
- [ ] Test transfer flow
- [ ] Test refund flow
- [ ] Test organizer event creation
- [ ] Test admin functions
- [ ] Test on mobile devices
- [ ] Test with screen reader

---

## Maintenance

### Database Backups

**Supabase automatic backups:**
- Daily backups enabled by default (paid plans)
- Point-in-time recovery available
- Download backups: Dashboard > Database > Backups

**Manual backup:**

```bash
pg_dump "YOUR_DATABASE_URL" > backup.sql
```

**Restore:**

```bash
psql "YOUR_DATABASE_URL" < backup.sql
```

### Updates

**Dependencies:**

```bash
npm update
npm audit fix
```

**Database migrations:**

```bash
# Create new migration
supabase migration new my_change

# Apply migration
supabase db push
```

### Monitoring Checklist

**Daily:**
- [ ] Check error rate
- [ ] Check webhook delivery rate
- [ ] Check payment success rate

**Weekly:**
- [ ] Review security logs
- [ ] Check slow database queries
- [ ] Review user feedback

**Monthly:**
- [ ] Dependency updates
- [ ] Security audit
- [ ] Performance review
- [ ] Backup restoration test

---

## Troubleshooting

### Common Issues

**1. "Webhook signature verification failed"**

- Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Check webhook endpoint URL is correct
- Verify raw body is used (not parsed JSON)

**2. "Service role key not defined"**

- Set `SUPABASE_SERVICE_ROLE_KEY` in environment
- Restart application after setting env vars
- Never prefix with `NEXT_PUBLIC_`

**3. "RLS policy blocks access"**

- Check user is authenticated: `auth.uid()` not null
- Verify policy conditions match query
- Test with service role (bypasses RLS)

**4. "Image upload fails"**

- Check storage bucket exists
- Verify bucket policies allow upload
- Check file size < 5MB
- Verify MIME type allowed

**5. "Migrations fail"**

- Check migration order (dependencies)
- Look for conflicting constraints
- Review error message for specific issue
- Try: `supabase db reset` and re-apply

---

## Scaling Considerations

### Database

- Enable connection pooling (Supabase default)
- Monitor slow queries
- Add indexes for new query patterns
- Consider read replicas for high traffic

### Application

- Use Vercel's Edge Functions for low latency
- Enable ISR (Incremental Static Regeneration)
- Implement proper caching headers
- Use CDN for static assets

### Monitoring

- Set up alerting for:
  - Error rate > 1%
  - Response time > 2s
  - Webhook failure rate > 5%
  - Database CPU > 80%

---

## Support

**Supabase:**
- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com
- Support: support@supabase.io

**Stripe:**
- Documentation: https://stripe.com/docs
- Support: https://support.stripe.com

**Vercel:**
- Documentation: https://vercel.com/docs
- Support: https://vercel.com/support

---

**Last Updated:** Phase 9
**Deployment Platform:** Vercel (recommended)
**Database:** Supabase PostgreSQL
**Payments:** Stripe Checkout
