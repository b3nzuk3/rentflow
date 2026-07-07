import pytest
from httpx import AsyncClient


class TestUnits:
    """Test unit endpoints."""

    @pytest.mark.asyncio
    async def test_create_unit(self, authenticated_client: AsyncClient, test_db, test_org, test_property, test_block):
        """Test creating a new unit."""
        data = {
            "organization_id": str(test_org.id),
            "property_id": str(test_property.id),
            "block_id": str(test_block.id),
            "unit_code": "B-201",
            "rent_amount": 45000,
            "status": "Vacant",
        }
        response = await authenticated_client.post("/api/v1/units/", json=data)
        assert response.status_code == 200
        result = response.json()
        assert result["unit_code"] == "B-201"
        assert result["rent_amount"] == 45000

    @pytest.mark.asyncio
    async def test_list_units(self, authenticated_client: AsyncClient, test_unit):
        """Test listing units."""
        response = await authenticated_client.get("/api/v1/units/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_get_unit(self, authenticated_client: AsyncClient, test_unit):
        """Test getting a single unit by ID."""
        response = await authenticated_client.get(f"/api/v1/units/{test_unit.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["unit_code"] == "A-101"

    @pytest.mark.asyncio
    async def test_update_unit(self, authenticated_client: AsyncClient, test_unit):
        """Test updating a unit."""
        data = {"rent_amount": 55000}
        response = await authenticated_client.patch(f"/api/v1/units/{test_unit.id}", json=data)
        assert response.status_code == 200
        result = response.json()
        assert result["rent_amount"] == 55000

    @pytest.mark.asyncio
    async def test_update_unit_status(self, authenticated_client: AsyncClient, test_unit):
        """Test updating unit status via PATCH."""
        data = {"status": "Occupied"}
        response = await authenticated_client.patch(f"/api/v1/units/{test_unit.id}/status", json=data)
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "Occupied"
