"""Seed database with demo data matching the prototype's mock data."""
import asyncio
import uuid

from app.db.database import async_session, engine
from app.db.database import Base
from app.db.models import (
    Organization, User, Property, Block, Unit, Tenant, Lease, Payment,
    UserRole, SubscriptionPlan, PropertyStatus, UnitStatus, TenantStatus,
    LeaseStatus, PaymentStatus, PaymentMethod
)
from app.core.security import get_password_hash


async def seed():
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        # Check if already seeded
        from sqlalchemy import select, func
        result = await session.execute(select(func.count(Organization.id)))
        if result.scalar() > 0:
            print("Database already seeded. Skipping.")
            return

        # Use proper UUIDs for all IDs
        org_id = str(uuid.uuid4())
        org = Organization(
            id=org_id,
            name="Amani Property Group Ltd",
            subscription_plan=SubscriptionPlan.GROWTH,
            is_active=True,
        )
        session.add(org)

        # Users with UUIDs
        user_ids = {role: str(uuid.uuid4()) for role in ["owner", "manager", "accountant", "caretaker", "tenant", "superadmin"]}
        users = [
            User(id=user_ids["owner"], organization_id=org_id, first_name="Fatuma", last_name="Ali", phone_number="+254 712 345 678", email="fatuma.ali@amani.com", password_hash=get_password_hash("password123"), role=UserRole.ORG_OWNER, is_active=True),
            User(id=user_ids["manager"], organization_id=org_id, first_name="Mwangi", last_name="Karanja", phone_number="+254 722 987 654", email="mwangi.k@amani.com", password_hash=get_password_hash("password123"), role=UserRole.PROPERTY_MANAGER, is_active=True),
            User(id=user_ids["accountant"], organization_id=org_id, first_name="Grace", last_name="Kendi", phone_number="+254 733 456 789", email="grace.kendi@amani.com", password_hash=get_password_hash("password123"), role=UserRole.ACCOUNTANT, is_active=True),
            User(id=user_ids["caretaker"], organization_id=org_id, first_name="Josphat", last_name="Njoroge", phone_number="+254 701 555 123", email="j.njoroge@amani.com", password_hash=get_password_hash("password123"), role=UserRole.CARETAKER, is_active=True),
            User(id=user_ids["tenant"], organization_id=org_id, first_name="Jane", last_name="Doe", phone_number="+254 725 333 444", email="jane.doe@gmail.com", password_hash=get_password_hash("password123"), role=UserRole.TENANT, is_active=True),
            User(id=user_ids["superadmin"], organization_id=org_id, first_name="System", last_name="Administrator", phone_number="+254 000 000000", email="admin@rentflow.co", password_hash=get_password_hash("password123"), role=UserRole.SUPER_ADMIN, is_active=True),
        ]
        for u in users:
            session.add(u)

        # Properties with UUIDs
        prop_ids = [str(uuid.uuid4()) for _ in range(3)]
        props = [
            Property(id=prop_ids[0], organization_id=org_id, name="Greenwood Apartments", location="Nairobi, Westlands", description="Premium model duplex complex.", status=PropertyStatus.ACTIVE),
            Property(id=prop_ids[1], organization_id=org_id, name="Kilimani Heights", location="Nairobi, Kilimani", description="Multi-family residential complex.", status=PropertyStatus.ACTIVE),
            Property(id=prop_ids[2], organization_id=org_id, name="Karen Palms Retreat", location="Nairobi, Karen", description="Boutique high-security townhouse community.", status=PropertyStatus.ACTIVE),
        ]
        for p in props:
            session.add(p)

        # Blocks with UUIDs
        block_ids = [str(uuid.uuid4()) for _ in range(4)]
        blocks = [
            Block(id=block_ids[0], property_id=prop_ids[0], name="Block A"),
            Block(id=block_ids[1], property_id=prop_ids[0], name="Block B"),
            Block(id=block_ids[2], property_id=prop_ids[1], name="East Wing"),
            Block(id=block_ids[3], property_id=prop_ids[1], name="West Wing"),
        ]
        for b in blocks:
            session.add(b)

        # Units with UUIDs
        unit_ids = [str(uuid.uuid4()) for _ in range(10)]
        units = [
            Unit(id=unit_ids[0], organization_id=org_id, property_id=prop_ids[0], block_id=block_ids[1], unit_code="Unit B12", rent_amount=35000, status=UnitStatus.OCCUPIED),
            Unit(id=unit_ids[1], organization_id=org_id, property_id=prop_ids[0], block_id=block_ids[1], unit_code="Unit B13", rent_amount=35000, status=UnitStatus.VACANT),
            Unit(id=unit_ids[2], organization_id=org_id, property_id=prop_ids[0], block_id=block_ids[0], unit_code="Unit A03", rent_amount=22000, status=UnitStatus.OCCUPIED),
            Unit(id=unit_ids[3], organization_id=org_id, property_id=prop_ids[0], block_id=block_ids[0], unit_code="Unit A05", rent_amount=45000, status=UnitStatus.RESERVED),
            Unit(id=unit_ids[4], organization_id=org_id, property_id=prop_ids[0], block_id=block_ids[1], unit_code="Unit B20", rent_amount=36000, status=UnitStatus.UNDER_MAINTENANCE),
            Unit(id=unit_ids[5], organization_id=org_id, property_id=prop_ids[1], block_id=block_ids[2], unit_code="Unit 101", rent_amount=65000, status=UnitStatus.OCCUPIED),
            Unit(id=unit_ids[6], organization_id=org_id, property_id=prop_ids[1], block_id=block_ids[3], unit_code="Unit 102", rent_amount=48000, status=UnitStatus.OCCUPIED),
            Unit(id=unit_ids[7], organization_id=org_id, property_id=prop_ids[1], block_id=block_ids[3], unit_code="Unit 103", rent_amount=48000, status=UnitStatus.VACANT),
            Unit(id=unit_ids[8], organization_id=org_id, property_id=prop_ids[2], block_id=None, unit_code="Villa 01", rent_amount=120000, status=UnitStatus.OCCUPIED),
            Unit(id=unit_ids[9], organization_id=org_id, property_id=prop_ids[2], block_id=None, unit_code="Villa 02", rent_amount=125000, status=UnitStatus.NOTICE_GIVEN),
        ]
        for u in units:
            session.add(u)

        # Tenants with UUIDs
        tenant_ids = [str(uuid.uuid4()) for _ in range(5)]
        tenants = [
            Tenant(id=tenant_ids[0], organization_id=org_id, first_name="Jane", last_name="Doe", phone_number="+254 725 333 444", email="jane.doe@gmail.com", national_id="30521456", status=TenantStatus.ACTIVE),
            Tenant(id=tenant_ids[1], organization_id=org_id, first_name="John", last_name="Kamau", phone_number="+254 712 111 222", email="j.kamau@gmail.com", national_id="24509121", status=TenantStatus.ACTIVE),
            Tenant(id=tenant_ids[2], organization_id=org_id, first_name="Sarah", last_name="Wanjiku", phone_number="+254 733 999 000", email="s.wanjiku@yahoo.com", national_id="28456102", status=TenantStatus.ACTIVE),
            Tenant(id=tenant_ids[3], organization_id=org_id, first_name="Amos", last_name="Kizito", phone_number="+254 710 444 555", email="amos.kizito@outlook.com", national_id="31890241", status=TenantStatus.INVITED),
            Tenant(id=tenant_ids[4], organization_id=org_id, first_name="Faith", last_name="Moraa", phone_number="+254 721 222 333", email="f.moraa@gmail.com", national_id="29451121", status=TenantStatus.NOTICE_GIVEN),
        ]
        for t in tenants:
            session.add(t)

        # Leases with UUIDs
        lease_ids = [str(uuid.uuid4()) for _ in range(3)]
        leases = [
            Lease(id=lease_ids[0], organization_id=org_id, tenant_id=tenant_ids[0], unit_id=unit_ids[0], monthly_rent=35000, security_deposit=35000, start_date="2024-01-01", end_date="2024-12-31", status=LeaseStatus.ACTIVE),
            Lease(id=lease_ids[1], organization_id=org_id, tenant_id=tenant_ids[1], unit_id=unit_ids[2], monthly_rent=22000, security_deposit=22000, start_date="2024-02-15", end_date="2025-02-14", status=LeaseStatus.ACTIVE),
            Lease(id=lease_ids[2], organization_id=org_id, tenant_id=tenant_ids[2], unit_id=unit_ids[3], monthly_rent=45000, security_deposit=45000, start_date="2024-06-01", end_date="2025-05-31", status=LeaseStatus.ACTIVE),
        ]
        for l in leases:
            session.add(l)

        # Payments with UUIDs
        payment_ids = [str(uuid.uuid4()) for _ in range(4)]
        payments = [
            Payment(id=payment_ids[0], organization_id=org_id, lease_id=lease_ids[0], amount=35000, payment_method=PaymentMethod.MPESA_PAYBILL, transaction_code="RG812M12P", payment_date="2026-06-01", submitted_by="Tenant Jane Doe", verified_by="grace.kendi@amani.com", verification_notes="Automatic reconciliation matched.", status=PaymentStatus.VERIFIED),
            Payment(id=payment_ids[1], organization_id=org_id, lease_id=lease_ids[1], amount=22000, payment_method=PaymentMethod.MPESA_BUY_GOODS, transaction_code="RF923N12O", payment_date="2026-06-02", submitted_by="Tenant John Kamau", verified_by="grace.kendi@amani.com", verification_notes="Reference verified.", status=PaymentStatus.VERIFIED),
            Payment(id=payment_ids[2], organization_id=org_id, lease_id=lease_ids[0], amount=35000, payment_method=PaymentMethod.MPESA_PAYBILL, transaction_code="RKX73L89P", payment_date="2026-06-12", submitted_by="Tenant Jane Doe", verified_by=None, verification_notes="", status=PaymentStatus.PENDING),
            Payment(id=payment_ids[3], organization_id=org_id, lease_id=lease_ids[2], amount=45000, payment_method=PaymentMethod.BANK_TRANSFER, transaction_code="BK4421X90", payment_date="2026-06-10", submitted_by="Tenant Sarah Wanjiku", verified_by=None, verification_notes="", status=PaymentStatus.PENDING),
        ]
        for p in payments:
            session.add(p)

        await session.commit()
        print("Database seeded successfully with UUIDs!")


if __name__ == "__main__":
    asyncio.run(seed())
