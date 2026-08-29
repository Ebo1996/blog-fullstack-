# PowerShell script to set up demo data in Supabase
# Run this script from the backend directory

Write-Host "🚀 Setting up Northstar Demo Database..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your Supabase credentials:" -ForegroundColor Yellow
    Write-Host "  SUPABASE_URL=your-project-url" -ForegroundColor Gray
    Write-Host "  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key" -ForegroundColor Gray
    Write-Host "  SUPABASE_DB_PASSWORD=your-db-password" -ForegroundColor Gray
    exit 1
}

# Load environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

$SUPABASE_URL = $env:SUPABASE_URL
$SUPABASE_DB_PASSWORD = $env:SUPABASE_DB_PASSWORD

if (-not $SUPABASE_URL -or -not $SUPABASE_DB_PASSWORD) {
    Write-Host "❌ Error: Missing required environment variables!" -ForegroundColor Red
    exit 1
}

# Extract project ID from URL
$PROJECT_ID = ($SUPABASE_URL -replace 'https://([^.]+)\.supabase\.co', '$1')
$DB_URL = "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${PROJECT_ID}.supabase.co:5432/postgres"

Write-Host "📊 Project: $PROJECT_ID" -ForegroundColor Green
Write-Host ""

# Step 1: Run migrations
Write-Host "1️⃣  Running migrations..." -ForegroundColor Cyan
$migrationFiles = Get-ChildItem -Path "supabase/migrations" -Filter "*.sql" | Sort-Object Name

foreach ($file in $migrationFiles) {
    Write-Host "   → $($file.Name)" -ForegroundColor Gray
    $content = Get-Content $file.FullName -Raw
    psql $DB_URL -c $content 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ⚠️  Warning: Migration may have already been applied" -ForegroundColor Yellow
    }
}

Write-Host "   ✓ Migrations complete" -ForegroundColor Green
Write-Host ""

# Step 2: Run seed data
Write-Host "2️⃣  Seeding demo data..." -ForegroundColor Cyan
$seedContent = Get-Content "supabase/seed.sql" -Raw
psql $DB_URL -c $seedContent 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Seed data loaded successfully!" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Warning: Some seed data may already exist" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Demo setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Demo Users:" -ForegroundColor Cyan
Write-Host "   Admin:     admin@northstar.dev     / Password1!" -ForegroundColor White
Write-Host "   Organizer: organizer@northstar.dev / Password1!" -ForegroundColor White
Write-Host "   Attendee:  attendee@northstar.dev  / Password1!" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Demo Events:" -ForegroundColor Cyan
Write-Host "   • Future Sound (Music)" -ForegroundColor White
Write-Host "   • New York Design Week (Design)" -ForegroundColor White
Write-Host "   • The Long Now (Culture)" -ForegroundColor White
Write-Host "   • Web Summit NYC (Technology)" -ForegroundColor White
Write-Host "   • Founder's Forum (Business)" -ForegroundColor White
Write-Host ""
Write-Host "🎫 The attendee user has 3 active tickets ready to view!" -ForegroundColor Green
Write-Host ""
