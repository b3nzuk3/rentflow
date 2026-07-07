import pytest
from httpx import AsyncClient


class TestAuth:
    """Test authentication endpoints."""

    @pytest.mark.asyncio
    async def test_signup_success(self, authenticated_client: AsyncClient, test_db, test_org):
        """Test successful user signup."""
        signup_data = {
            "organization_id": str(test_org.id),
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "jane.doe@test.com",
            "phone_number": "+254****5566",
            "password": "securepass123",
        }

        response = await authenticated_client.post("/api/v1/auth/signup", json=signup_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        assert data["first_name"] == "Jane"
        assert data["last_name"] == "Doe"

    @pytest.mark.asyncio
    async def test_signup_duplicate_email(self, authenticated_client: AsyncClient, test_db, test_org, admin_user):
        """Test signup with duplicate email fails."""
        signup_data = {
            "organization_id": str(test_org.id),
            "first_name": "Duplicate",
            "last_name": "User",
            "email": "admin@test.com",  # Already exists
            "phone_number": "+254****9999",
            "password": "pass123",
        }
        response = await authenticated_client.post("/api/v1/auth/signup", json=signup_data)
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient, admin_user):
        """Test successful login."""
        login_data = {"email": "admin@test.com", "password": "password123"}
        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["role"] == "org_owner"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient, admin_user):
        """Test login with wrong password."""
        login_data = {"email": "admin@test.com", "password": "wrongpassword"}
        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with non-existent user."""
        login_data = {"email": "nobody@test.com", "password": "pass"}
        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_refresh_token(self, client: AsyncClient, admin_user):
        """Test refreshing access token."""
        # First login to get tokens
        login_data = {"email": "admin@test.com", "password": "password123"}
        login_resp = await client.post("/api/v1/auth/login", json=login_data)
        tokens = login_resp.json()

        # Refresh
        refresh_data = {"refresh_token": tokens["refresh_token"]}
        response = await client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    @pytest.mark.asyncio
    async def test_refresh_invalid_token(self, client: AsyncClient):
        """Test refresh with invalid token."""
        refresh_data = {"refresh_token": "invalid.token.here"}
        response = await client.post("/api/v1/auth/refresh", json=refresh_data)
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me(self, authenticated_client: AsyncClient, admin_user):
        """Test getting current user profile via /users/me."""
        response = await authenticated_client.get("/api/v1/users/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "admin@test.com"

    @pytest.mark.asyncio
    async def test_get_me_no_token(self, client: AsyncClient):
        """Test getting profile without token."""
        response = await client.get("/api/v1/users/me")
        assert response.status_code in [401, 403]

    @pytest.mark.asyncio
    async def test_change_password(self, authenticated_client: AsyncClient, admin_user):
        """Test successful password change."""
        response = await authenticated_client.patch("/api/v1/users/me/password", json={
            "current_password": "password123",
            "new_password": "newpassword456",
        })
        assert response.status_code == 200
        assert response.json()["message"] == "Password updated successfully"

    @pytest.mark.asyncio
    async def test_change_password_wrong_current(self, authenticated_client: AsyncClient, admin_user):
        """Test password change with wrong current password."""
        response = await authenticated_client.patch("/api/v1/users/me/password", json={
            "current_password": "wrongpassword",
            "new_password": "newpassword456",
        })
        assert response.status_code == 400
