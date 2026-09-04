# ============================================
# PRE-FLIGHT DEPLOYMENT CHECKS (PowerShell)
# ============================================
# Validates system is ready for deployment

$ErrorActionPreference = "Continue"

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║   PRE-FLIGHT DEPLOYMENT CHECKS         ║" -ForegroundColor Blue
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

$Failed = 0

# Check function
function Test-Requirement {
    param(
        [string]$Name,
        [scriptblock]$Test
    )
    
    Write-Host "Checking $Name... " -NoNewline
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host "✓" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗" -ForegroundColor Red
            $script:Failed++
            return $false
        }
    } catch {
        Write-Host "✗" -ForegroundColor Red
        $script:Failed++
        return $false
    }
}

# Check System Dependencies
Write-Host "📦 System Dependencies" -ForegroundColor Yellow
Test-Requirement "Node.js" { node --version; $? }
Test-Requirement "npm" { npm --version; $? }
Test-Requirement "Docker" { docker --version; $? }
Test-Requirement "Docker Compose" { docker-compose --version; $? }

Write-Host ""

# Check environment files
Write-Host "🔐 Environment Configuration" -ForegroundColor Yellow
Test-Requirement "Backend .env.production" { Test-Path "backend\.env.production" }
Test-Requirement "Frontend .env.production" { Test-Path "frontend\.env.production" }

Write-Host ""

# Check critical environment variables
Write-Host "⚙️  Environment Variables" -ForegroundColor Yellow

if (Test-Path "backend\.env.production") {
    Get-Content "backend\.env.production" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
    
    if ($env:MONGODB_URI) {
        Write-Host "MongoDB URI: " -NoNewline
        Write-Host "✓" -ForegroundColor Green
    } else {
        Write-Host "MongoDB URI: " -NoNewline
        Write-Host "✗" -ForegroundColor Red
        $Failed++
    }
    
    if ($env:JWT_SECRET) {
        Write-Host "JWT Secret: " -NoNewline
        Write-Host "✓" -ForegroundColor Green
    } else {
        Write-Host "JWT Secret: " -NoNewline
        Write-Host "✗" -ForegroundColor Red
        $Failed++
    }
    
    if ($env:CLOUDINARY_CLOUD_NAME) {
        Write-Host "Cloudinary: " -NoNewline
        Write-Host "✓" -ForegroundColor Green
    } else {
        Write-Host "Cloudinary: " -NoNewline
        Write-Host "✗" -ForegroundColor Red
        $Failed++
    }
    
    if ($env:CHAPA_SECRET_KEY) {
        Write-Host "Chapa Key: " -NoNewline
        Write-Host "✓" -ForegroundColor Green
        
        # Check for test keys
        if ($env:CHAPA_SECRET_KEY -like "*TEST*") {
            Write-Host "⚠️  WARNING: Using Chapa TEST key!" -ForegroundColor Red
            $Failed++
        }
    } else {
        Write-Host "Chapa Key: " -NoNewline
        Write-Host "✗" -ForegroundColor Red
        $Failed++
    }
}

Write-Host ""

# Check build status
Write-Host "🔨 Build Status" -ForegroundColor Yellow

Write-Host "Backend build... " -NoNewline
Push-Location backend
try {
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓" -ForegroundColor Green
    } else {
        Write-Host "✗" -ForegroundColor Red
        $Failed++
    }
} catch {
    Write-Host "✗" -ForegroundColor Red
    $Failed++
}
Pop-Location

Write-Host "Frontend build... " -NoNewline
Push-Location frontend
try {
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓" -ForegroundColor Green
    } else {
        Write-Host "✗" -ForegroundColor Red
        $Failed++
    }
} catch {
    Write-Host "✗" -ForegroundColor Red
    $Failed++
}
Pop-Location

Write-Host ""

# Check disk space
Write-Host "💾 System Resources" -ForegroundColor Yellow

$Drive = Get-PSDrive C
$FreeSpace = [math]::Round($Drive.Free / 1GB, 2)
Write-Host "Available disk space: $FreeSpace GB"

$Memory = Get-CimInstance Win32_OperatingSystem
$FreeMemory = [math]::Round($Memory.FreePhysicalMemory / 1MB, 2)
Write-Host "Available memory: $FreeMemory MB"

Write-Host ""

# Check network connectivity
Write-Host "🌐 Network Connectivity" -ForegroundColor Yellow
Test-Requirement "Internet connection" { Test-Connection -ComputerName google.com -Count 1 -Quiet }

Write-Host ""

# Summary
if ($Failed -eq 0) {
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   ✅ ALL CHECKS PASSED                 ║" -ForegroundColor Green
    Write-Host "║   Ready for deployment!                ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
    exit 0
} else {
    Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║   ❌ $Failed CHECK(S) FAILED                ║" -ForegroundColor Red
    Write-Host "║   Fix issues before deployment         ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Red
    exit 1
}
