# RentFlow Deployment Guide

## Prerequisites

- A VPS (Ubuntu 22.04+ / Debian 12+ recommended)
- Docker & Docker Compose v2 installed
- A domain name pointed to your server's IP (A record)
- SSH access to the server

## 1. Server Initial Setup

```bash
# Install Docker
sudo apt update && sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# Log out and back in for group change to take effect
```

## 2. Clone & Configure

```bash
git clone https://github.com/b3nzuk3/rentflow.git
cd rentflow

# Create production env file
cp .env.example .env
nano .env  # Fill in all values
```

**Required `.env` values:**
- `POSTGRES_PASSWORD` — strong random password
- `SECRET_KEY` — generate with `openssl rand -hex 32`
- `DOMAIN` — your domain (e.g., `app.rentflow.io`)
- `EMAIL` — for SSL certificate notifications
- `NEXT_PUBLIC_API_URL` — `https://yourdomain.com/api/v1`

## 3. Start Services

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f backend
```

## 4. Database Setup

```bash
# Run migrations
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Seed with demo data (optional)
docker compose -f docker-compose.prod.yml exec backend python seed_prod.py
```

## 5. SSL Certificate

```bash
# Initial certificate (run once)
./scripts/init-ssl.sh

# Restart nginx to use the certificate
docker compose -f docker-compose.prod.yml restart nginx
```

## 6. Automated Backups & Renewal

```bash
# Setup cron jobs (daily backup + weekly SSL renewal)
./scripts/setup-cron.sh
```

## 7. Verify Deployment

```bash
# Health check
curl -k https://yourdomain.com/api/health

# Test frontend
curl -k https://yourdomain.com/

# Check all services
docker compose -f docker-compose.prod.yml ps
```

## 8. Updating the Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Run any new migrations
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

## 9. Manual Backup & Restore

```bash
# Create backup
./scripts/backup-db.sh

# Restore from backup
./scripts/restore-db.sh ./backups/rentflow_20260706_020000.sql.gz
```

## 10. Monitoring

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# Check specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Check resource usage
docker stats

# Check disk usage
docker system df
```

## Troubleshooting

**Backend won't start:**
```bash
docker compose -f docker-compose.prod.yml logs backend
# Common: wrong DATABASE_URL, missing SECRET_KEY
```

**Nginx 502 Bad Gateway:**
```bash
docker compose -f docker-compose.prod.yml ps
# Ensure backend and frontend containers are running
docker compose -f docker-compose.prod.yml restart nginx
```

**SSL certificate issues:**
```bash
# Check certificate
docker compose -f docker-compose.prod.yml run --rm certbot certificates

# Force renewal
./scripts/init-ssl.sh  # will skip if already exists
# Or manually:
docker compose -f docker-compose.prod.yml run --rm certbot renew --force-renewal
```

**Database connection refused:**
```bash
docker compose -f docker-compose.prod.yml ps db
docker compose -f docker-compose.prod.yml logs db
# Ensure POSTGRES_PASSWORD in .env matches DATABASE_URL
```
