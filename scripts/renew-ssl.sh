#!/bin/bash
# SSL certificate renewal for RentFlow
# Run via cron: 0 3 * * 1 /path/to/scripts/renew-ssl.sh

set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Checking SSL certificate renewal..."

# Attempt renewal
if docker compose -f "$COMPOSE_FILE" --profile certbot run --rm certbot renew --quiet; then
    echo -e "${GREEN}Certificate renewal check complete.${NC}"
    
    # Reload nginx to pick up new certs
    docker compose -f "$COMPOSE_FILE" exec nginx nginx -s reload
    echo -e "${GREEN}Nginx reloaded with updated certificates.${NC}"
else
    echo -e "${YELLOW}Certificate renewal failed or not needed.${NC}"
fi
