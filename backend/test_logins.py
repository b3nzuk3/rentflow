"""Quick login test for the seeded RentFlow demo accounts."""
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


async def test_logins():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Test 1: Super Admin login
        print("=" * 60)
        print("TEST 1: Super Admin Login")
        print("=" * 60)
        resp = await client.post("/api/v1/auth/login", json={
            "email": "superadmin@rentflow.io",
            "password": "R3ntFl0w!@#4dm1n"
        })
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"  access_token : {data['access_token'][:40]}...")
            print(f"  user_id      : {data['user_id']}")
            print(f"  role         : {data['role']}")
            print(f"  first_name   : {data['first_name']}")
            print(f"  last_name    : {data['last_name']}")
            print(f"  org_id       : {data['organization_id']}")
            print("  ✅ SUPER_ADMIN login SUCCESS")
        else:
            print(f"  ❌ FAILED: {resp.text}")

        # Test 2: Org Owner login
        print()
        print("=" * 60)
        print("TEST 2: Org Owner Login")
        print("=" * 60)
        resp = await client.post("/api/v1/auth/login", json={
            "email": "owner@rentflow.io",
            "password": "R3ntFl0w!@#0wn3r"
        })
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"  access_token : {data['access_token'][:40]}...")
            print(f"  user_id      : {data['user_id']}")
            print(f"  role         : {data['role']}")
            print(f"  first_name   : {data['first_name']}")
            print(f"  last_name    : {data['last_name']}")
            print(f"  org_id       : {data['organization_id']}")
            print("  ✅ ORG_OWNER login SUCCESS")
        else:
            print(f"  ❌ FAILED: {resp.text}")

        # Test 3: Wrong password should fail
        print()
        print("=" * 60)
        print("TEST 3: Wrong Password (should fail)")
        print("=" * 60)
        resp = await client.post("/api/v1/auth/login", json={
            "email": "superadmin@rentflow.io",
            "password": "wrongpassword"
        })
        print(f"Status: {resp.status_code}")
        if resp.status_code == 401:
            print("  ✅ Correctly rejected wrong password")
        else:
            print(f"  ❌ Unexpected: {resp.text}")


if __name__ == "__main__":
    asyncio.run(test_logins())
