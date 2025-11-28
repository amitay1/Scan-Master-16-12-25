#!/bin/bash

# Database Backup Script
# This script creates automated backups of the PostgreSQL database

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date)"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set"
    exit 1
fi

# Perform the backup using pg_dump
echo "Creating backup: ${BACKUP_FILE}"
pg_dump "$DATABASE_URL" > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress the backup
echo "Compressing backup..."
gzip "${BACKUP_DIR}/${BACKUP_FILE}"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Calculate backup size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
echo "Backup completed: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Remove old backups
echo "Cleaning up old backups (older than ${BACKUP_RETENTION_DAYS} days)..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +${BACKUP_RETENTION_DAYS} -exec rm {} \; -print

# Create a latest symlink
ln -sf "${BACKUP_FILE}" "${BACKUP_DIR}/latest.sql.gz"

# Optional: Upload to cloud storage (S3, GCS, etc.)
if [ -n "$S3_BUCKET" ]; then
    echo "Uploading to S3..."
    aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}" "s3://${S3_BUCKET}/database-backups/${BACKUP_FILE}"
    echo "Upload completed"
fi

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Database backup completed successfully: ${BACKUP_FILE} (${BACKUP_SIZE})\"}" \
        "$SLACK_WEBHOOK_URL"
fi

echo "Backup process completed at $(date)"