# RentFlow V1 — Full-Stack Implementation Design

> **Approved by:** Hussein Salim (b3nzuk3)
> **Date:** 2026-06-16
> **Status:** Approved — proceed to implementation plan

---

## 1. Architecture Overview

Separated frontend/backend monorepo at `/root/projects/saas-projects/rentflow/`.

```
rentflow/
├── docker-compose.yml
├── .github/workflows/ci.yml
├── backend/                        # FastAPI + PostgreSQL + Redis
│   ├── app/
│   │   ├── main.py                 # App entry, CORS, middleware
│   │   ├── core/
│   │   │   ├── config.py           # Settings from env vars
│   │   │   ├── security.py         # JWT, password hashing, RBAC deps
│   │   │   └── deps.py             # DB session, current user deps
│   │   ├── db/
│   │   │   ├── database.py         # SQLAlchemy engine/session
│   │   │   └── models.py           # All SQLAlchemy ORM models
│   │   ├── api/v1/
│   │   │   ├── auth.py             # Login, signup, refresh
│   │   │   ├── organizations.py    # CRUD, provision, suspend
│   │   │   ├── properties.py       # CRUD
│   │   │   ├── blocks.py           # CRUD
│   │   │   ├── units.py            # CRUD, status update
│   │   │   ├── tenants.py          # CRUD, invite
│   │   │   ├── leases.py           # CRUD, e-sign
│   │   │   ├── payments.py         # Submit, verify, reject
│   │   │   ├── users.py            # CRUD, roles
│   │   │   ├── notifications.py    # List, triggers
│   │   │   ├── audit.py            # List logs
│   │   │   └── reports.py          # Aggregated data, CSV/PDF export
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── organizations.py
│   │   │   ├── properties.py
│   │   │   ├── units.py
│   │   │   ├── tenants.py
│   │   │   ├── leases.py
│   │   │   ├── payments.py
│   │   │   ├── users.py
│   │   │   ├── notifications.py
│   │   │   ├── audit.py
│   │   │   └── reports.py
│   │   ├── services/
│   │   │   ├── audit_service.py    # Auto-log mutations
│   │   │   └── notification_service.py  # SMS/email stubs
│   │   └── alembic/                # DB migrations
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_properties.py
│   │   ├── test_units.py
│   │   ├── test_tenants.py
│   │   ├── test_leases.py
│   │   ├── test_payments.py
│   │   └── test_reports.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                       # Next.js 15 + TailwindCSS + shadcn/ui
│   ├── src/
│   │   ├── app/                    # App Router
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── page.tsx            # Login page
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx        # Main dashboard (role-based)
│   │   │   └── globals.css        # Design system tokens
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui primitives
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx      # Top nav bar
│   │   │   │   └── Sidebar.tsx     # Settings sidebar
│   │   │   ├── auth/
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── LandlordDashboard.tsx
│   │   │   │   ├── TenantDashboard.tsx
│   │   │   │   └── SuperAdminDashboard.tsx
│   │   │   ├── properties/
│   │   │   │   └── LandlordProperties.tsx
│   │   │   ├── payments/
│   │   │   │   └── LandlordPayments.tsx
│   │   │   ├── leases/
│   │   │   │   └── LandlordLeases.tsx
│   │   │   ├── reports/
│   │   │   │   └── LandlordReports.tsx
│   │   │   ├── settings/
│   │   │   │   └── SaaSSettings.tsx
│   │   │   ├── notifications/
│   │   │   │   └── NotificationsLog.tsx
│   │   │   └── audit/
│   │   │       └── AuditLogViewer.tsx
│   │   ├── lib/
│   │   │   ├── api.ts              # Axios/fetch client
│   │   │   ├── auth.ts             # Token management
│   │   │   └── utils.ts            # Helpers
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useApi.ts
│   │   └── stores/
│   │       └── authStore.ts        # Zustand auth state
│   ├── Dockerfile
│   └── package.json
└── docs/plans/
```

## 2. UI/UX Design System (MUST be preserved exactly)

The existing prototype at `src/` defines the complete visual language. The Next.js frontend must reproduce this pixel-for-pixel.

### 2.1 Design Tokens

```css
/* Fonts */
--font-sans: "Manrope", "Inter", ui-sans-serif, system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;

/* Colors */
--color-primary: #006c0c;           /* Jungle Green */
--color-primary-hover: #004d08;
--color-primary-container: #1c871e;
--color-on-primary-container: #f8fff0;
--color-background-custom: #f8faf8;
--color-surface-custom: #faf9f6;
--color-surface-dim: #dadad7;
--color-surface-container-low: #f4f4f0;
--color-surface-container: #eeeeea;
--color-surface-container-high: #e8e8e5;
--color-surface-container-highest: #e2e3df;
--color-on-surface: #1a1c1a;
--color-on-surface-variant: #3f4a3b;
--color-outline-variant: #becab7;
--color-tertiary: #a52a66;
--color-tertiary-container: #c5447f;
--color-error-container: #ffdad6;
--color-on-error-container: #93000a;
```

### 2.2 Component Patterns

**Cards (`.flat-card`):**
- White background, 1px solid #e9f0e9 border
- border-radius: 1rem (rounded-2xl)
- On hover: border-color → primary, subtle box-shadow
- Used for all metric cards, content panels

**Buttons:**
- Primary: bg-primary, white text, rounded-xl, font-bold, uppercase tracking-wider
- Secondary: border border-primary, text-primary, rounded-xl
- Danger: border-red-200, text-rose-650
- All have `active:scale-95` press animation

**Tables:**
- Header: bg-slate-50, font-mono uppercase text-[10-11px] text-on-surface-variant
- Body rows: divide-y divide-outline-variant/60, hover:bg-primary/[0.01]
- Monospace for codes, amounts, dates

**Status Badges:**
- Pending: bg-amber-50 text-amber-800 border-amber-200, pulsing dot
- Verified/Active: bg-emerald-50 text-emerald-800 border-emerald-250
- Rejected/Error: bg-rose-50 text-rose-800 border-rose-200
- Draft: bg-amber-50 text-amber-800 border-amber-200
- Occupied: bg-emerald-50 text-emerald-800 border-emerald-200
- Vacant: bg-slate-50 text-slate-700 border-slate-250
- Reserved: bg-blue-50 text-blue-800 border-blue-200
- Notice Given: bg-amber-50 text-amber-850 border-amber-250
- Under Maintenance: bg-rose-50 text-rose-800 border-rose-200

**Modals:**
- Backdrop: bg-black/40 with backdrop-blur-sm
- Container: bg-white rounded-2xl shadow-xl, max-w-md
- Animate: scale 0.95→1, opacity 0→1 (motion/framer-motion)
- Close button: rotate-45 Plus icon or X icon

**Forms:**
- Labels: text-[10px] font-bold font-mono uppercase text-zinc-650
- Inputs: border border-zinc-250 rounded-xl, focus:ring-2 focus:ring-primary/25 focus:border-primary
- Font: Manrope for UI, JetBrains Mono for codes/data

### 2.3 Layout Patterns

**Header (dark zinc-900):**
- Sticky top, z-40
- Left: Wallet icon + "RentFlow" (font-black text-2xl) + org name (font-mono text-xs text-[#4CAF50])
- Center (desktop): Tab nav buttons — Dashboard, Properties, Leases, Payments, Reports, Settings
- "Logs Directory" dropdown → Notifications + Audit Logs
- Right: Role selector dropdown (PORTAL POSITION), avatar, logout
- Mobile: hamburger menu with full nav panel

**Dashboard Bento Grid:**
- 4-column grid of metric cards
- Each card: icon top-left, label (font-mono uppercase), large number (text-3xl font-extrabold), subtitle
- Cards: Expected Rent, Collected Rent, Outstanding Balance, Occupancy Rate

**Sidebar + Content (Properties, Settings):**
- Left sidebar (col-span-4): navigation/filter panel
- Right content (col-span-8): main data table/grid

### 2.4 Role-Based UI Differences

- **Caretaker:** Financial values masked (KSh ••••••), read-only on settings, can update unit status via dropdown
- **Accountant:** Can verify payments, read-only on org settings
- **Property Manager:** Can manage properties/leases/tenants, cannot modify subscription
- **Org Owner:** Full access including subscription billing
- **Super Admin:** Platform-wide view, org provisioning, global stats
- **Tenant:** Tenant portal only — submit payments, view lease, payment history

## 3. Database Schema (PostgreSQL)

```sql
-- Organizations
organizations (id UUID PK, name, subscription_plan, is_active, created_at, updated_at)

-- Users
users (id UUID PK, organization_id FK, first_name, last_name, phone_number, email UNIQUE, password_hash, role, is_active, created_at, updated_at)

-- Properties
properties (id UUID PK, organization_id FK, name, location, description, status, image_url, created_at, updated_at)

-- Blocks
blocks (id UUID PK, property_id FK, name, created_at, updated_at)

-- Units
units (id UUID PK, organization_id FK, property_id FK, block_id FK NULL, unit_code, rent_amount, status, created_at, updated_at)

-- Tenants
tenants (id UUID PK, organization_id FK, first_name, last_name, phone_number, email, national_id, status, created_at, updated_at)

-- Leases
leases (id UUID PK, organization_id FK, tenant_id FK, unit_id FK, monthly_rent, security_deposit, start_date, end_date, status, created_at, updated_at)

-- Payments
payments (id UUID PK, organization_id FK, lease_id FK, amount, payment_method, transaction_code UNIQUE, payment_date, submitted_by, verified_by NULL, verification_notes, status, receipt_attachment NULL, created_at, updated_at)

-- Audit Logs
audit_logs (id UUID PK, organization_id FK, user_id FK, action, entity, previous_value NULL, new_value, ip_address NULL, created_at)

-- Notifications
notifications (id UUID PK, organization_id FK, channel, trigger_type, recipient, message, status, created_at)

-- Invitations
invitations (id UUID PK, organization_id FK, email, phone, token, role, expires_at, created_at)
```

## 4. API Design

REST API at `/api/v1/` with OpenAPI/Swagger docs.

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/login | Login with email/password | Public |
| POST | /auth/signup | Org owner signup (invite-only) | Public |
| POST | /auth/refresh | Refresh JWT token | JWT |
| GET | /organizations | List orgs (super admin) | Super Admin |
| POST | /organizations | Provision new org | Super Admin |
| PATCH | /organizations/{id} | Update org (name, plan, active) | Super Admin |
| GET | /properties | List org properties | Authenticated |
| POST | /properties | Create property | Owner/Manager |
| GET | /properties/{id} | Get property details | Authenticated |
| DELETE | /properties/{id} | Delete property | Owner/Manager |
| GET | /blocks | List blocks for property | Authenticated |
| POST | /blocks | Create block | Owner/Manager |
| DELETE | /blocks/{id} | Delete block | Owner/Manager |
| GET | /units | List units (filter by property/status/block) | Authenticated |
| POST | /units | Create unit | Owner/Manager |
| PATCH | /units/{id}/status | Update unit status | Owner/Manager/Caretaker |
| DELETE | /units/{id} | Delete unit | Owner/Manager |
| GET | /tenants | List tenants | Authenticated |
| POST | /tenants/invite | Invite tenant (creates draft lease) | Owner/Manager |
| PATCH | /tenants/{id} | Update tenant | Owner/Manager |
| GET | /leases | List leases (filter by status) | Authenticated |
| POST | /leases | Create draft lease | Owner/Manager |
| PATCH | /leases/{id}/sign | E-sign lease (tenant) | Tenant |
| GET | /payments | List payments (filter by status) | Authenticated |
| POST | /payments | Submit payment | Tenant |
| PATCH | /payments/{id}/verify | Verify/reject payment | Owner/Manager/Accountant |
| GET | /reports/summary | Dashboard metrics | Authenticated |
| GET | /reports/export/csv | Export CSV | Authenticated |
| GET | /audit | List audit logs | Authenticated |
| GET | /notifications | List notifications | Authenticated |
| GET | /users | List org users | Owner/Manager |
| POST | /users/invite | Invite user | Owner/Manager |

## 5. Security

- JWT access tokens (30min expiry) + refresh tokens (7day)
- bcrypt password hashing
- RBAC enforced at API level via FastAPI dependencies
- Organization-scoped queries (every query filters by org_id)
- CORS configured for frontend origin
- Input validation via Pydantic
- Rate limiting via slowapi

## 6. Docker Compose Services

- `backend`: FastAPI on port 8000
- `frontend`: Next.js on port 3000
- `db`: PostgreSQL 16 on port 5432
- `redis`: Redis 7 on port 6379

## 7. Testing Strategy

- Backend: pytest + httpx async client, test DB per test session
- Frontend: Jest + React Testing Library (component tests)
- Coverage target: 80%+ for backend business logic
- TDD: write failing test first, implement, watch pass, commit

## 8. CI/CD

- GitHub Actions: lint → test → build → push Docker images
- Runs on PRs to main and direct pushes to main
