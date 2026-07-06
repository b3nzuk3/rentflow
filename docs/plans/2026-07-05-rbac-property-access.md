# Role-Based Access Control + Property Assignment

> **Date:** 2026-07-05
> **Goal:** Limit each role's page access and data visibility. Invite modal lets owner assign properties. Users only see data for their assigned properties.

---

## Architecture

1. **New table `user_properties`** — many-to-many between users and properties
2. **Backend**: Filter all data queries by user's assigned properties (org_owner sees everything)
3. **Frontend sidebar**: Restrict visible nav items by role
4. **Invite modal**: Multi-property selector

---

## Role Access Matrix

| Tab | org_owner | property_manager | accountant | caretaker |
|-----|-----------|-----------------|------------|-----------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Properties | ✅ (all) | ✅ (assigned) | ❌ | ✅ (assigned) |
| Leases | ✅ | ✅ (assigned) | ✅ (assigned) | ❌ |
| Payments | ✅ | ✅ (assigned) | ✅ (assigned) | ✅ (assigned) |
| Reports | ✅ | ✅ (assigned) | ✅ (assigned) | ❌ |
| Notifications | ✅ | ✅ | ✅ | ✅ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ |
| Settings | ✅ (all tabs) | ❌ | ❌ | ❌ |

---

## Tasks

### Task 1: Backend — user_properties model + Alembic migration
- Add `UserProperty` model to `backend/app/db/models.py`
- Create Alembic migration
- Add relationship to User model

### Task 2: Backend — Update invite endpoint
- Accept `property_ids: list[str]` in UserInvite schema
- Create UserProperty records on invite

### Task 3: Backend — Add property filtering helper
- Create `get_user_property_ids()` helper in security.py
- For org_owner: return None (no filter)
- For others: return list of assigned property IDs

### Task 4: Backend — Filter data queries
- Update properties.py, units.py, leases.py, payments.py, reports.py
- Apply property filtering for non-owner roles

### Task 5: Frontend — Update invite modal
- Fetch properties list
- Add multi-select property picker
- Send property_ids on invite

### Task 6: Frontend — Restrict sidebar by role
- Filter landlordNavItems based on role
- Hide Settings for non-owners, hide Audit Logs for non-owners, etc.

### Task 7: Frontend — Show assigned properties in user table
- Display which properties each user manages
