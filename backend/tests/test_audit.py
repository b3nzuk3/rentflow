import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from app.db.models import AuditLog

TEST_DATABASE_URL = "postgresql+asyncpg://rentflow:rentflow@localhost:5432/rentflow_test"


class TestAudit:
    """Test audit log endpoints."""

    @pytest.mark.asyncio
    async def test_list_audit_logs(self, authenticated_client: AsyncClient, test_db, test_org):
        """Test listing audit logs."""
        log = AuditLog(
            id=str(uuid.uuid4()),
            organization_id=test_org.id,
            action="create",
            entity="property",
            new_value='{"name": "Test"}',
            ip_address="127.0.0.1",
        )
        test_db.add(log)
        await test_db.commit()

        response = await authenticated_client.get("/api/v1/audit/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_audit_logs_after_mutations(self, authenticated_client: AsyncClient, test_org):
        """Test that mutations create audit log entries."""
        # Use a separate session to avoid event loop conflicts with the app's sessions
        engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
        session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with session_factory() as db:
            result = await db.execute(
                select(AuditLog).where(AuditLog.organization_id == test_org.id)
            )
            initial_count = len(result.scalars().all())

        data = {
            "name": "Audit Test Property",
            "location": "Nairobi",
            "description": "For audit testing",
            "status": "Active",
        }
        await authenticated_client.post("/api/v1/properties/", json=data)

        async with session_factory() as db:
            result = await db.execute(
                select(AuditLog).where(AuditLog.organization_id == test_org.id)
            )
            final_count = len(result.scalars().all())
        await engine.dispose()
        assert final_count > initial_count
