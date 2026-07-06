#!/bin/bash
# Nginx entrypoint — substitutes env vars into nginx.conf template
set -e

# Substitute environment variables into the template
envsubst '${DOMAIN}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf

# Generate DH parameters if not already done (takes a while on first boot)
if [ ! -f /etc/ssl/certs/dhparam.pem ]; then
    echo "Generating DH parameters (this may take a moment)..."
    openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
fi

# Start nginx
exec nginx -g "daemon off;"
