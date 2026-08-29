#!/bin/bash
# Database Backup Script
# Backs up Supabase PostgreSQL database to local file

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/northstar_backup_$TIMESTAMP.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Starting database backup...${NC}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}Error: DATABASE_URL environment variable not set${NC}"
  echo "Set it with: export DATABASE_URL='your_database_url'"
  exit 1
fi

# Perform backup
echo "Backing up to: $BACKUP_FILE"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  # Compress backup
  gzip "$BACKUP_FILE"
  COMPRESSED_FILE="${BACKUP_FILE}.gz"
  
  # Get file size
  SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
  
  echo -e "${GREEN}✓ Backup successful!${NC}"
  echo "File: $COMPRESSED_FILE"
  echo "Size: $SIZE"
  
  # Clean up old backups (keep last 7 days)
  echo -e "${YELLOW}Cleaning up old backups...${NC}"
  find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
  echo -e "${GREEN}✓ Cleanup complete${NC}"
else
  echo -e "${RED}✗ Backup failed${NC}"
  exit 1
fi

echo ""
echo "To restore this backup:"
echo "  gunzip -c $COMPRESSED_FILE | psql \$DATABASE_URL"
