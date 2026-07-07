# Deployment Implementation Plan

> **For implementer:** Use TDD where applicable. Commit after each task.

**Goal:** Make RentFlow deployable to a VPS with Docker Compose, Nginx reverse proxy, SSL via Certbot, automated backups, and production-grade env config.

**Architecture:** Docker Compose for orchestration, Nginx for reverse proxy + SSL termination, Let's Encrypt for certificates, cron-based PostgreSQL backups.

**Tech Stack:** Docker Compose v2, Nginx, Certbot, PostgreSQL 16, cron, bash scripts

---

## ✅ COMPLETED TASKS

### Task 1: Production Docker Compose
- `docker-compose.prod.yml` — 6 services (db, redis, backend, frontend, nginx, certbot)
- `.env.example` — template with all required vars
- `frontend/.dockerignore` + `backend/.dockerignore` — prevent .env.local leaking into builds

### Task 2: Nginx Reverse Proxy + SSL
- `nginx/nginx.conf` — HTTPS reverse proxy with security headers, gzip, rate limiting
- `nginx/Dockerfile` — nginx:alpine with envsubst for domain substitution
- `nginx/entrypoint.sh` — generates self-signed cert if real cert missing

### Task 3: SSL with Certbot
- `scripts/init-ssl.sh` — initial Let's Encrypt certificate
- `scripts/renew-ssl.sh` — certificate renewal + nginx reload

### Task 4: PostgreSQL Backup
- `scripts/backup-db.sh` — daily backup with 30-day retention
- `scripts/restore-db.sh` — restore from backup with confirmation
- `scripts/setup-cron.sh` — installs daily backup + weekly SSL renewal

### Task 5: Production Config
- `backend/app/core/config.py` — added BACKEND_URL, FRONTEND_URL, SMTP_*, EMAIL_FROM, BACKUP_S3_BUCKET
- `backend/app/main.py` — redirect_slashes=True (default, allows trailing slash redirects)
- `backend/Dockerfile` — copies alembic.ini, alembic/, seed_prod.py; uvicorn runs with --proxy-headers
- `frontend/src/lib/api.ts` — API_BASE hardcoded to '/api/v1' (relative URL)

### Task 6: CI/CD Pipeline
- `.github/workflows/ci.yml` — lint → test → docker build → deploy via SSH

### Task 7: Documentation
- `DEPLOYMENT.md` — full deployment guide
- `README.md` — added production deployment section

---

## 🐛 BUGS FIXED DURING DEPLOYMENT

### Mixed Content (HTTP vs HTTPS)
**Root cause:** `.env.local` on VPS had `NEXT_PUBLIC_API_URL=http://...` which got COPY'd into Docker build and baked into the JS bundle at build time.
**Fix:** Added `frontend/.dockerignore` excluding `.env.local`; hardcoded API_BASE to `/api/v1`.

### FastAPI 307 Redirect to HTTP
**Root cause:** FastAPI redirects `/api/v1/properties` → `/api/v1/properties/` but sends the redirect URL as `http://` because it doesn't know about HTTPS.
**Fix:** Added `--proxy-headers --forwarded-allow-ips=*` to uvicorn CMD in backend Dockerfile.

### Nginx "upstream directive not allowed"
**Root cause:** nginx.conf was missing `events {}` and `http {}` blocks.
**Fix:** Added proper `events { worker_connections 1024; }` and `http { ... }` wrapping all directives.

### Nginx "no such file or directory" for entrypoint.sh
**Root cause:** Alpine has no bash — only sh. The `#!/bin/bash` shebang failed silently.
**Fix:** Changed to `#!/bin/sh`.

### Nginx Config Variables Eaten by envsubst
**Root cause:** `envsubst` treated `$binary_remote_addr` as a variable and replaced it with empty string.
**Fix:** Switched from envsubst to `sed` for domain substitution.

### SMTP_PORT Validation Error
**Root cause:** `SMTP_PORT` typed as `int` in config.py, but docker-compose passed empty string `""` when not in .env.
**Fix:** Removed optional env vars from docker-compose.prod.yml — they have defaults in config.py.

---

## 🚀 HOW TO DEPLOY

### Quick Deploy
```bash
git clone https://github.com/b3nzuk3/rentflow.git
cd rentflow
cp .env.example .env
nano .env  # Set POSTGRES_PASSWORD, SECRET_KEY, DOMAIN, EMAIL

docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
docker compose -f docker-compose.prod.yml exec backend python seed_prod.py

# SSL
./scripts/init-ssl.sh
docker compose -f docker-compose.prod.yml restart nginx

# Backups
./scripts/setup-cron.sh
```

### Update Procedure
```bash
git pull origin master
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

## ⚠️ KEY GOTCHAS

1. **`.env.local` leaks into Docker builds** — always delete before rebuilding, or rely on `.dockerignore`
2. **uvicorn needs `--proxy-headers`** — otherwise FastAPI redirects to `http://` behind nginx
3. **Alpine has no bash** — entrypoint scripts must use `#!/bin/sh`
4. **envsubst eats `$` variables** — use `sed` instead for domain substitution
5. **NEXT_PUBLIC_API_URL is build-time** — changes require `--no-cache` rebuild
6. **`POSTGRES_PASSWORD` must match `DATABASE_URL`** — docker-compose now constructs DATABASE_URL from individual vars to prevent mismatch
