<div align="center">

# 🏠 RentFlow

**Multi-tenant SaaS Property Management Platform**

FastAPI + PostgreSQL + Next.js 15 | Built for the African market

[![CI](https://github.com/b3nzuk3/rentflow/actions/workflows/ci.yml/badge.svg)](https://github.com/b3nzuk3/rentflow/actions)
[![Python 3.12](https://img.shields.io/badge/python-3.12-blue.svg)](https://python.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## Features

- **Multi-tenant** — Organizations own properties → blocks → units
- **JWT Auth + RBAC** — Super Admin, Org Owner, Property Manager, Accountant, Caretaker, Tenant
- **Lease Management** — Create, sign, track leases with e-signature
- **Rent Payments** — M-Pesa, bank transfer, cash with verification workflow
- **Audit Logging** — Every mutation tracked with user, timestamp, and change diff
- **Invitation Flow** — Invite tenants → activate account → auto-create lease
- **Billing Periods** — Monthly rent schedules with balance tracking

---

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+

### 1. Clone & Setup

```bash
git clone https://github.com/b3nzuk3/rentflow.git
cd rentflow
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. PostgreSQL

```bash
# Start PostgreSQL (Arch Linux)
sudo mkdir -p /run/postgresql && sudo chown postgres:postgres /run/postgresql
sudo -u postgres /usr/bin/pg_ctl -D /var/lib/postgres/data start

# Create database and user
sudo -u postgres psql -c "CREATE USER rentflow WITH PASSWORD 'rentflow' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE rentflow OWNER rentflow;"
sudo -u postgres psql -d rentflow -c "GRANT ALL ON SCHEMA public TO rentflow;"
```

### 4. Apply Migrations

```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

### 5. Seed Database

```bash
python seed_prod.py
```

This creates:
- **Super Admin:** `superadmin@rentflow.io` / `admin123`
- **Org Owner:** `owner@rentflow.io` / `admin123`
- Sample property, units, tenant, lease, and payment

### 6. Start Backend

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs at: http://localhost:8000/api/docs

### 7. Frontend

```bash
cd frontend
npm install
npm run dev
```

App at: http://localhost:3000

---

## Running Tests

```bash
cd backend
source .venv/bin/activate

# Run all tests (41 tests)
python -m pytest tests/ -v

# Run specific test file
python -m pytest tests/test_auth.py -v

# Run with coverage
python -m pytest tests/ -v --tb=short
```

### Test Database

Tests use a separate `rentflow_test` database. Create it before first run:

```bash
sudo -u postgres psql -c "CREATE DATABASE rentflow_test OWNER rentflow;"
sudo -u postgres psql -d rentflow_test -c "GRANT ALL ON SCHEMA public TO rentflow;"
```

The test suite automatically:
- Creates tables before the session
- Truncates all tables between tests
- Uses a session-scoped event loop for asyncpg compatibility

---

## Docker (Development)

```bash
# Full stack (PostgreSQL + Redis + Backend + Frontend)
docker compose up -d

# View logs
docker compose logs -f backend
```

---

## Deployment (Production)

### Prerequisites

- A VPS (Ubuntu 22.04+ / Debian 12+)
- Docker & Docker Compose v2
- A domain with DNS A record pointing to your server

### Quick Deploy

```bash
# 1. Clone & configure
git clone https://github.com/b3nzuk3/rentflow.git
cd rentflow
cp .env.example .env
nano .env  # Set POSTGRES_PASSWORD, SECRET_KEY, DOMAIN, EMAIL

# 2. Build & start
docker compose -f docker-compose.prod.yml up -d --build

# 3. Run migrations & seed
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
docker compose -f docker-compose.prod.yml exec backend python seed_prod.py

# 4. Setup SSL
./scripts/init-ssl.sh
docker compose -f docker-compose.prod.yml restart nginx

# 5. Setup automated backups
./scripts/setup-cron.sh

# 6. Verify
curl -k https://yourdomain.com/api/health
```

### Production Services

| Service | Description | Port |
|---------|-------------|------|
| nginx | Reverse proxy + SSL termination | 80, 443 |
| backend | FastAPI API server | 8000 (internal) |
| frontend | Next.js SSR app | 3000 (internal) |
| db | PostgreSQL 16 | 5432 (internal) |
| redis | Redis 7 cache | 6379 (internal) |

### Backup & Restore

```bash
# Manual backup
./scripts/backup-db.sh

# Restore from backup
./scripts/restore-db.sh ./backups/rentflow_20260706_020000.sql.gz
```

Automated daily backups run at 2:00 AM via cron.

### Updating

```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the full deployment guide.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/login` | Login, get tokens |
| POST | `/api/v1/auth/signup` | Create user account |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/users/me` | Current user profile |
| GET | `/api/v1/organizations/me` | Current org |
| GET/POST | `/api/v1/properties/` | List/create properties |
| GET/POST | `/api/v1/blocks/` | List/create blocks |
| GET/POST | `/api/v1/units/` | List/create units |
| GET/POST | `/api/v1/tenants/` | List/create tenants |
| GET/POST | `/api/v1/leases/` | List/create leases |
| PATCH | `/api/v1/leases/{id}/sign` | Sign a lease |
| GET/POST | `/api/v1/payments/` | List/submit payments |
| PATCH | `/api/v1/payments/{id}/verify` | Verify payment |
| GET | `/api/v1/audit/` | Audit logs |
| GET | `/api/v1/reports/summary` | Report summary |
| GET | `/api/health` | Health check |
| GET | `/api/ready` | Readiness probe |

---

## Project Structure

```
rentflow/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + routers
│   │   ├── middleware.py         # ASGI middleware
│   │   ├── core/
│   │   │   ├── config.py        # Settings
│   │   │   ├── security.py      # JWT + RBAC
│   │   │   └── exception_handlers.py
│   │   ├── db/
│   │   │   ├── database.py      # Async engine
│   │   │   └── models.py        # 11 SQLAlchemy models
│   │   ├── api/v1/              # 13 route modules
│   │   ├── schemas/             # Pydantic models
│   │   └── services/            # Audit, email
│   ├── alembic/                 # Migrations
│   ├── tests/                   # 41 tests (all passing)
│   ├── seed_prod.py             # Production seed
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js app router
│   │   ├── components/          # UI components
│   │   ├── lib/api.ts           # API client
│   │   └── stores/              # Zustand state
│   └── Dockerfile
├── .github/workflows/ci.yml     # CI/CD
├── docker-compose.yml           # Development
├── docker-compose.prod.yml      # Production
├── nginx/                       # Reverse proxy config
├── scripts/                     # Deployment scripts
└── DEPLOYMENT.md                # Full deployment guide
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy 2.0 (async), Pydantic v2 |
| Database | PostgreSQL 18, Alembic migrations |
| Auth | JWT (access + refresh), bcrypt, RBAC |
| Frontend | Next.js 15, React 19, TypeScript |
| State | Zustand |
| HTTP Client | Axios with interceptors |
| Testing | pytest, pytest-asyncio, httpx |
| CI/CD | GitHub Actions |
| Containers | Docker, Docker Compose |

---

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql+asyncpg://rentflow:rentflow@localhost:5432/rentflow
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=["http://localhost:3000"]
DEBUG=true
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## License

MIT
