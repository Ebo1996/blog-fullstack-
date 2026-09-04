# ============================================
# MONGODB BACKUP SCRIPT (PowerShell)
# ============================================
# Creates timestamped backup of MongoDB database

$ErrorActionPreference = "Stop"

# Configuration
$BackupDir = ".\backups\mongodb"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "eventify_backup_$Timestamp"

Write-Host "🗄️  Starting MongoDB backup..." -ForegroundColor Cyan
Write-Host "📅 Timestamp: $Timestamp" -ForegroundColor Gray

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

# Extract database name from URI
if ($MongoUri -match "/([^/?]+)(\?|$)") {
    $DbName = $matches[1]
} else {
    $DbName = "eventify"
}

Write-Host "💾 Database: $DbName" -ForegroundColor Gray

# Create backup directory
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# Perform backup
Write-Host "📦 Creating backup..." -ForegroundColor Yellow

$BackupPath = Join-Path $BackupDir $BackupName

try {
    mongodump --uri="$MongoUri" --out="$BackupPath" --gzip
    
    # Create archive
    Write-Host "🗜️  Compressing backup..." -ForegroundColor Yellow
    $ArchivePath = "$BackupPath.zip"
    Compress-Archive -Path $BackupPath -DestinationPath $ArchivePath -Force
    
    # Remove uncompressed backup
    Remove-Item -Path $BackupPath -Recurse -Force
    
    # Get file size
    $Size = (Get-Item $ArchivePath).Length / 1MB
    $SizeFormatted = "{0:N2} MB" -f $Size
    
    Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
    Write-Host "📁 Location: $ArchivePath" -ForegroundColor Gray
    Write-Host "📊 Size: $SizeFormatted" -ForegroundColor Gray
    
    # Clean up old backups (keep last 7 days)
    Write-Host "🧹 Cleaning up old backups..." -ForegroundColor Yellow
    $OldBackups = Get-ChildItem -Path $BackupDir -Filter "*.zip" | 
                  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) }
    
    foreach ($backup in $OldBackups) {
        Remove-Item $backup.FullName -Force
        Write-Host "   Deleted: $($backup.Name)" -ForegroundColor DarkGray
    }
    
    Write-Host "🎉 Backup process complete!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Backup failed: $_" -ForegroundColor Red
    exit 1
}
