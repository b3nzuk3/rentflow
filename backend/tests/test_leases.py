import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.db.models import Lease, LeaseStatus


class TestLeases:
    """Test lease endpoints."""

    @pytest.mark.asyncio
    async def test_create_lease(self, authenticated_client: AsyncClient, test_db, test_org, test_unit, test_tenant):
        """Test creating a new lease."""
        data = {
            "tenant_id": str(test_tenant.id),
            "unit_id": str(test_unit.id),
            "monthly_rent": 45000,
            "security_deposit": 90000,
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
        }
        response = await authenticated_client.post("/api/v1/leases/", json=data)
        assert response.status_code == 200
        result = response.json()
        assert result["monthly_rent"] == 45000

    @pytest.mark.asyncio
    async def test_list_leases(self, authenticated_client: AsyncClient, test_lease):
        """Test listing leases."""
        response = await authenticated_client.get("/api/v1/leases/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_get_lease(self, authenticated_client: AsyncClient, test_lease):
        """Test getting a single lease by ID."""
        response = await authenticated_client.get(f"/api/v1/leases/{test_lease.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["monthly_rent"] == 50000

    @pytest.mark.asyncio
    async def test_update_lease(self, authenticated_client: AsyncClient, test_lease):
        """Test updating a lease."""
        data = {"monthly_rent": 55000}
        response = await authenticated_client.patch(f"/api/v1/leases/{test_lease.id}", json=data)
        assert response.status_code == 200
        result = response.json()
        assert result["monthly_rent"] == 55000

    @pytest.mark.asyncio
    async def test_sign_lease(self, authenticated_client: AsyncClient, test_db, test_org, test_unit, test_tenant):
        """Test signing a lease (changing status to Active)."""
        lease = Lease(
            id=str(uuid.uuid4()),
            organization_id=test_org.id,
            tenant_id=test_tenant.id,
            unit_id=test_unit.id,
            monthly_rent=45000,
            security_deposit=90000,
            start_date="2026-01-01",
            end_date="2026-12-31",
            status=LeaseStatus.DRAFT,
        )
        test_db.add(lease)
        await test_db.commit()

        response = await authenticated_client.patch(f"/api/v1/leases/{lease.id}/sign")
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "Active"
