# Eventify Ethiopia - Deployment Guide

Complete guide for deploying Eventify Ethiopia to production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Deployment Methods](#deployment-methods)
4. [Post-Deployment](#post-deployment)
5. [Monitoring & Maintenance](#monitoring--maintenance)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### 1. Run Pre-Flight Checks

```powershell
# Windows
.\scripts\preflight-check.ps1

# Linux/Mac
./scripts/preflight-check.sh
```

This validates:
- System dependencies (Node.js, Docker, MongoDB client)
- Environment files exist
- Critical environment variables are set
- Both applications build successfully
- System resources are adequate
- Network connectivity

### 2. Verify Environment Files

Ensure these files exist and are properly configured:
- `backend/.env.production`
- `frontend/.env.production`

Copy from templates:
```powershell
# Windows
Copy-Item backend\.env.production.example backend\.env.production
Copy-Item frontend\.env.production.example frontend\.env.production

# Linux/Mac
cp backend/.env.production.example backend/.env.production
cp frontend/.env.production.example frontend/.env.production
```

### 3. Security Checklist

- [ ] Changed JWT_SECRET to strong random value (64+ characters)
- [ ] Changed JWT_REFRESH_SECRET to different strong random value
- [ ] Switched Chapa from TEST to PRODUCTION keys
- [ ] Updated FRONTEND_URL to production domain
- [ ] Updated NEXT_PUBLIC_API_URL to production API
- [ ] Set SWAGGER_ENABLED=false (or remove it)
- [ ] Configured CORS for production domain only
- [ ] Verified Resend domain
- [ ] Removed any hardcoded credentials from code

### 4. External Services

Verify all third-party services are configured:

**MongoDB Atlas:**
- [ ] Production cluster created
- [ ] Database user with appropriate permissions
- [ ] IP whitelist configured (or 0.0.0.0/0 for cloud deployments)
- [ ] Connection string updated in environment

**Cloudinary:**
- [ ] Account verified
- [ ] API keys configured
- [ ] Upload presets configured (if needed)

**Chapa:**
- [ ] Production keys obtained
- [ ] Webhook URL configured: `https://yourdomain.com/api/payments/chapa/webhook`
- [ ] Test payment flow in test mode first

**Resend:**
- [ ] Domain verified
- [ ] DNS records configured (SPF, DKIM, DMARC)
- [ ] API key generated

---

## Environment Setup

### Backend Environment Variables

**File: `backend/.env.production`**

```env
# Application
NODE_ENV=production
PORT=3001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eventify?retryWrites=true&w=majority

# JWT Secrets - MUST BE CHANGED!
JWT_SECRET=<generate-with-crypto-randomBytes-64-chars>
JWT_REFRESH_SECRET=<generate-different-secret-64-chars>
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Chapa - PRODUCTION KEYS
CHAPA_SECRET_KEY=CHASECK-<your-production-key>
CHAPA_WEBHOOK_SECRET=your_webhook_secret

# Email
EMAIL_FROM=noreply@yourdomain.com
RESEND_API_KEY=re_<your_api_key>

# Frontend
FRONTEND_URL=https://yourdomain.com

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
SWAGGER_ENABLED=false

# Monitoring (optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOG_LEVEL=info
```

### Generate Strong Secrets

```powershell
# PowerShell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend Environment Variables

**File: `frontend/.env.production`**

```env
# Backend API - UPDATE TO PRODUCTION URL
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# Application URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Analytics (optional)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Sentry (optional)
# NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
# NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

---

## Deployment Methods

### Option 1: Docker Compose (Recommended for VPS)

Best for: DigitalOcean, AWS EC2, Linode, etc.

#### 1. Install Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Clone Repository

```bash
git clone https://github.com/your-repo/eventify-ethiopia.git
cd eventify-ethiopia
```

#### 3. Configure Environment

```bash
cp backend/.env.production.example backend/.env.production
cp frontend/.env.production.example frontend/.env.production

# Edit files with your production values
nano backend/.env.production
nano frontend/.env.production
```

#### 4. Deploy

```bash
# Build and start containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check container status
docker-compose ps
```

#### 5. Configure SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

#### 6. Update Nginx Configuration

Edit `nginx/nginx.conf` with your domain and SSL certificate paths, then restart:

```bash
docker-compose restart nginx
```

---

### Option 2: Vercel (Frontend) + Railway (Backend)

Best for: Quick deployment with minimal DevOps

#### Backend on Railway

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub repo
3. Select your repository
4. Configure environment variables (copy from `.env.production`)
5. Railway automatically builds and deploys
6. Note your backend URL: `https://your-app.railway.app`

#### Frontend on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import Git Repository
3. Framework: Next.js (auto-detected)
4. Configure environment variables:
   - `NEXT_PUBLIC_API_URL`: Your Railway backend URL + `/api`
5. Deploy

---

### Option 3: AWS Elastic Beanstalk

Best for: Enterprise deployments with AWS infrastructure

#### Backend Deployment

```bash
# Install EB CLI
pip install awsebcli

# Initialize
cd backend
eb init -p node.js-18 eventify-backend --region us-east-1

# Create environment
eb create eventify-production --database

# Deploy
eb deploy

# Configure environment variables
eb setenv NODE_ENV=production \
  MONGODB_URI="your-connection-string" \
  JWT_SECRET="your-secret" \
  # ... other variables
```

#### Frontend Deployment

Deploy to Amplify or S3 + CloudFront:

```bash
# Build
cd frontend
npm run build

# Deploy to S3
aws s3 sync .next/static s3://your-bucket/static
aws s3 sync .next/server s3://your-bucket/server
```

---

### Option 4: Kubernetes (Advanced)

Best for: Large scale, multi-region deployments

See `docs/KUBERNETES_DEPLOYMENT.md` for detailed instructions.

---

## Post-Deployment

### 1. Verify Deployment

```bash
# Check backend health
curl https://api.yourdomain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2026-09-01T...","uptime":123.45}

# Check frontend
curl https://yourdomain.com

# Should return HTML
```

### 2. Test Critical Flows

- [ ] User registration
- [ ] User login
- [ ] Event creation (organizer)
- [ ] Free ticket purchase
- [ ] Paid ticket purchase (Chapa)
- [ ] Ticket transfer
- [ ] QR code check-in
- [ ] Email notifications
- [ ] File uploads (images)
- [ ] Password reset flow

### 3. Configure DNS

Point your domain to your server:

```
Type    Name    Value               TTL
A       @       YOUR_SERVER_IP      3600
A       www     YOUR_SERVER_IP      3600
CNAME   api     YOUR_SERVER_IP      3600
```

### 4. Set Up Monitoring

#### Uptime Monitoring

Use services like:
- UptimeRobot (free)
- Pingdom
- StatusCake

Monitor these endpoints:
- `https://yourdomain.com` (frontend)
- `https://api.yourdomain.com/api/health` (backend)

#### Error Tracking

Follow `docs/SENTRY_SETUP.md` to configure Sentry.

#### Performance Monitoring

- Enable Sentry performance monitoring
- Set up Google Analytics (optional)
- Configure server metrics (CPU, memory, disk)

### 5. Database Backups

Set up automated backups:

```bash
# Add to crontab (run daily at 2 AM)
crontab -e

0 2 * * * /path/to/eventify-ethiopia/scripts/backup-db.sh
```

Or use MongoDB Atlas automated backups.

### 6. Log Monitoring

```bash
# View Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Save logs to file
docker-compose logs backend > backend.log
```

Consider log aggregation services:
- Papertrail
- Logtail
- AWS CloudWatch Logs

---

## Monitoring & Maintenance

### Daily Checks

- [ ] Check error rate in Sentry
- [ ] Review server uptime
- [ ] Check database disk usage
- [ ] Monitor API response times

### Weekly Tasks

- [ ] Review backup integrity
- [ ] Check security updates
- [ ] Review user feedback/support tickets
- [ ] Analyze slow database queries

### Monthly Tasks

- [ ] Update dependencies (security patches)
- [ ] Review analytics and performance metrics
- [ ] Clean up old logs
- [ ] Test disaster recovery procedures
- [ ] Review and rotate API keys

### Scaling Considerations

When to scale:

**Horizontal Scaling (More Instances):**
- Response time consistently > 500ms
- CPU usage consistently > 70%
- Memory usage > 80%

**Vertical Scaling (Bigger Instances):**
- Single-threaded operations are slow
- Memory-intensive operations

**Database Scaling:**
- Query response time > 100ms
- Connection pool exhausted
- Storage > 80% full

---

## Troubleshooting

### Application Won't Start

**Check logs:**
```bash
docker-compose logs backend
docker-compose logs frontend
```

**Common issues:**
- Missing environment variables → Check `.env.production`
- Port already in use → Change PORT in environment
- MongoDB connection failed → Verify MONGODB_URI and IP whitelist

### 500 Internal Server Error

1. Check backend logs
2. Verify all environment variables are set
3. Check database connectivity
4. Review Sentry for error details

### Chapa Payments Failing

1. Verify using production keys (not test keys)
2. Check webhook URL is publicly accessible
3. Verify webhook secret matches
4. Review Chapa dashboard for transaction details
5. Check backend logs for payment-related errors

### Images Not Uploading

1. Verify Cloudinary credentials
2. Check file size limits (50MB default)
3. Review Cloudinary dashboard quota
4. Check browser console for CORS errors

### Emails Not Sending

1. Verify Resend API key
2. Check domain verification status
3. Review DNS records (SPF, DKIM)
4. Check Resend dashboard for delivery status
5. Verify EMAIL_FROM matches verified domain

### Database Connection Issues

1. Check MongoDB Atlas IP whitelist
2. Verify connection string format
3. Check database user permissions
4. Review MongoDB Atlas network settings
5. Test connection with `mongosh`:
   ```bash
   mongosh "mongodb+srv://..."
   ```

### Performance Issues

1. Enable APM (Application Performance Monitoring)
2. Analyze slow queries in MongoDB
3. Check Docker resource limits
4. Review Nginx access logs for traffic patterns
5. Consider adding Redis for caching

### Docker Container Crashes

```bash
# View container status
docker-compose ps

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up -d --build --force-recreate

# Check resource usage
docker stats
```

### Database Restore

```powershell
# Windows
.\scripts\restore-db.ps1

# Linux/Mac
./scripts/restore-db.sh
```

---

## Rollback Procedure

If deployment fails:

```bash
# Stop containers
docker-compose down

# Restore database from backup
./scripts/restore-db.sh

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild and start
docker-compose up -d --build

# Verify health
curl https://api.yourdomain.com/api/health
```

---

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Enable HTTPS** everywhere (Let's Encrypt is free)
4. **Regular updates** for dependencies
5. **Monitor logs** for suspicious activity
6. **Implement rate limiting** (already configured)
7. **Use strong passwords** for all services
8. **Enable 2FA** on all admin accounts
9. **Regular backups** with tested restore procedures
10. **Keep Swagger disabled** in production

---

## Support & Resources

- **Documentation:** `docs/` directory
- **API Documentation:** `https://api.yourdomain.com/api/docs` (dev only)
- **MongoDB Atlas:** https://cloud.mongodb.com
- **Cloudinary:** https://cloudinary.com/console
- **Chapa:** https://dashboard.chapa.co
- **Resend:** https://resend.com/emails
- **Sentry:** https://sentry.io

---

## Quick Reference Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update and redeploy
git pull
docker-compose up -d --build

# Backup database
./scripts/backup-db.sh

# Check health
curl https://api.yourdomain.com/api/health

# View running containers
docker-compose ps

# Stop all services
docker-compose down

# Start all services
docker-compose up -d
```

---

**Last Updated:** September 1, 2026  
**Version:** 1.0.0
