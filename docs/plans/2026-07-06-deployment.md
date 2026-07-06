# Deployment Implementation Plan

> **For implementer:** Use TDD where applicable. Commit after each task.

**Goal:** Make RentFlow deployable to a VPS with Docker Compose, Nginx reverse proxy, SSL via Certbot, automated backups, and production-grade env config.

**Architecture:** Docker Compose for orchestration, Nginx for reverse proxy + SSL termination, Let's Encrypt for certificates, cron-based PostgreSQL backups to local + optional S3.

**Tech Stack:** Docker Compose v2, Nginx, Certbot, PostgreSQL 16, cron, bash scripts

---

## Task 1: Production Docker Compose

**Files:**
- Create: `docker-compose.prod.yml`
- Create: `.env.example`

**Step 1: Create `.env.example`**
```bash
# Database
POSTGRES_USER=rentflow
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_DB=rentflow

# Backend
SECRET_KEY=CHANGE_ME_RUN_openssl_rand_hex_32
DATABASE_URL=postgresql+asyncpg://rentflow:CHANGE_ME_STRONG_PASSWORD@db:5432/rentflow
REDIS_URL=redis://redis:6379/0
CORS_ORIGINS=["https://yourdomain.com"]
DEBUG=false

# Frontend
NEXT_PUBLIC_API_URL=https://yourdomain.com/api/v1

# Domain
DOMAIN=yourdomain.com
```

**Step 2: Create `docker-compose.prod.yml`**
- No bind-mount volumes (uses image COPY)
- No `--reload` flag
- Restart policies: `unless-stopped`
- Resource limits
- Proper health checks
- Named volumes for pgdata only

**Step 3: Verify**
```bash
docker compose -f docker-compose.prod.yml config
```

---

## Task 2: Nginx Reverse Proxy + SSL

**Files:**
- Create: `nginx/nginx.conf`
- Create: `nginx/Dockerfile`

**Step 1: Create Nginx config**
- Reverse proxy `/` → frontend:3000
- Reverse proxy `/api/` → backend:8000
- WebSocket support for hot reload (dev) / static serving (prod)
- Security headers (X-Frame-Options, CSP, HSTS)
- Gzip compression
- Rate limiting on API endpoints
- Client max body size for file uploads

**Step 2: Create Nginx Dockerfile**
- Based on nginx:alpine
- Copy config
- Expose 80 + 443

**Step 3: Update docker-compose.prod.yml**
- Add nginx service
- Add certbot service
- Expose only port 80/443 (not 3000/8000)
- Volume mounts for certs + nginx config

---

## Task 3: SSL with Certbot

**Files:**
- Create: `scripts/init-ssl.sh`
- Create: `scripts/renew-ssl.sh`

**Step 1: Create init-ssl.sh**
```bash
#!/bin/bash
# Run once to get initial certificate
# Uses certbot standalone mode with webroot
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  -d $DOMAIN --email $EMAIL --agree-tos --no-eff-email
```

**Step 2: Create renew-ssl.sh**
```bash
#!/bin/bash
# Cron job: 0 3 * * 1 /path/to/renew-ssl.sh
docker compose -f docker-compose.prod.yml run --rm certbot renew
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

**Step 3: Add certbot service to docker-compose.prod.yml**
```yaml
certbot:
  image: certbot/certbot
  volumes:
    - ./nginx/certs:/etc/letsencrypt
    - ./nginx/www:/var/www/certbot
```

---

## Task 4: PostgreSQL Backup Script

**Files:**
- Create: `scripts/backup-db.sh`
- Create: `scripts/restore-db.sh`

**Step 1: Create backup-db.sh**
```bash
#!/bin/bash
# Daily backup: pg_dump to compressed file
# Usage: ./scripts/backup-db.sh
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U rentflow rentflow | gzip > "$BACKUP_DIR/rentflow_$TIMESTAMP.sql.gz"
# Keep last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

**Step 2: Create restore-db.sh**
```bash
#!/bin/bash
# Usage: ./scripts/restore-db.sh backup_file.sql.gz
gunzip -c $1 | docker compose -f docker-compose.prod.yml exec -T db \
  psql -U rentflow rentflow
```

**Step 3: Add cron job setup script**
- Create: `scripts/setup-cron.sh`
- Adds daily backup at 2am + weekly certbot renewal

---

## Task 5: Production Config Updates

**Files:**
- Modify: `backend/app/core/config.py`
- Modify: `frontend/next.config.js` (if needed)

**Step 1: Add production env vars to config.py**
- `BACKEND_URL` (for email links)
- `FRONTEND_URL` (for redirects)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `EMAIL_FROM`
- `BACKUP_S3_BUCKET` (optional)

**Step 2: Update CORS_ORIGINS parsing**
- Support comma-separated string for production env

---

## Task 6: Deployment Documentation

**Files:**
- Create: `DEPLOYMENT.md`

**Content:**
1. Prerequisites (Docker, domain, DNS)
2. Server setup (Ubuntu/Debian)
3. Clone + configure .env
4. Initial SSL setup
5. Start services
6. Seed database
7. Backup schedule
8. Monitoring / health checks
9. Update procedure (pull + rebuild)
10. Troubleshooting

---

## Task 7: Commit & Push

**Step 1: Verify all files exist**
```bash
ls -la docker-compose.prod.yml nginx/ scripts/ DEPLOYMENT.md .env.example
```

**Step 2: Commit**
```bash
git add -A && git commit -m "feat: production deployment setup (Docker, Nginx, SSL, backups)"
```

**Step 3: Push**
```bash
git push origin main
```
