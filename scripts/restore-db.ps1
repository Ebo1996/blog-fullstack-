# ============================================
# MONGODB RESTORE SCRIPT (PowerShell)
# ============================================
# Restores MongoDB database from backup

$ErrorActionPreference = "Stop"

$BackupDir = ".\backups\mongodb"

Write-Host "🔄 MongoDB Database Restore" -ForegroundColor Cyan
Write-Host ""

# Load environment variables
$EnvFile = if (Test-Path "backend\.env.production") {
    "backend\.env.production"
} elseif (Test-Path "backend\.env") {
    "backend\.env"
} else {
    Write-Host "❌ No environment file found!" -ForegroundColor Red
    exit 1
}

Get-Content $EnvFile | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$name" -Value $value
    }
}

$MongoUri = $env:MONGODB_URI

# List available backups
Write-Host "📦 Available backups:" -ForegroundColor Yellow
Write-Host ""
Get-ChildItem -Path $BackupDir -Filter "*.zip" | 
    Select-Object Name, LastWriteTime, @{Name="Size";Expression={"{0:N2} MB" -f ($_.Length / 1MB)}} |
    Format-Table -AutoSize

Write-Host ""
$BackupChoice = Read-Host "Enter backup filename (or 'latest' for most recent)"

if ($BackupChoice -eq "latest") {
    $BackupFile = Get-ChildItem -Path $BackupDir -Filter "*.zip" | 
                  Sort-Object LastWriteTime -Descending | 
                  Select-Object -First 1
} else {
    $BackupFile = Get-Item (Join-Path $BackupDir $BackupChoice)
}

if (-not $BackupFile) {
    Write-Host "❌ Backup file not found" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Selected backup: $($BackupFile.Name)" -ForegroundColor Yellow
Write-Host ""

# Confirm restore
Write-Host "⚠️  WARNING: This will OVERWRITE the current database!" -ForegroundColor Red
$Confirm = Read-Host "Are you sure you want to continue? (type 'yes' to confirm)"

if ($Confirm -ne "yes") {
    Write-Host "Restore cancelled"
    exit 0
}

# Extract backup
Write-Host "`n📂 Extracting backup..." -ForegroundColor Yellow
$TempDir = Join-Path $env:TEMP ([System.Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

Expand-Archive -Path $BackupFile.FullName -DestinationPath $TempDir -Force

# Find the actual backup directory
$BackupPath = Get-ChildItem -Path $TempDir -Directory -Filter "eventify_backup_*" | 
              Select-Object -First 1 -ExpandProperty FullName

if (-not $BackupPath) {
    Write-Host "❌ Invalid backup structure" -ForegroundColor Red
    Remove-Item -Path $TempDir -Recurse -Force
    exit 1
}

# Perform restore
Write-Host "🔄 Restoring database..." -ForegroundColor Yellow

try {
    mongorestore --uri="$MongoUri" --dir="$BackupPath" --gzip --drop
    
    # Clean up
    Remove-Item -Path $TempDir -Recurse -Force
    
    Write-Host "`n✅ Database restored successfully!" -ForegroundColor Green
    Write-Host "⚠️  Remember to restart your application" -ForegroundColor Yellow
    
} catch {
    Write-Host "❌ Restore failed: $_" -ForegroundColor Red
    Remove-Item -Path $TempDir -Recurse -Force
    exit 1
}
