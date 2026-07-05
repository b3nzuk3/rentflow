import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.db.models import Organization


class TestOrganizations:
    """Test organization endpoints."""

    @pytest.mark.asyncio
    async def test_get_organization(self, authenticated_client: AsyncClient, test_org):
        """Test getting a single organization by ID."""
        response = await authenticated_client.get(f"/api/v1/organizations/{test_org.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Organization"

    @pytest.mark.asyncio
    async def test_update_organization(self, authenticated_client: AsyncClient, test_org):
        """Test updating an organization."""
        data = {"name": "Updated Organization"}
        response = await authenticated_client.patch(f"/api/v1/organizations/{test_org.id}", json=data)
        assert response.status_code == 200
        result = response.json()
        assert result["name"] == "Updated Organization"

    @pytest.mark.asyncio
    async def test_get_organization_me(self, authenticated_client: AsyncClient, test_org):
        """Test getting current user's organization."""
        response = await authenticated_client.get("/api/v1/organizations/me")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Organization"

    @pytest.mark.asyncio
    async def test_get_organization_not_found(self, authenticated_client: AsyncClient):
        """Test getting non-existent organization."""
        fake_id = str(uuid.uuid4())
        response = await authenticated_client.get(f"/api/v1/organizations/{fake_id}")
        assert response.status_code == 404
