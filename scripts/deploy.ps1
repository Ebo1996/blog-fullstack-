# ============================================
# EVENTIFY ETHIOPIA - PRODUCTION DEPLOYMENT (PowerShell)
# ============================================
# Usage: .\scripts\deploy.ps1 [-Environment production]

param(
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "🚀 Starting deployment to $Environment..." -ForegroundColor Cyan
Write-Host "📅 Timestamp: $Timestamp" -ForegroundColor Gray

# Check if .env files exist
function Test-EnvFiles {
    Write-Host "`n📋 Checking environment files..." -ForegroundColor Yellow
    
    if (-not (Test-Path "backend\.env.production")) {
        Write-Host "❌ backend\.env.production not found!" -ForegroundColor Red
        Write-Host "   Copy backend\.env.production.example and fill in values"
        exit 1
    }
    
    if (-not (Test-Path "frontend\.env.production")) {
        Write-Host "❌ frontend\.env.production not found!" -ForegroundColor Red
        Write-Host "   Copy frontend\.env.production.example and fill in values"
        exit 1
    }
    
    Write-Host "✓ Environment files found" -ForegroundColor Green
}

# Build applications
function Build-Apps {
    Write-Host "`n🔨 Building applications..." -ForegroundColor Yellow
    
    # Backend
    Write-Host "Building backend..."
    Push-Location backend
    npm run build
    Pop-Location
    
    # Frontend
    Write-Host "Building frontend..."
    Push-Location frontend
    npm run build
    Pop-Location
    
    Write-Host "✓ Build completed" -ForegroundColor Green
}

# Build Docker images
function Build-Docker {
    Write-Host "`n🐳 Building Docker images..." -ForegroundColor Yellow
    
    docker-compose build --no-cache
    
    Write-Host "✓ Docker images built" -ForegroundColor Green
}

# Database backup
function Backup-Database {
    Write-Host "`n💾 Creating database backup..." -ForegroundColor Yellow
    
    & .\scripts\backup-db.ps1
    
    Write-Host "✓ Database backup created" -ForegroundColor Green
}

# Deploy with Docker Compose
function Deploy-Docker {
    Write-Host "`n🚢 Deploying with Docker Compose..." -ForegroundColor Yellow
    
    # Stop existing containers
    docker-compose down
    
    # Start new containers
    docker-compose up -d
    
    # Wait for services to be healthy
    Write-Host "⏳ Waiting for services to be healthy..."
    Start-Sleep -Seconds 30
    
    Write-Host "✓ Deployment completed" -ForegroundColor Green
}

# Health check
function Test-Health {
    Write-Host "`n🏥 Running health checks..." -ForegroundColor Yellow
    
    # Check backend
    try {
        $backendResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Host "✓ Backend is running" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backend health check failed" -ForegroundColor Red
    }
    
    # Check frontend
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
        Write-Host "✓ Frontend is running" -ForegroundColor Green
    } catch {
        Write-Host "❌ Frontend health check failed" -ForegroundColor Red
    }
}

# Show deployment summary
function Show-Summary {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "✅ DEPLOYMENT COMPLETED SUCCESSFULLY" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Deployment Summary:"
    Write-Host "   Environment: $Environment"
    Write-Host "   Timestamp: $Timestamp"
    Write-Host ""
    Write-Host "🔗 URLs:"
    Write-Host "   Frontend: http://localhost:3000"
    Write-Host "   Backend:  http://localhost:3001/api"
    Write-Host "   Swagger:  http://localhost:3001/api/docs"
    Write-Host ""
    Write-Host "📝 Next Steps:"
    Write-Host "   1. Monitor logs: docker-compose logs -f"
    Write-Host "   2. Check containers: docker ps"
    Write-Host "   3. Check metrics: docker stats"
    Write-Host ""
    Write-Host "⚠️  Remember to:" -ForegroundColor Yellow
    Write-Host "   - Update DNS records"
    Write-Host "   - Configure SSL certificates"
    Write-Host "   - Set up monitoring alerts"
    Write-Host "   - Enable database backups"
}

# Main deployment flow
function Main {
    Write-Host "╔════════════════════════════════════════╗"
    Write-Host "║   EVENTIFY ETHIOPIA DEPLOYMENT         ║"
    Write-Host "║   Environment: $Environment            ║"
    Write-Host "╚════════════════════════════════════════╝"
    
    Test-EnvFiles
    Build-Apps
    Build-Docker
    
    # Ask for confirmation before deploying
    $confirmation = Read-Host "Ready to deploy? (y/n)"
    if ($confirmation -ne 'y') {
        Write-Host "Deployment cancelled"
        exit 0
    }
    
    Backup-Database
    Deploy-Docker
    Test-Health
    Show-Summary
}

# Run main
try {
    Main
} catch {
    Write-Host "`n❌ Deployment failed: $_" -ForegroundColor Red
    Write-Host "🔄 Rolling back..." -ForegroundColor Yellow
    docker-compose down
    exit 1
}
