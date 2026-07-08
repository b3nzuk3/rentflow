# Settings: Audit Trail & Data Export Implementation Plan

> **For implementer:** Use TDD where applicable. Commit after each task.

**Goal:** Make the "Secure Audit Trail" and "Data Portability" tabs in SaaSSettings functional with real data, search/filter, and CSV export.

**Architecture:** Backend adds export endpoint returning CSV data. Frontend connects audit_logs tab to existing `/audit/` API with search/filter, and data_export tab downloads CSV files from the new export endpoint.

**Tech Stack:** FastAPI, SQLAlchemy, Python csv module, React

---

## ✅ COMPLETED TASKS

None yet.

---

## 📋 TASKS

### Task 1: Backend — Audit log search/filter endpoint

**Objective:** Add query parameters to the existing audit endpoint for filtering by action, entity, and search text.

**Files:**
- Modify: `backend/app/api/v1/audit.py`

**Step 1: Add query parameters**

Update the existing `list_audit_logs` endpoint to accept optional filters:

```python
@router.get("/", response_model=list[AuditLogResponse])
async def list_audit_logs(
    limit: int = 50,
    offset: int = 0,
    action: str = None,
    entity: str = None,
    search: str = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = select(AuditLog).where(AuditLog.organization_id == current_user.organization_id)
    if action:
        query = query.where(AuditLog.action == action)
    if entity:
        query = query.where(AuditLog.entity == entity)
    if search:
        query = query.where(
            AuditLog.action.ilike(f"%{search}%") |
            AuditLog.entity.ilike(f"%{search}%") |
            AuditLog.new_value.ilike(f"%{search}%") |
            AuditLog.previous_value.ilike(f"%{search}%")
        )
    result = await db.execute(
        query.order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)
    )
    return result.scalars().all()
```

**Step 2: Add distinct action/entity list endpoints**

```python
@router.get("/actions")
async def list_audit_actions(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(AuditLog.action).where(AuditLog.organization_id == current_user.organization_id).distinct()
    )
    return [row[0] for row in result.all()]

@router.get("/entities")
async def list_audit_entities(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(AuditLog.entity).where(AuditLog.organization_id == current_user.organization_id).distinct()
    )
    return [row[0] for row in result.all()]
```

**Step 3: Commit**

```bash
git add backend/app/api/v1/audit.py
git commit -m "feat: add search/filter params and action/entity list endpoints to audit API"
```

---

### Task 2: Backend — Data export CSV endpoint

**Objective:** Create `GET /api/v1/export/{entity}` that returns CSV data for tenants, units, properties, leases, payments, or audit_logs.

**Files:**
- Create: `backend/app/api/v1/export.py`

**Step 1: Create export router**

```python
import csv
import io
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import (
    Tenant, Unit, Property, Lease, Payment, AuditLog,
    TenantStatus, UnitStatus, PropertyStatus, LeaseStatus, PaymentStatus
)
from app.core.security import get_current_user

router = APIRouter(redirect_slashes=False)

EXPORT_CONFIGS = {
    "tenants": {
        "model": Tenant,
        "columns": ["id", "first_name", "last_name", "email", "phone_number", "national_id", "status", "created_at"],
        "headers": ["ID", "First Name", "Last Name", "Email", "Phone", "National ID", "Status", "Created At"],
    },
    "units": {
        "model": Unit,
        "columns": ["id", "unit_code", "rent_amount", "status", "created_at"],
        "headers": ["ID", "Unit Code", "Rent Amount", "Status", "Created At"],
    },
    "properties": {
        "model": Property,
        "columns": ["id", "name", "location", "description", "status", "created_at"],
        "headers": ["ID", "Name", "Location", "Description", "Status", "Created At"],
    },
    "leases": {
        "model": Lease,
        "columns": ["id", "monthly_rent", "security_deposit", "start_date", "end_date", "status", "created_at"],
        "headers": ["ID", "Monthly Rent", "Security Deposit", "Start Date", "End Date", "Status", "Created At"],
    },
    "payments": {
        "model": Payment,
        "columns": ["id", "amount", "payment_method", "transaction_code", "payment_date", "status", "created_at"],
        "headers": ["ID", "Amount", "Method", "Transaction Code", "Payment Date", "Status", "Created At"],
    },
    "audit_logs": {
        "model": AuditLog,
        "columns": ["id", "action", "entity", "previous_value", "new_value", "ip_address", "created_at"],
        "headers": ["ID", "Action", "Entity", "Previous Value", "New Value", "IP Address", "Created At"],
    },
}


@router.get("/{entity}")
async def export_entity(
    entity: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if entity not in EXPORT_CONFIGS:
        return {"error": f"Unknown entity: {entity}. Valid: {list(EXPORT_CONFIGS.keys())}"}

    config = EXPORT_CONFIGS[entity]
    model = config["model"]

    # Filter by organization where applicable
    query = select(model)
    if hasattr(model, "organization_id"):
        query = query.where(model.organization_id == current_user.organization_id)
    # AuditLog uses organization_id directly
    if entity == "audit_logs":
        query = query.where(AuditLog.organization_id == current_user.organization_id)

    result = await db.execute(query.order_by(model.created_at.desc()) if hasattr(model, "created_at") else query)
    rows = result.scalars().all()

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(config["headers"])

    for row in rows:
        writer.writerow([str(getattr(row, col, "")) for col in config["columns"]])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={entity}_export.csv"},
    )
```

**Step 2: Register the router in main.py**

Add to `backend/app/main.py`:
```python
from app.api.v1 import export
app.include_router(export.router, prefix="/api/v1/export", tags=["export"])
```

**Step 3: Commit**

```bash
git add backend/app/api/v1/export.py backend/app/main.py
git commit -m "feat: add CSV export endpoint for all entity types"
```

---

### Task 3: Frontend — Wire audit_logs tab to real data

**Objective:** Replace the static audit tab in SaaSSettings with actual audit log data, search, and filters.

**Files:**
- Modify: `frontend/src/components/settings/SaaSSettings.tsx`

**Step 1: Add audit state and loading**

Add state variables after the existing ones:
```tsx
const [auditLogs, setAuditLogs] = useState<any[]>([]);
const [auditLoading, setAuditLoading] = useState(false);
const [auditSearch, setAuditSearch] = useState("");
const [auditActionFilter, setAuditActionFilter] = useState("");
const [auditEntityFilter, setAuditEntityFilter] = useState("");
const [auditActions, setAuditActions] = useState<string[]>([]);
const [auditEntities, setAuditEntities] = useState<string[]>([]);
```

**Step 2: Add loadAuditLogs function**

```tsx
const loadAuditLogs = async () => {
  setAuditLoading(true);
  try {
    const params = new URLSearchParams({ limit: "100" });
    if (auditSearch) params.set("search", auditSearch);
    if (auditActionFilter) params.set("action", auditActionFilter);
    if (auditEntityFilter) params.set("entity", auditEntityFilter);
    const { data } = await api.get(`/audit?${params.toString()}`);
    setAuditLogs(data);
  } catch (err) {
    console.error("Failed to load audit logs", err);
  } finally {
    setAuditLoading(false);
  }
};

const loadAuditFilters = async () => {
  try {
    const [actionsRes, entitiesRes] = await Promise.all([
      api.get("/audit/actions").catch(() => ({ data: [] })),
      api.get("/audit/entities").catch(() => ({ data: [] })),
    ]);
    setAuditActions(actionsRes.data);
    setAuditEntities(entitiesRes.data);
  } catch {}
};
```

**Step 3: Call loadAuditLogs when audit tab is active**

Add a useEffect or call in loadData:
```tsx
useEffect(() => {
  if (activeTab === "audit_logs") {
    loadAuditLogs();
    loadAuditFilters();
  }
}, [activeTab, auditSearch, auditActionFilter, auditEntityFilter]);
```

**Step 4: Replace the audit tab content**

Replace the static `{activeTab === "audit_logs" && (...)}` block with actual log rendering, search input, action/entity dropdown filters, and a table/list of logs. Follow the same pattern as the existing `AuditLogViewer` component.

**Step 5: Commit**

```bash
git add frontend/src/components/settings/SaaSSettings.tsx
git commit -m "feat: connect audit_logs tab to real data with search and filters"
```

---

### Task 4: Frontend — Wire data_export tab to real CSV downloads

**Objective:** Make the export button download actual CSV files from the backend.

**Files:**
- Modify: `frontend/src/components/settings/SaaSSettings.tsx`

**Step 1: Replace handleGenerateExport**

```tsx
const handleGenerateExport = async () => {
  const selectedEntities = Object.entries(exportEntities).filter(([_, v]) => v).map(([k]) => k);
  if (selectedEntities.length === 0) {
    showToast("Select at least one entity to export", "error");
    return;
  }

  for (const entity of selectedEntities) {
    try {
      const response = await api.get(`/export/${entity}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${entity}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showToast(`Failed to export ${entity}`, "error");
    }
  }
  showToast(`✓ Exported ${selectedEntities.length} file(s)`);
};
```

**Step 2: Update the format selector**

Since we're only supporting CSV for now, remove or disable the Excel/PDF options and add a note that CSV is currently available. Or keep the dropdown but only process CSV.

**Step 3: Commit**

```bash
git add frontend/src/components/settings/SaaSSettings.tsx
git commit -m "feat: connect data_export tab to backend CSV export endpoint"
```

---

### Task 5: Run tests and verify

**Objective:** Ensure all tests pass and the frontend builds.

**Step 1: Run backend tests**

```bash
cd backend && python -m pytest tests/ -v --tb=short
```
Expected: All passed

**Step 2: Run frontend type check and lint**

```bash
cd frontend && npx tsc --noEmit && npx next lint
```
Expected: No errors, warnings only

**Step 3: Commit any fixes**

---

## ⚠️ KEY NOTES

1. The audit_logs and data_export tabs are owner-only (already restricted from Task earlier)
2. CSV export uses StreamingResponse for memory efficiency
3. The export endpoint filters by organization_id so tenants only see their org's data
4. Search uses ILIKE for case-insensitive partial matching
5. Excel/PDF export can be added later — CSV is the MVP
