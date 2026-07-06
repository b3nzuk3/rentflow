# Users & Core Roles — Settings Page Implementation

> **Date:** 2026-07-05
> **Goal:** Make the "Users & Core Roles" tab functional — fetch real users, invite new ones, suspend/activate, remove mockup data.

---

## Context

The Settings page `SaaSSettings.tsx` has a "Users & Core Roles" tab (lines 367-432) that currently shows hardcoded mockup users. The backend already has all needed APIs:

- `GET /api/v1/users/` — list org users
- `POST /api/v1/users/invite` — invite user (creates with `is_active=False` until activation)
- `PATCH /api/v1/users/{user_id}/toggle` — toggle active status

Frontend types already define `User` interface with all needed fields.

---

## Tasks

### Task 1: Fetch real users from API
- Replace hardcoded user array with state loaded from `GET /users/`
- Add `users` state and `loadUsers()` function
- Show loading spinner while fetching
- Show empty state when no users

### Task 2: Add Invite User modal
- Create modal/drawer with form: first_name, last_name, email, phone_number, role dropdown
- Roles: property_manager, accountant, caretaker (org_owner not inviteable)
- Call `POST /users/invite` on submit
- Refresh user list after successful invite
- Show toast on success/error

### Task 3: Wire up Suspend/Activate buttons
- Call `PATCH /users/{user_id}/toggle` on click
- Refresh user list after toggle
- Disable for org_owner (already shows "No suspended override")

### Task 4: Show user's last login / status
- Display actual `created_at` and `is_active` from API
- Show real property count or "—" for users without assigned properties

---

## Files to modify

- `frontend/src/components/settings/SaaSSettings.tsx` — the main file (all changes here)

## Verification

1. Start backend: `cd backend && source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000`
2. Start frontend: `cd frontend && npm run dev`
3. Login as org_owner
4. Navigate to Settings → Users & Core Roles
5. Verify: real users display, invite modal works, suspend/activate works
