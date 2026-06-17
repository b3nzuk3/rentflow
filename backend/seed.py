"""Seed database with demo data matching the prototype's mock data."""
import asyncio
import uuid
from datetime import datetime, timedelta

from app.db.database import async_session, init_db, engine
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

        org_id = "org-amani"
        org = Organization(
            id=org_id,
            name="Amani Property Group Ltd",
            subscription_plan=SubscriptionPlan.GROWTH,
            is_active=True,
        )
        session.add(org)

        # Users
        users = [
            User(id="user-fatuma", organization_id=org_id, first_name="Fatuma", last_name="Ali", phone_number="+254 712 345 678", email="fatuma.ali@amani.com", password_hash=get_password_hash("password123"), role=UserRole.ORG_OWNER, is_active=True),
            User(id="user-mwangi", organization_id=org_id, first_name="Mwangi", last_name="Karanja", phone_number="+254 722 987 654", email="mwangi.k@amani.com", password_hash=get_password_hash("password123"), role=UserRole.PROPERTY_MANAGER, is_active=True),
            User(id="user-grace", organization_id=org_id, first_name="Grace", last_name="Kendi", phone_number="+254 733 456 789", email="grace.kendi@amani.com", password_hash=get_password_hash("password123"), role=UserRole.ACCOUNTANT, is_active=True),
            User(id="user-josphat", organization_id=org_id, first_name="Josphat", last_name="Njoroge", phone_number="+254 701 555 123", email="j.njoroge@amani.com", password_hash=get_password_hash("password123"), role=UserRole.CARETAKER, is_active=True),
            User(id="user-tenant-jane", organization_id=org_id, first_name="Jane", last_name="Doe", phone_number="+254 725 333 444", email="jane.doe@gmail.com", password_hash=get_password_hash("password123"), role=UserRole.TENANT, is_active=True),
        ]
        for u in users:
            session.add(u)

        # Super admin
        session.add(User(
            id="user-superadmin", organization_id=org_id,
            first_name="System", last_name="Administrator",
            phone_number="+254 000 000000", email="admin@rentflow.co",
            password_hash=get_password_hash("password123"),
            role=UserRole.SUPER_ADMIN, is_active=True,
        ))

        # Properties
        props = [
            Property(id="prop-greenwood", organization_id=org_id, name="Greenwood Apartments", location="Nairobi, Westlands", description="Premium model duplex complex with secure boundary, borehole, and fiber internet.", status=PropertyStatus.ACTIVE),
            Property(id="prop-kilimani", organization_id=org_id, name="Kilimani Heights", location="Nairobi, Kilimani", description="Multi-family residential complex featuring stunning city views.", status=PropertyStatus.ACTIVE),
            Property(id="prop-karen", organization_id=org_id, name="Karen Palms Retreat", location="Nairobi, Karen", description="Boutique high-security townhouse community for high net worth clients.", status=PropertyStatus.ACTIVE),
        ]
        for p in props:
            session.add(p)

        # Blocks
        blocks = [
            Block(id="block-green-a", property_id="prop-greenwood", name="Block A"),
            Block(id="block-green-b", property_id="prop-greenwood", name="Block B"),
            Block(id="block-kili-east", property_id="prop-kilimani", name="East Wing"),
            Block(id="block-kili-west", property_id="prop-kilimani", name="West Wing"),
        ]
        for b in blocks:
            session.add(b)

        # Units
        units = [
            Unit(id="unit-g-b12", organization_id=org_id, property_id="prop-greenwood", block_id="block-green-b", unit_code="Unit B12", rent_amount=35000, status=UnitStatus.OCCUPIED),
            Unit(id="unit-g-b13", organization_id=org_id, property_id="prop-greenwood", block_id="block-green-b", unit_code="Unit B13", rent_amount=35000, status=UnitStatus.VACANT),
            Unit(id="unit-g-a03", organization_id=org_id, property_id="prop-greenwood", block_id="block-green-a", unit_code="Unit A03", rent_amount=22000, status=UnitStatus.OCCUPIED),
            Unit(id="unit-g-a05", organization_id=org_id, property_id="prop-greenwood", block_id="block-green-a", unit_code="Unit A05", rent_amount=45000, status=UnitStatus.RESERVED),
            Unit(id="unit-g-b20", organization_id=org_id, property_id="prop-greenwood", block_id="block-green-b", unit_code="Unit B20", rent_amount=36000, status=UnitStatus.UNDER_MAINTENANCE),
            Unit(id="unit-k-101", organization_id=org_id, property_id="prop-kilimani", block_id="block-kili-east", unit_code="Unit 101", rent_amount=65000, status=UnitStatus.OCCUPIED),
            Unit(id="unit-k-102", organization_id=org_id, property_id="prop-kilimani", block_id="block-kili-west", unit_code="Unit 102", rent_amount=48000, status=UnitStatus.OCCUPIED),
            Unit(id="unit-k-103", organization_id=org_id, property_id="prop-kilimani", block_id="block-kili-west", unit_code="Unit 103", rent_amount=48000, status=UnitStatus.VACANT),
            Unit(id="unit-kr-v01", organization_id=org_id, property_id="prop-karen", block_id=None, unit_code="Villa 01", rent_amount=120000, status=UnitStatus.OCCUPIED),
            Unit(id="unit-kr-v02", organization_id=org_id, property_id="prop-karen", block_id=None, unit_code="Villa 02", rent_amount=125000, status=UnitStatus.NOTICE_GIVEN),
        ]
        for u in units:
            session.add(u)

        # Tenants
        tenants = [
            Tenant(id="tenant-jane", organization_id=org_id, first_name="Jane", last_name="Doe", phone_number="+254 725 333 444", email="jane.doe@gmail.com", national_id="30521456", status=TenantStatus.ACTIVE),
            Tenant(id="tenant-kamau", organization_id=org_id, first_name="John", last_name="Kamau", phone_number="+254 712 111 222", email="j.kamau@gmail.com", national_id="24509121", status=TenantStatus.ACTIVE),
            Tenant(id="tenant-wanjiku", organization_id=org_id, first_name="Sarah", last_name="Wanjiku", phone_number="+254 733 999 000", email="s.wanjiku@yahoo.com", national_id="28456102", status=TenantStatus.ACTIVE),
            Tenant(id="tenant-kizito", organization_id=org_id, first_name="Amos", last_name="Kizito", phone_number="+254 710 444 555", email="amos.kizito@outlook.com", national_id="31890241", status=TenantStatus.INVITED),
            Tenant(id="tenant-moraa", organization_id=org_id, first_name="Faith", last_name="Moraa", phone_number="+254 721 222 333", email="f.moraa@gmail.com", national_id="29451121", status=TenantStatus.NOTICE_GIVEN),
        ]
        for t in tenants:
            session.add(t)

        # Leases
        leases = [
            Lease(id="lease-jane", organization_id=org_id, tenant_id="tenant-jane", unit_id="unit-g-b12", monthly_rent=35000, security_deposit=35000, start_date="2024-01-01", end_date="2024-12-31", status=LeaseStatus.ACTIVE),
            Lease(id="lease-kamau", organization_id=org_id, tenant_id="tenant-kamau", unit_id="unit-g-a03", monthly_rent=22000, security_deposit=22000, start_date="2024-02-15", end_date="2025-02-14", status=LeaseStatus.ACTIVE),
            Lease(id="lease-wanjiku", organization_id=org_id, tenant_id="tenant-wanjiku", unit_id="unit-g-a05", monthly_rent=45000, security_deposit=45000, start_date="2024-06-01", end_date="2025-05-31", status=LeaseStatus.ACTIVE),
        ]
        for l in leases:
            session.add(l)

        # Payments
        payments = [
            Payment(id="pay-1", organization_id=org_id, lease_id="lease-jane", amount=35000, payment_method=PaymentMethod.MPESA_PAYBILL, transaction_code="RG812M12P", payment_date="2026-06-01", submitted_by="Tenant Jane Doe", verified_by="grace.kendi@amani.com", verification_notes="Automatic reconciliation matched against MPesa statement.", status=PaymentStatus.VERIFIED),
            Payment(id="pay-2", organization_id=org_id, lease_id="lease-kamau", amount=22000, payment_method=PaymentMethod.MPESA_BUY_GOODS, transaction_code="RF923N12O", payment_date="2026-06-02", submitted_by="Tenant John Kamau", verified_by="grace.kendi@amani.com", verification_notes="Reference RF923N12O verified physically in accounting portal.", status=PaymentStatus.VERIFIED),
            Payment(id="pay-3", organization_id=org_id, lease_id="lease-jane", amount=35000, payment_method=PaymentMethod.MPESA_PAYBILL, transaction_code="RKX73L89P", payment_date="2026-06-12", submitted_by="Tenant Jane Doe", verified_by=None, verification_notes="", status=PaymentStatus.PENDING),
            Payment(id="pay-4", organization_id=org_id, lease_id="lease-wanjiku", amount=45000, payment_method=PaymentMethod.BANK_TRANSFER, transaction_code="BK4421X90", payment_date="2026-06-10", submitted_by="Tenant Sarah Wanjiku", verified_by=None, verification_notes="", status=PaymentStatus.PENDING),
        ]
        for p in payments:
            session.add(p)

        await session.commit()
        print("Database seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
