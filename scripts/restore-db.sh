#!/bin/bash
# PostgreSQL restore script for RentFlow
# Usage: ./scripts/restore-db.sh <backup_file.sql.gz>

set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
DB_SERVICE="db"
DB_USER="rentflow"
DB_NAME="rentflow"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ -z "${1:-}" ]; then
    echo -e "${RED}Usage: $0 <backup_file.sql.gz>${NC}"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/rentflow_*.sql.gz 2>/dev/null | tail -10 || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [[ ! -f "$BACKUP_FILE" ]]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}WARNING: This will overwrite the current database!${NC}"
echo "Backup file: $BACKUP_FILE"
echo "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo ""
read -p "Are you sure you want to restore? (yes/no): " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
    echo "Restore cancelled."
    exit 0
fi

echo -e "${GREEN}Restoring database from $BACKUP_FILE...${NC}"

if gunzip -c "$BACKUP_FILE" | docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" \
    psql -U "$DB_USER" -d "$DB_NAME" --single-transaction; then
    echo -e "${GREEN}Database restored successfully!${NC}"
else
    echo -e "${RED}Restore failed!${NC}"
    exit 1
fi
