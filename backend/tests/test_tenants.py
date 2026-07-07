import pytest
from httpx import AsyncClient


class TestTenants:
    """Test tenant endpoints."""

    @pytest.mark.asyncio
    async def test_create_tenant(self, authenticated_client: AsyncClient, test_db, test_org):
        """Test creating a new tenant."""
        data = {
            "first_name": "Alice",
            "last_name": "Wanjiku",
            "phone_number": "+254****5566",
            "email": "alice@test.com",
        }
        response = await authenticated_client.post("/api/v1/tenants/", json=data)
        assert response.status_code == 200
        result = response.json()
        assert result["first_name"] == "Alice"
        assert result["email"] == "alice@test.com"

    @pytest.mark.asyncio
    async def test_list_tenants(self, authenticated_client: AsyncClient, test_tenant):
        """Test listing tenants."""
        response = await authenticated_client.get("/api/v1/tenants/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_get_tenant(self, authenticated_client: AsyncClient, test_tenant):
        """Test getting a single tenant by ID."""
        response = await authenticated_client.get(f"/api/v1/tenants/{test_tenant.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "John"
        assert data["email"] == "john.doe@test.com"

    @pytest.mark.asyncio
    async def test_update_tenant(self, authenticated_client: AsyncClient, test_tenant):
        """Test updating a tenant."""
        data = {"first_name": "Jonathan"}
        response = await authenticated_client.patch(f"/api/v1/tenants/{test_tenant.id}", json=data)
        assert response.status_code == 200
        result = response.json()
        assert result["first_name"] == "Jonathan"
