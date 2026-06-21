# RentFlow — PostgreSQL Migration + Real Accounts Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** Migrate from SQLite to PostgreSQL, set up Alembic migrations, create 2 real accounts (superadmin + owner) while keeping all mock data.

**Tech Stack:** PostgreSQL 16, Redis 7, FastAPI, SQLAlchemy with UUID types, Alembic, Docker Compose

---

## Task 1: Install PostgreSQL + Redis

**Files:**
- System packages

**Steps:**
```bash
pacman -S --noconfirm postgresql redis
sudo -u postgres initdb -D /var/lib/postgres/data
sudo -u postgres createdb rentflow
sudo -u postgres psql -c "CREATE USER rentflow WITH PASSWORD 'rentflow';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE rentflow TO rentflow;"
systemctl --user enable --now postgresql
systemctl --user enable --now redis
```

**Verify:**
```bash
psql -U rentflow -d rentflow -c "SELECT 1"
redis-cli ping
```

**Commit:** `feat(infra): install PostgreSQL and Redis`

---

## Task 2: Update Backend Dependencies

**Files:**
- Modify: `backend/requirements.txt`

**Changes:**
- Replace `aiosqlite` with `asyncpg` (already in requirements)
- Ensure `psycopg2-binary` is NOT needed (asyncpg is the async driver)
- Add `alembic` (already in requirements)

**Verify:**
```bash
cd backend && source .venv/bin/activate && pip install -r requirements.txt
```

**Commit:** `feat(backend): update dependencies for PostgreSQL`

---

## Task 3: Switch Models to UUID (PostgreSQL native)

**Files:**
- Modify: `backend/app/db/models.py`
- Modify: `backend/app/db/database.py`

**Changes in models.py:**
- Replace `Column(String(36), ...)` with `Column(UUID(as_uuid=True), ...)` for all id columns
- Replace `ForeignKey("table.id")` with `ForeignKey("table.id", ondelete="...")` — keep existing
- Import: `from sqlalchemy.dialects.postgresql import UUID`
- Default: `default=uuid.uuid4` (not `default=lambda: str(uuid.uuid4())`)

**Changes in database.py:**
- Update `DATABASE_URL` default to: `postgresql+asyncpg://rentflow:rentflow@localhost:5432/rentflow`
- Remove SQLite-specific engine options

**Commit:** `feat(models): switch to PostgreSQL native UUID types`

---

## Task 4: Update Pydantic Schemas to UUID

**Files:**
- Modify: `backend/app/schemas/*.py` (all schema files)

**Changes:**
- Replace `id: str` with `id: UUID` in all response schemas
- Replace `organization_id: str` with `organization_id: UUID`
- Replace all FK fields: `tenant_id: str` → `tenant_id: UUID`, etc.
- Replace `Optional[str]` with `Optional[UUID]` for nullable FK fields
- Add `from uuid import UUID` import where needed

**Commit:** `feat(schemas): restore UUID types for PostgreSQL`

---

## Task 5: Update API Route Parameters to UUID

**Files:**
- Modify: `backend/app/api/v1/*.py` (all route files)

**Changes:**
- Replace `param: str` with `param: UUID` for all path parameters (org_id, property_id, unit_id, etc.)
- Replace `Optional[str]` with `Optional[UUID]` for query parameters
- Remove `from uuid import UUID` imports that were added for str conversion

**Commit:** `feat(api): restore UUID path/query parameters`

---

## Task 6: Set Up Alembic Migrations

**Files:**
- Create: `backend/alembic.ini`
- Create: `backend/app/alembic/env.py`
- Create: `backend/app/alembic/versions/001_initial_schema.py`

**Steps:**
```bash
cd backend && source .venv/bin/activate
alembic init app/alembic
# Edit env.py to import Base from app.db.models and set target_metadata
# Edit alembic.ini to set sqlalchemy.url
alembic revision --autogenerate -m "Initial schema"
```

**Commit:** `feat(db): set up Alembic migrations`

---

## Task 7: Create Real Account Seed Script

**Files:**
- Create: `backend/seed_real.py`

**Real accounts to create:**
- Super Admin: `superadmin@rentflow.io` / `R3ntFl0w!@#4dm1n`
- Org Owner: `owner@rentflow.io` / `R3ntFl0w!@#0wn3r`
- Organization: "RentFlow Demo Properties" (Growth plan)

**Also keep existing mock data** — the seed script should:
1. Create the real organization with real accounts
2. Create the mock organization ("Amani Property Group Ltd") with all mock users
3. Print all credentials to console

**Commit:** `feat(seed): create real accounts + keep mock data`

---

## Task 8: Update Docker Compose

**Files:**
- Modify: `docker-compose.yml`
- Modify: `backend/Dockerfile`

**Changes:**
- Ensure db service uses `postgres:16-alpine`
- Add healthcheck for PostgreSQL
- Update backend DATABASE_URL to use `db` hostname
- Add Redis service if not present

**Commit:** `feat(docker): update compose for PostgreSQL + Redis`

---

## Task 9: Full Integration Test

**Steps:**
1. `docker compose up -d` (or run PostgreSQL + Redis locally)
2. `alembic upgrade head`
3. `python seed_real.py`
4. `uvicorn app.main:app --reload --port 8000`
5. Test login with real accounts via curl
6. Test login with mock accounts via curl
7. Verify all API endpoints return data

**Commit:** `test: verify real accounts and mock data both work`
