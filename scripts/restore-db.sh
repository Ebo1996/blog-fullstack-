#!/bin/bash
# ============================================
# MONGODB RESTORE SCRIPT
# ============================================
# Restores MongoDB database from backup

set -e

BACKUP_DIR="./backups/mongodb"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 MongoDB Database Restore${NC}"
echo ""

# Load environment variables
if [ -f "backend/.env.production" ]; then
    export $(cat backend/.env.production | grep -v '^#' | xargs)
elif [ -f "backend/.env" ]; then
    export $(cat backend/.env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ No environment file found!${NC}"
    exit 1
fi

# List available backups
echo -e "${YELLOW}📦 Available backups:${NC}"
echo ""
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"
echo ""

# Ask for backup file
read -p "Enter backup filename (or 'latest' for most recent): " BACKUP_CHOICE

if [ "$BACKUP_CHOICE" = "latest" ]; then
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/*.tar.gz | head -1)
else
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_CHOICE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Selected backup:${NC} $BACKUP_FILE"
echo ""

# Confirm restore
echo -e "${RED}⚠️  WARNING: This will OVERWRITE the current database!${NC}"
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Extract backup
echo -e "\n${YELLOW}📂 Extracting backup...${NC}"
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the actual backup directory
BACKUP_PATH=$(find "$TEMP_DIR" -type d -name "eventify_backup_*" | head -1)

if [ -z "$BACKUP_PATH" ]; then
    echo -e "${RED}❌ Invalid backup structure${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
fi

# Perform restore
echo -e "${YELLOW}🔄 Restoring database...${NC}"

# Extract database name from MONGODB_URI
DB_NAME=$(echo $MONGODB_URI | sed 's/.*\///' | sed 's/?.*//')

if [ -z "$DB_NAME" ]; then
    DB_NAME="eventify"
fi

if [[ $MONGODB_URI == *"mongodb+srv"* ]]; then
    # MongoDB Atlas
    mongorestore --uri="$MONGODB_URI" \
                 --dir="$BACKUP_PATH" \
                 --gzip \
                 --drop
else
    # Local MongoDB
    mongorestore --uri="$MONGODB_URI" \
                 --db="$DB_NAME" \
                 --dir="$BACKUP_PATH/$DB_NAME" \
                 --gzip \
                 --drop
fi

# Clean up
rm -rf "$TEMP_DIR"

echo -e "\n${GREEN}✅ Database restored successfully!${NC}"
echo -e "${YELLOW}⚠️  Remember to restart your application${NC}"
