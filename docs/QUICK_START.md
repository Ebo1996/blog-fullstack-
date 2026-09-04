# Eventify Ethiopia - Quick Start Guide

Get Eventify Ethiopia running in production in under 30 minutes.

## Prerequisites

- VPS server (2GB RAM minimum, 4GB recommended)
- Domain name pointed to your server
- SSH access to your server

## Step-by-Step Deployment

### 1. Server Setup (5 minutes)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Clone Repository (2 minutes)

```bash
# Clone your repository
git clone https://github.com/your-username/eventify-ethiopia.git
cd eventify-ethiopia
```

### 3. Configure Environment (10 minutes)

```bash
# Copy environment templates
cp backend/.env.production.example backend/.env.production
cp frontend/.env.production.example frontend/.env.production

# Edit backend environment
nano backend/.env.production
```

**Minimum required changes:**

```env
# Generate new secrets (run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=<your-generated-secret>
JWT_REFRESH_SECRET=<your-different-generated-secret>

# Your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eventify

# Your Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Your Chapa production keys
CHAPA_SECRET_KEY=CHASECK-<production-key>
CHAPA_WEBHOOK_SECRET=your_webhook_secret

# Your Resend API key
RESEND_API_KEY=re_your_key

# Your domain
FRONTEND_URL=https://yourdomain.com
```

Edit frontend environment:

```bash
nano frontend/.env.production
```

```env
# Your API URL
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api

# Your frontend URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4. Deploy (5 minutes)

```bash
# Build and start all services
docker-compose up -d --build

# Watch logs to ensure everything starts
docker-compose logs -f
```

Wait for:
- `✓ Sentry initialized` (if configured)
- `🚀 Eventify API running on: http://localhost:3001/api`
- `✓ Environment validation passed`
- Frontend shows `ready started server on 0.0.0.0:3000`

Press `Ctrl+C` to stop watching logs (services keep running).

### 5. Configure Nginx & SSL (5 minutes)

```bash
# Install Nginx and Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Stop nginx temporarily
sudo systemctl stop nginx

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Copy SSL certificates to project
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Update nginx config with your domain
nano nginx/nginx.conf
# Replace "yourdomain.com" with your actual domain

# Restart nginx container
docker-compose restart nginx
```

### 6. Verify Deployment (3 minutes)

```bash
# Check backend health
curl https://api.yourdomain.com/api/health

# Should return:
# {"status":"ok","timestamp":"...","uptime":...}

# Check frontend
curl https://yourdomain.com
# Should return HTML

# Check all containers are running
docker-compose ps
# All should show "Up"
```

### 7. Test Application

1. Open `https://yourdomain.com` in browser
2. Create an account
3. Log in
4. Create a test event (as organizer)
5. Purchase a free ticket
6. Verify ticket appears in dashboard

## Post-Deployment

### Set Up Automated Backups

```bash
# Edit crontab
crontab -e

# Add this line (backup daily at 2 AM)
0 2 * * * cd /path/to/eventify-ethiopia && ./scripts/backup-db.sh
```

### Monitor Your Application

**Set up uptime monitoring:**
1. Go to [uptimerobot.com](https://uptimerobot.com) (free)
2. Add monitor for `https://api.yourdomain.com/api/health`
3. Add monitor for `https://yourdomain.com`

**View logs:**
```bash
# Real-time logs
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100
```

### Update Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build

# Verify health
curl https://api.yourdomain.com/api/health
```

## Common Issues & Solutions

### Port 80/443 Already in Use

```bash
# Find what's using the port
sudo lsof -i :80
sudo lsof -i :443

# Stop conflicting service (usually nginx)
sudo systemctl stop nginx
sudo systemctl disable nginx

# Then restart docker-compose
docker-compose restart
```

### Container Fails to Start

```bash
# Check logs for specific container
docker-compose logs backend
docker-compose logs frontend

# Most common: environment variables missing
# Solution: verify .env.production files
```

### Can't Connect to Database

1. Check MongoDB Atlas IP whitelist (allow 0.0.0.0/0 or your server IP)
2. Verify connection string format
3. Test connection:
   ```bash
   mongosh "your-mongodb-uri"
   ```

### SSL Certificate Issues

```bash
# Renew certificate
sudo certbot renew

# Copy new certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Restart nginx
docker-compose restart nginx
```

## Need More Help?

- **Full Deployment Guide:** `docs/DEPLOYMENT_GUIDE.md`
- **Sentry Setup:** `docs/SENTRY_SETUP.md`
- **Troubleshooting:** See DEPLOYMENT_GUIDE.md#troubleshooting

## Estimated Costs

**Minimum Setup:**
- VPS (DigitalOcean/Linode): $12/month (2GB RAM)
- Domain: $10-15/year
- MongoDB Atlas: Free tier (512MB)
- Cloudinary: Free tier (25GB)
- Resend: Free tier (3,000 emails/month)
- Chapa: Transaction fees only

**Total: ~$12/month + domain**

**Recommended Setup:**
- VPS: $24/month (4GB RAM)
- MongoDB Atlas: $57/month (2GB M10)
- Other services: Free tiers sufficient

**Total: ~$81/month**

## Success Checklist

- [x] Docker and Docker Compose installed
- [x] Repository cloned
- [x] Environment files configured
- [x] Secrets generated and updated
- [x] MongoDB Atlas configured
- [x] Cloudinary configured
- [x] Chapa production keys configured
- [x] Resend configured
- [x] Application deployed
- [x] SSL certificates installed
- [x] Health checks passing
- [x] Test user can register and login
- [x] Test event can be created
- [x] Test ticket can be purchased
- [x] Backups configured
- [x] Monitoring configured

🎉 **Congratulations! Your Eventify Ethiopia platform is now live!**
