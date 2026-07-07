# Tenant Settings — Change Password Implementation Plan

> **For implementer:** Use TDD where applicable. Commit after each task.

**Goal:** Add a settings page to the tenant dashboard where tenants can change their password.

**Architecture:** Backend endpoint `PATCH /api/v1/users/me/password` verifies current password, hashes new one, and updates the User record. Frontend adds a "Settings" tab to the tenant sidebar with a password change form.

**Tech Stack:** FastAPI, SQLAlchemy, bcrypt (passlib), React, Tailwind CSS

---

## ✅ COMPLETED TASKS

None yet — this is a fresh plan.

---

## 📋 TASKS

### Task 1: Add password change schema

**Objective:** Define request/response schemas for the password change endpoint.

**Files:**
- Create: `backend/app/schemas/users.py` (append to existing)

**Step 1: Add schema**

Add to `backend/app/schemas/users.py`:

```python
class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)
```

**Step 2: Commit**

```bash
git add backend/app/schemas/users.py
git commit -m "feat: add ChangePasswordRequest schema"
```

---

### Task 2: Add backend password change endpoint

**Objective:** Create `PATCH /api/v1/users/me/password` that verifies current password and updates to new one.

**Files:**
- Modify: `backend/app/api/v1/users.py`

**Step 1: Write failing test**

Add to `backend/tests/test_auth.py`:

```python
@pytest.mark.asyncio
async def test_change_password(self, authenticated_client, admin_user):
    response = await authenticated_client.patch("/api/v1/users/me/password", json={
        "current_password": "password123",
        "new_password": "newpassword456",
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Password updated successfully"

@pytest.mark.asyncio
async def test_change_password_wrong_current(self, authenticated_client, admin_user):
    response = await authenticated_client.patch("/api/v1/users/me/password", json={
        "current_password": "wrongpassword",
        "new_password": "newpassword456",
    })
    assert response.status_code == 400
```

**Step 2: Run test to verify failure**

Run: `cd backend && python -m pytest tests/test_auth.py::TestAuth::test_change_password -v`
Expected: FAIL — 404 or 405

**Step 3: Add endpoint to `users.py`**

```python
from app.schemas.users import ChangePasswordRequest

@router.patch("/me/password")
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = get_password_hash(data.new_password)
    await db.flush()
    await log_action(db, current_user.organization_id, current_user.id, "CHANGE_PASSWORD", "User", new_value="Password changed")
    return {"message": "Password updated successfully"}
```

**Step 4: Run test to verify pass**

Run: `cd backend && python -m pytest tests/test_auth.py::TestAuth::test_change_password tests/test_auth.py::TestAuth::test_change_password_wrong_current -v`
Expected: 2 passed

**Step 5: Commit**

```bash
git add backend/app/api/v1/users.py backend/tests/test_auth.py backend/app/schemas/users.py
git commit -m "feat: add PATCH /users/me/password endpoint with tests"
```

---

### Task 3: Add Settings tab to tenant sidebar

**Objective:** Add a "Settings" navigation item to the tenant sidebar.

**Files:**
- Modify: `frontend/src/components/layout/Sidebar.tsx`
- Modify: `frontend/src/types/index.ts` (if LandlordTab type needs updating)

**Step 1: Check current LandlordTab type**

Read `frontend/src/types/index.ts` and find the `LandlordTab` type.

**Step 2: Add "settings" to LandlordTab union**

If not already there, add `"settings"` to the `LandlordTab` type.

**Step 3: Add Settings button to tenant sidebar section**

In `Sidebar.tsx`, inside the `{currentRole === "tenant" && (...)}` block (around line 217), add:

```tsx
<button
  onClick={() => handleTabChange("settings")}
  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
    activeTab === "settings"
      ? "bg-primary text-white shadow-md shadow-primary/20"
      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
  }`}
>
  <Settings className="w-4.5 h-4.5 shrink-0" />
  <span>Settings</span>
</button>
```

**Step 4: Commit**

```bash
git add frontend/src/components/layout/Sidebar.tsx frontend/src/types/index.ts
git commit -m "feat: add Settings tab to tenant sidebar"
```

---

### Task 4: Create TenantSettings component

**Objective:** Build the settings page with password change form.

**Files:**
- Create: `frontend/src/components/settings/TenantSettings.tsx`

**Step 1: Create component**

```tsx
"use client";

import { useState } from "react";
import { Settings, Lock, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";

export function TenantSettings() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      await api.patch("/users/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <p className="text-xs font-bold font-mono tracking-widest text-primary uppercase mb-1">Tenant Portal</p>
        <h2 className="text-3xl font-extrabold text-on-surface tracking-tight">Settings</h2>
        <p className="text-sm text-on-surface-variant mt-1">Manage your account security.</p>
      </div>

      <div className="flat-card rounded-2xl p-6 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary"><Lock className="w-5 h-5" /></div>
          <div>
            <h3 className="text-base font-extrabold text-on-surface">Change Password</h3>
            <p className="text-xs text-on-surface-variant">Update your account password</p>
          </div>
        </div>

        {success && (
          <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl mb-5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-emerald-700">Password updated successfully!</p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl mb-5">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Current Password *</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-outline-variant bg-surface-container/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">New Password *</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-outline-variant bg-surface-container/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label className="block text-xs font-bold font-mono text-on-surface-variant uppercase tracking-wider mb-1.5">Confirm New Password *</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container/30 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary-hover transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Updating...</>
            ) : (
              "Update Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/settings/TenantSettings.tsx
git commit -m "feat: create TenantSettings component with password change form"
```

---

### Task 5: Wire TenantSettings into dashboard

**Objective:** Render TenantSettings when the tenant selects the Settings tab.

**Files:**
- Modify: `frontend/src/app/dashboard/page.tsx`

**Step 1: Import and render**

In `dashboard/page.tsx`, import TenantSettings and add a condition:

```tsx
import { TenantSettings } from "@/components/settings/TenantSettings";
```

In the tenant rendering section, add:

```tsx
{activeTab === "settings" && <TenantSettings />}
```

**Step 2: Commit**

```bash
git add frontend/src/app/dashboard/page.tsx
git commit -m "feat: wire TenantSettings into tenant dashboard"
```

---

### Task 6: Run all tests and verify

**Objective:** Ensure backend tests pass and frontend builds.

**Step 1: Run backend tests**

```bash
cd backend && python -m pytest tests/ -v --tb=short
```
Expected: All passed (including new test_change_password tests)

**Step 2: Run frontend lint**

```bash
cd frontend && npx next lint
```
Expected: Warnings only, exit 0

**Step 3: Run frontend build**

```bash
cd frontend && npm run build
```
Expected: Build succeeds

**Step 4: Commit any fixes**

---

### Task 7: Merge to master and deploy

**Objective:** Merge feature branch and deploy.

```bash
git checkout master
git merge feature/tenant-dashboard
git push origin master
```

---

## ⚠️ KEY NOTES

1. The tenant's User record is created via invitation with password `changeme123` — changing password on first login is important
2. `PATCH /users/me/password` uses the same auth as other user endpoints — no special permissions needed
3. Frontend validation (min 8 chars, confirm match) is client-side; backend also enforces min 8 via Pydantic
4. The `TenantSettings` component follows the same design patterns as `TenantDashboard` (flat-card, primary colors, etc.)
