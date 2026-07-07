import uuid
import pytest
from httpx import AsyncClient
from app.db.models import Property, PropertyStatus


class TestProperties:
    """Test property endpoints."""

    @pytest.mark.asyncio
    async def test_create_property(self, authenticated_client: AsyncClient, test_db, test_org):
        """Test creating a new property."""
        data = {
            "name": "New Property",
            "location": "Mombasa, Kenya",
            "description": "Beach house",
            "status": "Active",
        }
        response = await authenticated_client.post("/api/v1/properties/", json=data)
        assert response.status_code == 200
        result = response.json()
        assert result["name"] == "New Property"
        assert result["location"] == "Mombasa, Kenya"

    @pytest.mark.asyncio
    async def test_list_properties(self, authenticated_client: AsyncClient, test_property):
        """Test listing properties."""
        response = await authenticated_client.get("/api/v1/properties/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_get_property(self, authenticated_client: AsyncClient, test_property):
        """Test getting a single property by ID."""
        response = await authenticated_client.get(f"/api/v1/properties/{test_property.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Property"

    @pytest.mark.asyncio
    async def test_update_property(self, authenticated_client: AsyncClient, test_property):
        """Test updating a property."""
        data = {"name": "Updated Property", "location": "Kisumu, Kenya"}
        response = await authenticated_client.patch(f"/api/v1/properties/{test_property.id}", json=data)
        assert response.status_code == 200
        result = response.json()
        assert result["name"] == "Updated Property"

    @pytest.mark.asyncio
    async def test_delete_property(self, authenticated_client: AsyncClient, test_db, test_org):
        """Test deleting a property."""
        prop = Property(
            id=str(uuid.uuid4()),
            organization_id=test_org.id,
            name="To Delete",
            location="Nairobi",
            status=PropertyStatus.ACTIVE,
        )
        test_db.add(prop)
        await test_db.commit()

        response = await authenticated_client.delete(f"/api/v1/properties/{prop.id}")
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_filter_by_status(self, authenticated_client: AsyncClient, test_property):
        """Test filtering properties by status."""
        response = await authenticated_client.get("/api/v1/properties/?status=Active")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
