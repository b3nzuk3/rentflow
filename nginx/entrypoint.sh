#!/bin/bash
set -e
# Substitute ${DOMAIN} in the nginx config template
envsubst '${DOMAIN}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/nginx.conf
exec nginx -g "daemon off;"
