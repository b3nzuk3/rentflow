# Dockerfile for Nginx reverse proxy (RentFlow production)
FROM nginx:1.27-alpine

# Install envsubst (from gettext) and curl for health checks
RUN apk add --no-cache gettext curl openssl

# Copy nginx configuration template (envsubst will fill in ${DOMAIN})
COPY nginx.conf /etc/nginx/templates/nginx.conf.template

# Copy entrypoint script and fix line endings
COPY entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

# Create certbot webroot directory
RUN mkdir -p /var/www/certbot

# Create letsencrypt directory
RUN mkdir -p /etc/letsencrypt

# Expose ports
EXPOSE 80 443

# Use entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
