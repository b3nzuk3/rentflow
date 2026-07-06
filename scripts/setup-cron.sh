#!/bin/bash
# Setup cron jobs for RentFlow production
# - Daily PostgreSQL backup at 2:00 AM
# - Weekly SSL certificate renewal on Sundays at 3:00 AM

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

GREEN='\033[0;32m'
NC='\033[0m'

echo "Setting up cron jobs..."
echo "Project directory: $PROJECT_DIR"
echo ""

# Build cron entries
BACKUP_CRON="0 2 * * * cd ${PROJECT_DIR} && ${SCRIPT_DIR}/backup-db.sh >> ${PROJECT_DIR}/logs/backup.log 2>&1"
RENEW_CRON="0 3 * * 0 cd ${PROJECT_DIR} && ${SCRIPT_DIR}/renew-ssl.sh >> ${PROJECT_DIR}/logs/ssl-renew.log 2>&1"

# Create logs directory
mkdir -p "${PROJECT_DIR}/logs"

# Add to crontab (preserve existing)
(
    crontab -l 2>/dev/null | grep -v "backup-db.sh" | grep -v "renew-ssl.sh"
    echo "$BACKUP_CRON"
    echo "$RENEW_CRON"
) | crontab -

echo -e "${GREEN}Cron jobs installed:${NC}"
echo "  - Daily backup at 2:00 AM"
echo "  - Weekly SSL renewal on Sundays at 3:00 AM"
echo ""
echo "Verify with: crontab -l"
