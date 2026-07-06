#!/bin/sh
set -e

# Substitute ${DOMAIN} in nginx config
sed -i "s/\${DOMAIN}/${DOMAIN}/g" /etc/nginx/nginx.conf

# Generate self-signed cert if real cert doesn't exist (lets nginx start)
CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
    echo "No SSL cert found for ${DOMAIN}, generating self-signed cert..."
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -days 365 \
        -subj "/CN=${DOMAIN}" \
        -newkey rsa:2048 \
        -keyout "$CERT_DIR/privkey.pem" \
        -out "$CERT_DIR/fullchain.pem"
    echo "Self-signed cert generated. Run init-ssl.sh to get a real certificate."
fi

exec nginx -g "daemon off;"
