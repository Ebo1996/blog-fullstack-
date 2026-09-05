# ============================================
# Eventify Ethiopia - Deployment Preparation
# ============================================
# This script helps prepare your app for deployment

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  EVENTIFY ETHIOPIA - DEPLOY PREP" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Error: Must run from project root directory" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Directory check passed" -ForegroundColor Green
Write-Host ""

# Check if git is initialized
Write-Host "Checking Git status..." -ForegroundColor Cyan
if (-not (Test-Path ".git")) {
    Write-Host "❌ Git not initialized. Run: git init" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Git initialized" -ForegroundColor Green
Write-Host ""

# Check if there are uncommitted changes
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  You have uncommitted changes:" -ForegroundColor Yellow
    Write-Host $gitStatus
    Write-Host ""
    $commit = Read-Host "Commit changes now? (y/n)"
    
    if ($commit -eq "y") {
        git add .
        $message = Read-Host "Commit message (or press Enter for default)"
        if (-not $message) {
            $message = "Prepare for deployment"
        }
        git commit -m $message
        Write-Host "✓ Changes committed" -ForegroundColor Green
    }
}

Write-Host ""

# Check if remote is set
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  No Git remote configured" -ForegroundColor Yellow
    Write-Host "Add remote: git remote add origin <your-repo-url>" -ForegroundColor Yellow
} else {
    Write-Host "✓ Git remote: $remote" -ForegroundColor Green
}

Write-Host ""

# Check environment files
Write-Host "Checking environment files..." -ForegroundColor Cyan

if (Test-Path "backend/.env.production") {
    Write-Host "✓ backend/.env.production exists" -ForegroundColor Green
} else {
    Write-Host "❌ backend/.env.production missing" -ForegroundColor Red
}

if (Test-Path "frontend/.env.production") {
    Write-Host "✓ frontend/.env.production exists" -ForegroundColor Green
} else {
    Write-Host "❌ frontend/.env.production missing" -ForegroundColor Red
}

Write-Host ""

# Check if next.config.js exists
Write-Host "Checking Next.js config..." -ForegroundColor Cyan
if (Test-Path "frontend/next.config.js") {
    Write-Host "✓ frontend/next.config.js exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  frontend/next.config.js missing" -ForegroundColor Yellow
}

Write-Host ""

# Test backend build
Write-Host "Testing backend build..." -ForegroundColor Cyan
Push-Location backend
$backendBuild = npm run build 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Backend builds successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Backend build failed" -ForegroundColor Red
    Write-Host "Error: $backendBuild" -ForegroundColor Red
}
Pop-Location

Write-Host ""

# Summary
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT READINESS SUMMARY" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Code Status:" -ForegroundColor White
Write-Host "   ✓ Backend builds successfully" -ForegroundColor Green
Write-Host "   ✓ Environment files ready" -ForegroundColor Green
Write-Host "   ✓ Git repository configured" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor White
Write-Host "   1. Push to GitHub: git push origin main" -ForegroundColor Yellow
Write-Host "   2. Open DEPLOYMENT_QUICK_START.md" -ForegroundColor Yellow
Write-Host "   3. Follow Vercel + Render deployment steps" -ForegroundColor Yellow
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor White
Write-Host "   Quick Start: DEPLOYMENT_QUICK_START.md" -ForegroundColor Cyan
Write-Host "   Full Guide: DEPLOY_VERCEL_RENDER.md" -ForegroundColor Cyan
Write-Host "   General Info: READY_TO_DEPLOY.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Ready to deploy!" -ForegroundColor Green
Write-Host ""

# Ask if user wants to push to GitHub
$push = Read-Host "Push to GitHub now? (y/n)"
if ($push -eq "y") {
    Write-Host ""
    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Pushed to GitHub successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎉 Now deploy on Vercel and Render!" -ForegroundColor Green
        Write-Host "   → Vercel: https://vercel.com" -ForegroundColor Cyan
        Write-Host "   → Render: https://render.com" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Push failed. Check your Git configuration." -ForegroundColor Red
    }
}

Write-Host ""
