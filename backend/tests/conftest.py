import os
import uuid
import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text
from sqlalchemy.pool import NullPool

# Set test database URL before importing app
os.environ["DATABASE_URL"] = "postgresql+asyncpg://rentflow:rentflow@localhost:5432/rentflow_test"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "30"
os.environ["REFRESH_TOKEN_EXPIRE_DAYS"] = "7"
os.environ["CORS_ORIGINS"] = '["http://localhost:3000"]'
os.environ["DEBUG"] = "true"
os.environ["TESTING"] = "true"

from app.main import app
from app.db.database import Base
from app.db.models import (
    Organization, User, Property, Block, Unit,
    Tenant, Lease, UserRole, PropertyStatus, UnitStatus, TenantStatus,
    LeaseStatus
)
from app.core.security import get_password_hash, create_access_token


TEST_DATABASE_URL = "postgresql+asyncpg://rentflow:rentflow@localhost:5432/rentflow_test"

# All tables in order (respecting FKs)
ALL_TABLES = [
    "notifications", "audit_logs", "rent_schedules", "payments",
    "leases", "invitations", "tenants", "units", "blocks",
    "properties", "users", "organizations",
]


@pytest.fixture(scope="session")
def event_loop():
    """Create a session-scoped event loop for all async tests."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_database():
    """Create and drop test database tables for the test session."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(autouse=True)
async def clean_db():
    """Clean all tables before each test to prevent data leakage."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    async with engine.begin() as conn:
        for table in ALL_TABLES:
            await conn.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
    await engine.dispose()
    yield


@pytest_asyncio.fixture
async def client():
    """Async HTTP client fixture for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest_asyncio.fixture
async def test_db():
    """Provide a database session for test setup."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session
    await engine.dispose()


@pytest_asyncio.fixture
async def test_org(test_db):
    """Create a test organization."""
    org = Organization(
        id=uuid.uuid4(),
        name="Test Organization",
        subscription_plan="Starter",
        is_active=True,
        email="test@org.com",
        phone="+254****0000",
    )
    test_db.add(org)
    await test_db.commit()
    return org


@pytest_asyncio.fixture
async def admin_user(test_db, test_org):
    """Create an admin user."""
    user = User(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        first_name="Admin",
        last_name="User",
        email="admin@test.com",
        phone_number="+254****0001",
        password_hash=get_password_hash("password123"),
        role=UserRole.ORG_OWNER,
        is_active=True,
    )
    test_db.add(user)
    await test_db.commit()
    return user


@pytest_asyncio.fixture
async def auth_token(admin_user):
    """Create a valid JWT access token for the admin user."""
    token_data = {
        "sub": str(admin_user.id),
        "role": admin_user.role.value,
        "org_id": str(admin_user.organization_id),
    }
    return create_access_token(token_data)


@pytest_asyncio.fixture
async def authenticated_client(client, auth_token):
    """Async HTTP client with Authorization header set."""
    client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return client


@pytest_asyncio.fixture
async def test_property(test_db, test_org):
    """Create a test property."""
    prop = Property(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        name="Test Property",
        location="Nairobi, Kenya",
        description="A test property",
        status=PropertyStatus.ACTIVE,
    )
    test_db.add(prop)
    await test_db.commit()
    return prop


@pytest_asyncio.fixture
async def test_block(test_db, test_property):
    """Create a test block."""
    block = Block(
        id=uuid.uuid4(),
        property_id=test_property.id,
        name="Block A",
    )
    test_db.add(block)
    await test_db.commit()
    return block


@pytest_asyncio.fixture
async def test_unit(test_db, test_org, test_property, test_block):
    """Create a test unit."""
    unit = Unit(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        property_id=test_property.id,
        block_id=test_block.id,
        unit_code="A-101",
        rent_amount=50000,
        status=UnitStatus.VACANT,
    )
    test_db.add(unit)
    await test_db.commit()
    return unit


@pytest_asyncio.fixture
async def test_tenant(test_db, test_org):
    """Create a test tenant."""
    tenant = Tenant(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        first_name="John",
        last_name="Doe",
        phone_number="+254****3344",
        email="john.doe@test.com",
        national_id="12345678",
        status=TenantStatus.ACTIVE,
    )
    test_db.add(tenant)
    await test_db.commit()
    return tenant


@pytest_asyncio.fixture
async def test_lease(test_db, test_org, test_unit, test_tenant):
    """Create a test lease."""
    lease = Lease(
        id=uuid.uuid4(),
        organization_id=test_org.id,
        tenant_id=test_tenant.id,
        unit_id=test_unit.id,
        monthly_rent=50000,
        security_deposit=100000,
        start_date="2024-01-01",
        end_date="2024-12-31",
        status=LeaseStatus.ACTIVE,
    )
    test_db.add(lease)
    await test_db.commit()
    return lease
