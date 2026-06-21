# Real Auth Integration Implementation Plan

**Goal:** Replace mock frontend auth with real backend JWT authentication, remove demo account buttons, seed new users (superadmin@rentflow.io, owner@rentflow.io) with org "RentFlow Demo Properties".

**Architecture:** Frontend login form POSTs to backend `/api/v1/auth/login`, receives JWT tokens, stores access token in localStorage, sends it as Bearer header on subsequent API calls. Logout clears tokens.

**Tech Stack:** FastAPI JWT (existing), Vite+React fetch API (new), localStorage for token persistence.

---

## Task 1: Update backend seed data

**Files:**
- Modify: `backend/seed.py`

**Step 1: Replace seed data**

Replace the entire seed to create:
- Organization: "RentFlow Demo Properties" (id: `org-rentflow-demo`)
- Super Admin: `superadmin@rentflow.io` / password `R3ntFl0w!@#4dm1n` / role `SUPER_ADMIN`
- Org Owner: `owner@rentflow.io` / password `R3ntFl0w!@#0wn3r` / role `ORG_OWNER`
- Both users belong to the same org
- Keep demo data: 3 properties, 4 blocks, 10 units, 5 tenants, 3 leases, 4 payments

**Step 2: Delete old DB and re-seed**

```bash
cd backend && rm -f rentflow.db && source .venv/bin/activate && python seed.py
```

Expected: "Database seeded successfully with UUIDs!"

**Step 3: Verify login works**

```bash
curl -s -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"superadmin@rentflow.io","password":"R3ntFl0w!@#4dm1n"}'
```

Expected: JSON with `access_token`, `refresh_token`, `role: "super_admin"`

**Step 4: Commit**

```bash
git add backend/seed.py && git commit -m "feat(auth): re-seed with real accounts - superadmin@rentflow.io and owner@rentflow.io"
```

---

## Task 2: Create frontend API client

**Files:**
- Create: `src/lib/api.ts`

**Step 1: Write the API client**

Create a thin API wrapper that:
- Points to `http://localhost:8000/api/v1`
- Has `login(email, password)` → POST `/auth/login`, returns `{ access_token, refresh_token, user_id, role, first_name, last_name, organization_id }`
- Has `refreshToken(refresh_token)` → POST `/auth/refresh`
- Stores access_token in localStorage as `rf_token`
- Clears token on logout
- Exports `getToken()` helper

**Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 3: Commit**

```bash
git add src/lib/api.ts && git commit -m "feat(auth): add API client for backend auth"
```

---

## Task 3: Update Login component for real auth

**Files:**
- Modify: `src/components/Login.tsx`

**Step 1: Remove demo accounts section**

Remove the entire "SANDBOX EVALUATION DEMO ACCOUNTS" section (the `demoProfiles` array, `handleDemoLogin` function, and the JSX grid of demo buttons at the bottom of the login form).

**Step 2: Wire login form to backend**

Replace the existing `handleLoginSubmit` to:
1. POST to `http://localhost:8000/api/v1/auth/login` with `{ email, password }`
2. On success: store `access_token` in localStorage as `rf_token`, call `onLoginSuccess` with a User object built from the response
3. On failure: show error message

**Step 3: Update LoginProps**

Add `onLoginSuccess: (user: AppUser, token: string) => void` — the parent needs the token.

**Step 4: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 5: Commit**

```bash
git add src/components/Login.tsx && git commit -m "feat(auth): wire login form to backend API, remove demo accounts"
```

---

## Task 4: Update App.tsx for token-based auth

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add auth state**

Add state for `token: string | null` initialized from `localStorage.getItem('rf_token')`.

**Step 2: Update isLoggedIn logic**

`isLoggedIn` should be `true` when `token` is present (instead of checking localStorage directly for `rf_is_logged_in`).

**Step 3: Update handleLoginSuccess**

When login succeeds, store the token in state and localStorage, build the User object from the API response.

**Step 4: Add logout handler**

Clear token from state and localStorage, reset to login view.

**Step 5: Pass onLogout to Header**

The Header already has an `onLogout` prop — just wire it up.

**Step 6: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

**Step 7: Commit**

```bash
git add src/App.tsx && git commit -m "feat(auth): wire App.tsx to use JWT token auth"
```

---

## Task 5: End-to-end test

**Step 1: Start backend**

```bash
cd backend && source .venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Step 2: Start frontend**

```bash
cd /root/projects/saas-projects/rentflow && npx vite --port=3000 --host=0.0.0.0
```

**Step 3: Test Super Admin login**

Navigate to `http://localhost:3000`, enter:
- Email: `superadmin@rentflow.io`
- Password: `R3ntFl0w!@#4dm1n`

Expected: Login succeeds, redirected to SuperAdmin dashboard.

**Step 4: Test Org Owner login**

Logout, then enter:
- Email: `owner@rentflow.io`
- Password: `R3ntFl0w!@#0wn3r`

Expected: Login succeeds, redirected to Landlord dashboard.

**Step 5: Test invalid credentials**

Enter wrong password.

Expected: Error message displayed, no redirect.

**Step 6: Commit**

```bash
git add -A && git commit -m "test(auth): verify end-to-end login for both accounts"
```
