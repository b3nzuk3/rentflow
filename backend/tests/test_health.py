import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    """Test the health check endpoint returns 200 and expected payload."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "app" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_health_check_content(client):
    """Test health check returns correct app name and version."""
    response = await client.get("/api/health")
    data = response.json()
    assert data["app"] == "RentFlow"
    assert data["version"] == "1.0.0"
