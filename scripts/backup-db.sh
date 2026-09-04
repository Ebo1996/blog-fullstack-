#!/bin/bash
# ============================================
# MONGODB BACKUP SCRIPT
# ============================================
# Creates timestamped backup of MongoDB database

set -e

# Configuration
BACKUP_DIR="./backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="eventify_backup_${TIMESTAMP}"

# Load environment variables
if [ -f "backend/.env.production" ]; then
    export $(cat backend/.env.production | grep -v '^#' | xargs)
elif [ -f "backend/.env" ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
else
    echo "❌ No environment file found!"
    exit 1
fi

# Extract database name from MONGODB_URI
DB_NAME=$(echo $MONGODB_URI | sed 's/.*\///' | sed 's/?.*//')

if [ -z "$DB_NAME" ]; then
    DB_NAME="eventify"
fi

echo "🗄️  Starting MongoDB backup..."
echo "📅 Timestamp: $TIMESTAMP"
echo "💾 Database: $DB_NAME"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Perform backup
echo "📦 Creating backup..."

if [[ $MONGODB_URI == *"mongodb+srv"* ]]; then
    # MongoDB Atlas
    mongodump --uri="$MONGODB_URI" \
              --out="$BACKUP_DIR/$BACKUP_NAME" \
              --gzip
else
    # Local MongoDB
    mongodump --uri="$MONGODB_URI" \
              --db="$DB_NAME" \
              --out="$BACKUP_DIR/$BACKUP_NAME" \
              --gzip
fi

# Create archive
echo "🗜️  Compressing backup..."
cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
rm -rf "$BACKUP_NAME"
cd - > /dev/null

# Get file size
SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)

echo "✅ Backup completed successfully!"
echo "📁 Location: $BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "📊 Size: $SIZE"

# Optional: Upload to cloud storage (uncomment and configure)
# echo "☁️  Uploading to S3..."
# aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" "s3://your-bucket/backups/"

# Clean up old backups (keep last 7 days)
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +7 -delete

echo "🎉 Backup process complete!"
