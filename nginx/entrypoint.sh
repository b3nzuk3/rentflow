#!/bin/sh
set -e
# Use sed to substitute ${DOMAIN} in the nginx config
sed -i "s/\${DOMAIN}/${DOMAIN}/g" /etc/nginx/nginx.conf
exec nginx -g "daemon off;"
