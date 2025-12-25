#!/bin/bash

# Database Restore Script
# This script restores a PostgreSQL database from a backup

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set"
    exit 1
fi

# Function to list available backups
list_backups() {
    echo "Available backups:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print $9, $5}' | nl
}

# Function to restore from backup
restore_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        echo "ERROR: Backup file not found: $backup_file"
        exit 1
    fi
    
    echo "WARNING: This will replace all data in the current database!"
    echo "Backup file: $backup_file"
    read -p "Are you sure you want to continue? (yes/no): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        echo "Restore cancelled"
        exit 0
    fi
    
    # Create a temporary uncompressed file
    echo "Decompressing backup..."
    TEMP_FILE=$(mktemp)
    gunzip -c "$backup_file" > "$TEMP_FILE"
    
    # Restore the database
    echo "Restoring database..."
    psql "$DATABASE_URL" < "$TEMP_FILE"
    
    # Clean up
    rm "$TEMP_FILE"
    
    echo "Restore completed successfully"
}

# Main script logic
if [ $# -eq 0 ]; then
    # No arguments, show interactive menu
    list_backups
    echo ""
    read -p "Enter the number of the backup to restore (or 'latest' for the most recent): " choice
    
    if [ "$choice" = "latest" ]; then
        BACKUP_FILE="${BACKUP_DIR}/latest.sql.gz"
    else
        BACKUP_FILE=$(ls "$BACKUP_DIR"/*.sql.gz 2>/dev/null | sed -n "${choice}p")
    fi
    
    restore_backup "$BACKUP_FILE"
else
    # Backup file specified as argument
    restore_backup "$1"
fi