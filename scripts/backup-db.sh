#!/bin/bash
# PostgreSQL backup script for RentFlow
# Usage: ./scripts/backup-db.sh [backup_dir]
# Cron: 0 2 * * * /path/to/scripts/backup-db.sh

set -euo pipefail

# Configuration
BACKUP_DIR="${1:-./backups}"
COMPOSE_FILE="docker-compose.prod.yml"
DB_SERVICE="db"
DB_USER="rentflow"
DB_NAME="rentflow"
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Timestamp for backup file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/rentflow_${TIMESTAMP}.sql.gz"
LATEST_LINK="${BACKUP_DIR}/rentflow_latest.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo -e "${GREEN}Starting PostgreSQL backup...${NC}"
echo "Backup directory: ${BACKUP_DIR}"
echo "Timestamp: ${TIMESTAMP}"
echo "Backup file: ${BACKUP_FILE}"

# Check if docker compose is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: docker not found${NC}"
    exit 1
fi

# Check if compose file exists
if [[ ! -f "${COMPOSE_FILE}" ]]; then
    echo -e "${RED}Error: ${COMPOSE_FILE} not found${NC}"
    exit 1
fi

# Check if database service is running
if ! docker compose -f "${COMPOSE_FILE}" ps "${DB_SERVICE}" | grep -q "Up"; then
    echo -e "${RED}Error: Database service '${DB_SERVICE}' is not running${NC}"
    echo "Start it with: docker compose -f ${COMPOSE_FILE} up -d ${DB_SERVICE}"
    exit 1
fi

# Perform backup
echo "Running pg_dump..."
if docker compose -f "${COMPOSE_FILE}" exec -T "${DB_SERVICE}" \
    pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"; then
    
    # Create/update latest symlink
    ln -sf "$(basename "${BACKUP_FILE}")" "${LATEST_LINK}"
    
    # Get backup size
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo -e "${GREEN}Backup completed successfully!${NC}"
    echo "Backup size: ${BACKUP_SIZE}"
    echo "Backup saved to: ${BACKUP_FILE}"
else
    echo -e "${RED}Backup failed!${NC}"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Clean up old backups
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "rentflow_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
if [[ ${DELETED_COUNT} -gt 0 ]]; then
    echo -e "${YELLOW}Deleted ${DELETED_COUNT} old backup(s)${NC}"
else
    echo "No old backups to clean up"
fi

# List recent backups
echo ""
echo "Recent backups:"
ls -lh "${BACKUP_DIR}"/rentflow_*.sql.gz 2>/dev/null | tail -10 || echo "No backups found"

echo -e "${GREEN}Backup completed successfully!${NC}"