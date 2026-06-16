# RentFlow V1 Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement. Delete any code written before tests.

**Goal:** Build a production-grade multi-tenant SaaS platform for African property management — FastAPI backend + Next.js frontend with PostgreSQL, matching the existing prototype's UI/UX exactly.

**Architecture:** Separated frontend/backend with Docker Compose. JWT auth, RBAC, organization-scoped data. REST API at /api/v1/.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, PostgreSQL, Redis, Next.js 15, TypeScript, TailwindCSS 4, shadcn/ui, Zustand, React Query, Docker Compose

---

## Phase A: Backend Foundation

### Task A1: Project Scaffolding

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`
- Create: `backend/Dockerfile`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`

**Step 1: Scaffold the project structure**
```bash
mkdir -p backend/app/{core,db,api/v1,schemas,services,alembic} backend/tests
touch backend/app/__init__.py backend/app/core/__init__.py backend/app/db/__init__.py
touch backend/app/api/__init__.py backend/app/api/v1/__init__.py
touch backend/app/schemas/__init__.py backend/app/services/__init__.py
touch backend/tests/__init__.py
```

**Step 2: Write requirements.txt**
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.35
asyncpg==0.29.0
alembic==1.13.2
pydantic[email]==2.9.0
pydantic-settings==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.12
httpx==0.27.0
pytest==8.3.3
pytest-asyncio==0.24.0
redis==5.1.0
slowapi==0.1.9
```

**Step 3: Write config.py**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "RentFlow"
    APP_VERSION: str = "1.0.0"
    DATABASE_URL: str = "postgresql+asyncpg://rentflow:rentflow@db:5432/rentflow"
    REDIS_URL: str = "redis://redis:6379/0"
    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"

settings = Settings()
```

**Step 4: Write main.py (skeleton)**
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, organizations, properties, units, tenants, leases, payments, users, notifications, audit, reports

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(organizations.router, prefix="/api/v1/organizations", tags=["organizations"])
app.include_router(properties.router, prefix="/api/v1/properties", tags=["properties"])
app.include_router(units.router, prefix="/api/v1/units", tags=["units"])
app.include_router(tenants.router, prefix="/api/v1/tenants", tags=["tenants"])
app.include_router(leases.router, prefix="/api/v1/leases", tags=["leases"])
app.include_router(payments.router, prefix="/api/v1/payments", tags=["payments"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(audit.router, prefix="/api/v1/audit", tags=["audit"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
```

**Step 5: Write conftest.py**
```python
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
```

**Step 6: Write initial tests/test_health.py**
```python
import pytest

@pytest.mark.asyncio
async def test_health_check(client):
    response = await client.get("/api/v1/auth/health")
    assert response.status_code == 404  # Not implemented yet
```

**Step 7: Run test — confirm it behaves**
```bash
cd backend && pip install -r requirements.txt && python -m pytest tests/ -v
```

**Step 8: Commit**
```bash
git add backend/ && git commit -m "feat(backend): scaffold FastAPI project structure"
```

---

### Task A2: Database Models & Setup

**Files:**
- Create: `backend/app/db/database.py`
- Create: `backend/app/db/models.py`
- Create: `backend/app/db/base.py`
- Modify: `backend/tests/conftest.py`

**Step 1: Write failing test for database connection**

**Step 2: Implement database.py with async SQLAlchemy**
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

**Step 3: Implement models.py** — All 10 tables: organizations, users, properties, blocks, units, tenants, leases, payments, audit_logs, notifications. Use UUID primary keys, proper FK relationships, enums for status fields.

**Step 4: Update conftest.py to use test database**

**Step 5: Run tests — confirm DB setup works**

**Step 6: Commit**

---

### Task A3: Auth — Login & JWT

**Files:**
- Create: `backend/app/core/security.py`
- Create: `backend/app/schemas/auth.py`
- Create: `backend/app/api/v1/auth.py`
- Create: `backend/tests/test_auth.py`

**Step 1: Write failing test**
```python
@pytest.mark.asyncio
async def test_login_success(client):
    response = await client.post("/api/v1/auth/login", json={
        "email": "fatuma.ali@amani.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
```

**Step 2: Implement security.py** — JWT encode/decode, bcrypt verify, RBAC dependency

**Step 3: Implement auth.py** — Login endpoint, signup endpoint (invite-based), refresh token

**Step 4: Run test — confirm pass**

**Step 5: Commit**

---

### Task A4: Organizations CRUD

**Files:**
- Create: `backend/app/schemas/organizations.py`
- Create: `backend/app/api/v1/organizations.py`
- Create: `backend/tests/test_organizations.py`

**TDD cycle:** Write test → fail → implement → pass → commit

---

### Task A5: Properties CRUD

**Files:**
- Create: `backend/app/schemas/properties.py`
- Create: `backend/app/api/v1/properties.py`
- Create: `backend/tests/test_properties.py`

---

### Task A6: Blocks CRUD

**Files:**
- Create: `backend/app/api/v1/blocks.py`
- Modify: `backend/app/main.py` (add router)

---

### Task A7: Units CRUD + Status Update

**Files:**
- Create: `backend/app/schemas/units.py`
- Create: `backend/app/api/v1/units.py`
- Create: `backend/tests/test_units.py`

---

### Task A8: Tenants + Invitation System

**Files:**
- Create: `backend/app/schemas/tenants.py`
- Create: `backend/app/api/v1/tenants.py`
- Create: `backend/tests/test_tenants.py`

---

### Task A9: Leases + E-Sign

**Files:**
- Create: `backend/app/schemas/leases.py`
- Create: `backend/app/api/v1/leases.py`
- Create: `backend/tests/test_leases.py`

---

### Task A10: Payments — Submit & Verify

**Files:**
- Create: `backend/app/schemas/payments.py`
- Create: `backend/app/api/v1/payments.py`
- Create: `backend/tests/test_payments.py`

---

### Task A11: Users + RBAC

**Files:**
- Create: `backend/app/schemas/users.py`
- Create: `backend/app/api/v1/users.py`

---

### Task A12: Audit Logging Service

**Files:**
- Create: `backend/app/services/audit_service.py`
- Create: `backend/app/schemas/audit.py`
- Create: `backend/app/api/v1/audit.py`

---

### Task A13: Notifications

**Files:**
- Create: `backend/app/schemas/notifications.py`
- Create: `backend/app/api/v1/notifications.py`

---

### Task A14: Reports & Export

**Files:**
- Create: `backend/app/schemas/reports.py`
- Create: `backend/app/api/v1/reports.py`
- Create: `backend/tests/test_reports.py`

---

## Phase B: Frontend Foundation

### Task B1: Next.js Project Scaffolding

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/next.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/src/app/globals.css`
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`

**Step 1: Scaffold Next.js 15 project with TypeScript + TailwindCSS**

**Step 2: Configure design system tokens in globals.css** (exact colors from prototype)

**Step 3: Install dependencies:** zustand, @tanstack/react-query, axios, lucide-react, framer-motion

**Step 4: Verify dev server runs**

**Step 5: Commit**

---

### Task B2: Auth Store & API Client

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/auth.ts`
- Create: `frontend/src/stores/authStore.ts`
- Create: `frontend/src/hooks/useAuth.ts`

---

### Task B3: Login Page (pixel-perfect match)

**Files:**
- Create: `frontend/src/components/auth/LoginForm.tsx`
- Create: `frontend/src/components/auth/SignupForm.tsx`
- Modify: `frontend/src/app/page.tsx`

**Must match:** Dark left panel with RentFlow branding, feature list with green checkmarks. Right panel with login form (email + password), demo user quick-login buttons. Use exact colors (#006c0c primary, zinc-900 header, Manrope + JetBrains Mono fonts).

---

### Task B4: Header Component (pixel-perfect match)

**Files:**
- Create: `frontend/src/components/layout/Header.tsx`

**Must match:** Dark zinc-900 sticky header. Wallet icon + "RentFlow" + org name. Tab nav (Dashboard, Properties, Leases, Payments, Reports, Settings). "Logs Directory" dropdown. Role selector dropdown with "PORTAL POSITION" label. Avatar + logout. Mobile hamburger menu.

---

### Task B5: Landlord Dashboard (pixel-perfect match)

**Files:**
- Create: `frontend/src/components/dashboard/LandlordDashboard.tsx`
- Create: `frontend/src/app/dashboard/page.tsx`

**Must match:** Bento grid with 4 metric cards (Expected Rent, Collected Rent, Outstanding Balance, Occupancy Rate). Properties grid with images. Activity timeline. Pending payments alert banner. "Add Property" modal. Organization context bar with plan badge and unit limit meter.

---

### Task B6: Properties Page (pixel-perfect match)

**Files:**
- Create: `frontend/src/components/properties/LandlordProperties.tsx`

**Must match:** Sidebar with property directory. Main area with unit table. Block filter pills. Status filter buttons. Add Property/Block/Unit modals. RBAC (caretaker sees read-only, masked financials).

---

### Task B7: Payments Page (pixel-perfect match)

**Files:**
- Create: `frontend/src/components/payments/LandlordPayments.tsx`

**Must match:** Stats cards (pending count, verified volume). Search + filter bar. Payment table with tenant/unit/amount/status. Verification modal with receipt preview. Verify/Reject buttons. RBAC.

---

### Task B8: Leases Page (pixel-perfect match)

**Files:**
- Create: `frontend/src/components/leases/LandlordLeases.tsx`

**Must match:** Status filter tabs. Lease table. "New Tenant Invite & Lease" modal with 2-step form (tenant details + lease parameters). SMS invite info section.

---

### Task B9: Tenant Dashboard (pixel-perfect match)

**Files:**
- Create: `frontend/src/components/dashboard/TenantDashboard.tsx`

**Must match:** Billing status hero card. Outstanding balance. Submit Payment modal with file upload. Payment receipts table. E-sign lease onboarding state. Gold Class tenant score.

---

### Task B10: Super Admin Dashboard (pixel-perfect match)

**Files:**
- Create: `frontend/src/components/dashboard/SuperAdminDashboard.tsx`

**Must match:** Global stats (orgs, revenue, pending, audit). Billing distribution cards. Organization directory table with search. Provision SaaS Tenant modal with plan selection cards. Suspend/Activate/Send Invite actions.

---

### Task B11: Reports Page (pixel-perfect match)

**Files:**
- Create: `frontend/src/components/reports/LandlordReports.tsx`

**Must match:** Collection efficiency, occupancy distribution, outstanding balance cards. Bar chart visualization. CSV/PDF export buttons.

---

### Task B12: Settings Page (pixel-perfect match)

**Files:**
- Create: `frontend/src/components/settings/SaaSSettings.tsx`

**Must match:** Left sidebar with 9 settings sections. Organization Profile form. My Account form. Users & Roles with invite modal. Security with password change + sessions. Notification preferences toggles. Payment routing config. Subscription billing with plan cards. Audit logs with filters. Data export with checkboxes.

---

### Task B13: Notifications & Audit Log Pages

**Files:**
- Create: `frontend/src/components/notifications/NotificationsLog.tsx`
- Create: `frontend/src/components/audit/AuditLogViewer.tsx`

---

## Phase C: Docker & CI/CD

### Task C1: Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Create: `backend/.env.example`

**Step 1: Write docker-compose.yml** with 4 services (backend, frontend, db, redis)

**Step 2: Write Dockerfiles** for both backend and frontend

**Step 3: Verify `docker compose up` starts all services**

**Step 4: Commit**

---

### Task C2: CI/CD Pipeline

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Write GitHub Actions workflow** — lint, test backend, test frontend, build Docker images

**Step 2: Commit**

---

## Execution Order

1. Phase A (backend) tasks A1-A14 — subagent-driven, one task at a time
2. Phase B (frontend) tasks B1-B13 — subagent-driven, one task at a time
3. Phase C (Docker/CI) tasks C1-C2
4. Final review + integration testing
