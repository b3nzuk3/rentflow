#!/bin/bash
# Initial SSL certificate setup for RentFlow
# Uses Certbot with webroot method via Docker

set -euo pipefail

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

DOMAIN="${DOMAIN:?Set DOMAIN in .env}"
EMAIL="${EMAIL:?Set EMAIL in .env}"
COMPOSE_FILE="docker-compose.prod.yml"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Setting up SSL certificate for ${DOMAIN}${NC}"
echo "Email: ${EMAIL}"
echo ""

# Create cert directories
mkdir -p nginx/certs nginx/www

# Check if certificate already exists
if [ -d "nginx/certs/live/${DOMAIN}" ]; then
    echo -e "${YELLOW}Certificate already exists for ${DOMAIN}${NC}"
    echo "To renew, use: ./scripts/renew-ssl.sh"
    exit 0
fi

# Get certificate using webroot method
# First, start nginx with HTTP only to serve the challenge
echo "Requesting SSL certificate..."

# Temporarily create a minimal nginx config for HTTP-only (cert challenge)
docker compose -f "$COMPOSE_FILE" run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    -d "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --force-renewal

echo ""
echo -e "${GREEN}SSL certificate obtained successfully!${NC}"
echo "Certificate saved to: nginx/certs/live/${DOMAIN}/"
echo ""
echo "Next steps:"
echo "  1. Restart nginx: docker compose -f $COMPOSE_FILE restart nginx"
echo "  2. Setup auto-renewal: ./scripts/setup-cron.sh"
