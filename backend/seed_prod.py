"""
Production seed script for RentFlow.
Creates initial data for the platform.

Usage: cd backend && source .venv/bin/activate && python seed_prod.py
"""
import asyncio
import uuid

from app.db.database import async_session, init_db
from app.db.models import (
    Organization, User, Property, Block, Unit, Tenant, Lease,
    Payment, RentSchedule,
    UserRole, PropertyStatus, UnitStatus, TenantStatus,
    LeaseStatus, PaymentStatus, PaymentMethod, PaymentType,
    SubscriptionPlan,
)
from app.core.security import get_password_hash


async def seed():
    """Seed the database with production-ready data."""
    await init_db()

    async with async_session() as session:
        # Check if data already exists
        from sqlalchemy import select, func
        result = await session.execute(select(func.count()).select_from(Organization))
        count = result.scalar()
        if count and count > 0:
            print(f"Database already has {count} organizations. Skipping seed.")
            return

        print("Seeding database...")

        # 1. Organization
        org_id = uuid.uuid4()
        org = Organization(
            id=org_id,
            name="RentFlow Demo",
            subscription_plan=SubscriptionPlan.STARTER,
            is_active=True,
            email="admin@rentflow.io",
            phone="+254****0000",
            address="Nairobi, Kenya",
            website="https://rentflow.io",
            business_type="Property Management",
        )
        session.add(org)
        await session.flush()
        print("  Created organization: RentFlow Demo")

        # 2. Super Admin
        super_admin = User(
            id=uuid.uuid4(),
            organization_id=org_id,
            first_name="Super",
            last_name="Admin",
            email="superadmin@rentflow.io",
            phone_number="+254****0001",
            password_hash=get_password_hash("admin123"),
            role=UserRole.SUPER_ADMIN,
            is_active=True,
        )
        session.add(super_admin)
        print("  Created super admin: superadmin@rentflow.io")

        # 3. Org Owner
        owner = User(
            id=uuid.uuid4(),
            organization_id=org_id,
            first_name="Property",
            last_name="Owner",
            email="owner@rentflow.io",
            phone_number="+254****0002",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ORG_OWNER,
            is_active=True,
        )
        session.add(owner)
        print("  Created org owner: owner@rentflow.io")

        # 4. Property
        property_id = uuid.uuid4()
        prop = Property(
            id=property_id,
            organization_id=org_id,
            name="Sunset Apartments",
            location="123 Nairobi Rd, Westlands",
            description="Premium apartment complex with modern amenities",
            status=PropertyStatus.ACTIVE,
        )
        session.add(prop)
        await session.flush()
        print("  Created property: Sunset Apartments")

        # 5. Block
        block_id = uuid.uuid4()
        block = Block(
            id=block_id,
            property_id=property_id,
            name="Block A",
        )
        session.add(block)
        await session.flush()
        print("  Created block: Block A")

        # 6. Units
        units = []
        unit_data = [
            ("A1", 50000),
            ("A2", 45000),
            ("A3", 55000),
        ]
        for code, rent in unit_data:
            unit = Unit(
                id=uuid.uuid4(),
                organization_id=org_id,
                property_id=property_id,
                block_id=block_id,
                unit_code=code,
                rent_amount=rent,
                status=UnitStatus.VACANT,
            )
            session.add(unit)
            units.append(unit)
        await session.flush()
        print(f"  Created {len(units)} units: A1, A2, A3")

        # 7. Tenant
        tenant_id = uuid.uuid4()
        tenant = Tenant(
            id=tenant_id,
            organization_id=org_id,
            first_name="John",
            last_name="Doe",
            phone_number="+254****0003",
            email="john@example.com",
            national_id="12345678",
            status=TenantStatus.ACTIVE,
        )
        session.add(tenant)
        await session.flush()
        print("  Created tenant: John Doe")

        # 8. Lease
        lease_id = uuid.uuid4()
        lease = Lease(
            id=lease_id,
            organization_id=org_id,
            tenant_id=tenant_id,
            unit_id=units[0].id,
            monthly_rent=50000,
            security_deposit=100000,
            start_date="2026-01-01",
            end_date="2026-12-31",
            status=LeaseStatus.ACTIVE,
        )
        session.add(lease)
        await session.flush()
        print("  Created lease: John Doe -> A1 (Active)")

        # 9. Payment
        payment = Payment(
            id=uuid.uuid4(),
            organization_id=org_id,
            lease_id=lease_id,
            amount=50000,
            payment_method=PaymentMethod.MPESA_PAYBILL,
            transaction_code="SEED001",
            payment_date="2026-01-15",
            submitted_by="john@example.com",
            verified_by="owner@rentflow.io",
            status=PaymentStatus.VERIFIED,
            payment_type=PaymentType.MONTHLY,
            billing_period="2026-01",
            period_start="2026-01-01",
            period_end="2026-01-31",
        )
        session.add(payment)
        print("  Created verified payment: 50000 for Jan 2026")

        # 10. Rent Schedule
        schedule = RentSchedule(
            id=uuid.uuid4(),
            organization_id=org_id,
            lease_id=lease_id,
            billing_period="2026-01",
            period_start="2026-01-01",
            period_end="2026-01-31",
            expected_amount=50000,
            paid_amount=50000,
            balance=0,
            status="Paid",
            due_date="2026-01-05",
        )
        session.add(schedule)
        print("  Created rent schedule: Jan 2026 (Paid)")

        await session.commit()
        print("\nSeed completed successfully!")
        print("\nLogin credentials:")
        print("  Super Admin: superadmin@rentflow.io / admin123")
        print("  Org Owner:   owner@rentflow.io / admin123")


if __name__ == "__main__":
    asyncio.run(seed())
