# Dockerfile for Nginx reverse proxy (RentFlow production)
FROM nginx:1.27-alpine

# Install curl for health checks
RUN apk add --no-cache curl openssl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN sed -i 's/\r$//' /entrypoint.sh && chmod +x /entrypoint.sh

# Create certbot directories
RUN mkdir -p /var/www/certbot /etc/letsencrypt

# Expose ports
EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
