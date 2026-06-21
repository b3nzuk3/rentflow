"""Seed database with demo data for RentFlow V1."""
import asyncio
import uuid

from app.db.database import async_session, engine
from app.db.database import Base
from app.db.models import (
    Organization, User, Property, Block, Unit, Tenant, Lease, Payment, AuditLog,
    UserRole, SubscriptionPlan, PropertyStatus, UnitStatus, TenantStatus,
    LeaseStatus, PaymentStatus, PaymentMethod
)
from app.core.security import get_password_hash


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        from sqlalchemy import select, func
        result = await session.execute(select(func.count(Organization.id)))
        if result.scalar() > 0:
            print("Database already seeded. Skipping.")
            return

        org_id = str(uuid.uuid4())
        session.add(Organization(
            id=org_id, name="RentFlow Demo Properties",
            subscription_plan=SubscriptionPlan.GROWTH, is_active=True,
        ))

        # ── Users ──
        superadmin_id = str(uuid.uuid4())
        owner_id = str(uuid.uuid4())
        manager_id = str(uuid.uuid4())
        accountant_id = str(uuid.uuid4())
        caretaker_id = str(uuid.uuid4())

        # Tenant user accounts — each linked to a tenant profile
        tenant_user_jane_id = str(uuid.uuid4())
        tenant_user_john_id = str(uuid.uuid4())
        tenant_user_sarah_id = str(uuid.uuid4())
        tenant_user_faith_id = str(uuid.uuid4())

        users = [
            User(id=superadmin_id, organization_id=org_id, first_name="Super", last_name="Admin",
                 phone_number="+254 000 000001", email="superadmin@rentflow.io",
                 password_hash=get_password_hash("R3ntFl0w!@#4dm1n"), role=UserRole.SUPER_ADMIN, is_active=True),
            User(id=owner_id, organization_id=org_id, first_name="Demo", last_name="Owner",
                 phone_number="+254 700 000001", email="owner@rentflow.io",
                 password_hash=get_password_hash("R3ntFl0w!@#0wn3r"), role=UserRole.ORG_OWNER, is_active=True),
            User(id=manager_id, organization_id=org_id, first_name="Mwangi", last_name="Karanja",
                 phone_number="+254 722 987 654", email="mwangi.k@rentflow.demo",
                 password_hash=get_password_hash("password123"), role=UserRole.PROPERTY_MANAGER, is_active=True),
            User(id=accountant_id, organization_id=org_id, first_name="Grace", last_name="Kendi",
                 phone_number="+254 733 456 789", email="grace.kendi@rentflow.demo",
                 password_hash=get_password_hash("password123"), role=UserRole.ACCOUNTANT, is_active=True),
            User(id=caretaker_id, organization_id=org_id, first_name="Josphat", last_name="Njoroge",
                 phone_number="+254 701 555 123", email="j.njoroge@rentflow.demo",
                 password_hash=get_password_hash("password123"), role=UserRole.CARETAKER, is_active=True),
            # Tenant user accounts
            User(id=tenant_user_jane_id, organization_id=org_id, first_name="Jane", last_name="Doe",
                 phone_number="+254 725 333 444", email="jane.doe@gmail.com",
                 password_hash=get_password_hash("T3n4nt!"), role=UserRole.TENANT, is_active=True),
            User(id=tenant_user_john_id, organization_id=org_id, first_name="John", last_name="Kamau",
                 phone_number="+254 712 111 222", email="j.kamau@gmail.com",
                 password_hash=get_password_hash("T3n4nt!"), role=UserRole.TENANT, is_active=True),
            User(id=tenant_user_sarah_id, organization_id=org_id, first_name="Sarah", last_name="Wanjiku",
                 phone_number="+254 733 999 000", email="s.wanjiku@yahoo.com",
                 password_hash=get_password_hash("T3n4nt!"), role=UserRole.TENANT, is_active=True),
            User(id=tenant_user_faith_id, organization_id=org_id, first_name="Faith", last_name="Moraa",
                 phone_number="+254 721 222 333", email="f.moraa@gmail.com",
                 password_hash=get_password_hash("T3n4nt!"), role=UserRole.TENANT, is_active=True),
        ]
        for u in users:
            session.add(u)

        # ── Properties ──
        prop_greenwood = str(uuid.uuid4())
        prop_kilimani = str(uuid.uuid4())
        prop_karen = str(uuid.uuid4())
        props = [
            Property(id=prop_greenwood, organization_id=org_id, name="Greenwood Apartments",
                     location="Nairobi, Westlands", description="Premium duplex complex with secure boundary, borehole, and fiber internet.", status=PropertyStatus.ACTIVE),
            Property(id=prop_kilimani, organization_id=org_id, name="Kilimani Heights",
                     location="Nairobi, Kilimani", description="Multi-family residential complex with stunning city views.", status=PropertyStatus.ACTIVE),
            Property(id=prop_karen, organization_id=org_id, name="Karen Palms Retreat",
                     location="Nairobi, Karen", description="Boutique high-security townhouse community for discerning clients.", status=PropertyStatus.ACTIVE),
        ]
        for p in props:
            session.add(p)

        # ── Blocks ──
        block_a = str(uuid.uuid4())
        block_b = str(uuid.uuid4())
        block_east = str(uuid.uuid4())
        block_west = str(uuid.uuid4())
        blocks = [
            Block(id=block_a, property_id=prop_greenwood, name="Block A"),
            Block(id=block_b, property_id=prop_greenwood, name="Block B"),
            Block(id=block_east, property_id=prop_kilimani, name="East Wing"),
            Block(id=block_west, property_id=prop_kilimani, name="West Wing"),
        ]
        for b in blocks:
            session.add(b)

        # ── Units ──
        unit_b12 = str(uuid.uuid4()); unit_b13 = str(uuid.uuid4())
        unit_a03 = str(uuid.uuid4()); unit_a05 = str(uuid.uuid4()); unit_b20 = str(uuid.uuid4())
        unit_101 = str(uuid.uuid4()); unit_102 = str(uuid.uuid4()); unit_103 = str(uuid.uuid4())
        unit_v01 = str(uuid.uuid4()); unit_v02 = str(uuid.uuid4())
        units = [
            Unit(id=unit_b12, organization_id=org_id, property_id=prop_greenwood, block_id=block_b, unit_code="Unit B12", rent_amount=35000, status=UnitStatus.OCCUPIED),
            Unit(id=unit_b13, organization_id=org_id, property_id=prop_greenwood, block_id=block_b, unit_code="Unit B13", rent_amount=35000, status=UnitStatus.VACANT),
            Unit(id=unit_a03, organization_id=org_id, property_id=prop_greenwood, block_id=block_a, unit_code="Unit A03", rent_amount=22000, status=UnitStatus.OCCUPIED),
            Unit(id=unit_a05, organization_id=org_id, property_id=prop_greenwood, block_id=block_a, unit_code="Unit A05", rent_amount=45000, status=UnitStatus.RESERVED),
            Unit(id=unit_b20, organization_id=org_id, property_id=prop_greenwood, block_id=block_b, unit_code="Unit B20", rent_amount=36000, status=UnitStatus.UNDER_MAINTENANCE),
            Unit(id=unit_101, organization_id=org_id, property_id=prop_kilimani, block_id=block_east, unit_code="Unit 101", rent_amount=65000, status=UnitStatus.OCCUPIED),
            Unit(id=unit_102, organization_id=org_id, property_id=prop_kilimani, block_id=block_west, unit_code="Unit 102", rent_amount=48000, status=UnitStatus.OCCUPIED),
            Unit(id=unit_103, organization_id=org_id, property_id=prop_kilimani, block_id=block_west, unit_code="Unit 103", rent_amount=48000, status=UnitStatus.VACANT),
            Unit(id=unit_v01, organization_id=org_id, property_id=prop_karen, block_id=None, unit_code="Villa 01", rent_amount=120000, status=UnitStatus.OCCUPIED),
            Unit(id=unit_v02, organization_id=org_id, property_id=prop_karen, block_id=None, unit_code="Villa 02", rent_amount=125000, status=UnitStatus.NOTICE_GIVEN),
        ]
        for u in units:
            session.add(u)

        # ── Tenants (profiles linked to units via leases) ──
        tenant_jane = str(uuid.uuid4()); tenant_john = str(uuid.uuid4())
        tenant_sarah = str(uuid.uuid4()); tenant_amos = str(uuid.uuid4())
        tenant_faith = str(uuid.uuid4()); tenant_alex = str(uuid.uuid4())
        tenants = [
            Tenant(id=tenant_jane, organization_id=org_id, first_name="Jane", last_name="Doe",
                   phone_number="+254 725 333 444", email="jane.doe@gmail.com", national_id="30521456", status=TenantStatus.ACTIVE),
            Tenant(id=tenant_john, organization_id=org_id, first_name="John", last_name="Kamau",
                   phone_number="+254 712 111 222", email="j.kamau@gmail.com", national_id="24509121", status=TenantStatus.ACTIVE),
            Tenant(id=tenant_sarah, organization_id=org_id, first_name="Sarah", last_name="Wanjiku",
                   phone_number="+254 733 999 000", email="s.wanjiku@yahoo.com", national_id="28456102", status=TenantStatus.ACTIVE),
            Tenant(id=tenant_amos, organization_id=org_id, first_name="Amos", last_name="Kizito",
                   phone_number="+254 710 444 555", email="amos.kizito@outlook.com", national_id="31890241", status=TenantStatus.INVITED),
            Tenant(id=tenant_faith, organization_id=org_id, first_name="Faith", last_name="Moraa",
                   phone_number="+254 721 222 333", email="f.moraa@gmail.com", national_id="29451121", status=TenantStatus.NOTICE_GIVEN),
            Tenant(id=tenant_alex, organization_id=org_id, first_name="Alex", last_name="Mwenda",
                   phone_number="+254 755 888 999", email="alex.mwenda@gmail.com", national_id="25441021", status=TenantStatus.ACTIVE),
        ]
        for t in tenants:
            session.add(t)

        # ── Leases (tenant → unit) ──
        lease_jane_b12 = str(uuid.uuid4()); lease_john_a03 = str(uuid.uuid4())
        lease_sarah_a05 = str(uuid.uuid4()); lease_faith_v02 = str(uuid.uuid4())
        lease_alex_102 = str(uuid.uuid4()); lease_amos_103 = str(uuid.uuid4())
        leases = [
            # Active leases (current dates)
            Lease(id=lease_jane_b12, organization_id=org_id, tenant_id=tenant_jane, unit_id=unit_b12,
                  monthly_rent=35000, security_deposit=35000, start_date="2026-01-01", end_date="2026-12-31", status=LeaseStatus.ACTIVE),
            Lease(id=lease_john_a03, organization_id=org_id, tenant_id=tenant_john, unit_id=unit_a03,
                  monthly_rent=22000, security_deposit=22000, start_date="2026-02-15", end_date="2027-02-14", status=LeaseStatus.ACTIVE),
            Lease(id=lease_sarah_a05, organization_id=org_id, tenant_id=tenant_sarah, unit_id=unit_a05,
                  monthly_rent=45000, security_deposit=45000, start_date="2026-06-01", end_date="2027-05-31", status=LeaseStatus.ACTIVE),
            Lease(id=lease_alex_102, organization_id=org_id, tenant_id=tenant_alex, unit_id=unit_102,
                  monthly_rent=48000, security_deposit=48000, start_date="2026-03-01", end_date="2027-02-28", status=LeaseStatus.ACTIVE),
            # Expired lease (past end date)
            Lease(id=lease_faith_v02, organization_id=org_id, tenant_id=tenant_faith, unit_id=unit_v02,
                  monthly_rent=125000, security_deposit=125000, start_date="2024-09-01", end_date="2025-08-31", status=LeaseStatus.EXPIRED),
            # Draft lease (not yet signed)
            Lease(id=lease_amos_103, organization_id=org_id, tenant_id=tenant_amos, unit_id=unit_103,
                  monthly_rent=48000, security_deposit=48000, start_date="2026-07-01", end_date="2027-06-30", status=LeaseStatus.DRAFT),
        ]
        for l in leases:
            session.add(l)

        # ── Payments ──
        pay1 = str(uuid.uuid4()); pay2 = str(uuid.uuid4())
        pay3 = str(uuid.uuid4()); pay4 = str(uuid.uuid4())
        pay5 = str(uuid.uuid4())
        payments = [
            Payment(id=pay1, organization_id=org_id, lease_id=lease_jane_b12, amount=35000,
                    payment_method=PaymentMethod.MPESA_PAYBILL, transaction_code="RG812M12P",
                    payment_date="2026-06-01", submitted_by="Jane Doe", verified_by="grace.kendi@rentflow.demo",
                    verification_notes="Auto-reconciled with M-Pesa statement.", status=PaymentStatus.VERIFIED),
            Payment(id=pay2, organization_id=org_id, lease_id=lease_john_a03, amount=22000,
                    payment_method=PaymentMethod.MPESA_BUY_GOODS, transaction_code="RF923N12O",
                    payment_date="2026-06-02", submitted_by="John Kamau", verified_by="grace.kendi@rentflow.demo",
                    verification_notes="Reference verified manually.", status=PaymentStatus.VERIFIED),
            Payment(id=pay3, organization_id=org_id, lease_id=lease_jane_b12, amount=35000,
                    payment_method=PaymentMethod.MPESA_PAYBILL, transaction_code="RKX73L89P",
                    payment_date="2026-06-12", submitted_by="Jane Doe", verified_by=None,
                    verification_notes="", status=PaymentStatus.PENDING),
            Payment(id=pay4, organization_id=org_id, lease_id=lease_sarah_a05, amount=45000,
                    payment_method=PaymentMethod.BANK_TRANSFER, transaction_code="BK4421X90",
                    payment_date="2026-06-10", submitted_by="Sarah Wanjiku", verified_by=None,
                    verification_notes="", status=PaymentStatus.PENDING),
            Payment(id=pay5, organization_id=org_id, lease_id=lease_alex_102, amount=48000,
                    payment_method=PaymentMethod.MPESA_PAYBILL, transaction_code="QK92MPL8R",
                    payment_date="2026-06-15", submitted_by="Alex Mwenda", verified_by=None,
                    verification_notes="", status=PaymentStatus.PENDING),
        ]
        for p in payments:
            session.add(p)

        # ── Audit Logs ──
        audit_logs = [
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="CREATE_PROPERTY", entity="Property", new_value="Greenwood Apartments"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="CREATE_PROPERTY", entity="Property", new_value="Kilimani Heights"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="CREATE_PROPERTY", entity="Property", new_value="Karen Palms Retreat"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="CREATE_LEASE", entity="Lease", new_value="Jane Doe → Unit B12 (KSh 35,000/mo)"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="CREATE_LEASE", entity="Lease", new_value="John Kamau → Unit A03 (KSh 22,000/mo)"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="CREATE_LEASE", entity="Lease", new_value="Sarah Wanjiku → Unit A05 (KSh 45,000/mo)"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="CREATE_LEASE", entity="Lease", new_value="Faith Moraa → Villa 02 (KSh 125,000/mo)"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="CREATE_LEASE", entity="Lease", new_value="Alex Mwenda → Unit 102 (KSh 48,000/mo)"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="VERIFY_PAYMENT", entity="Payment", previous_value="Pending", new_value="Verified — KSh 35,000 (Jane Doe, M-Pesa)"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="VERIFY_PAYMENT", entity="Payment", previous_value="Pending", new_value="Verified — KSh 22,000 (John Kamau, M-Pesa)"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="SUBMIT_PAYMENT", entity="Payment", new_value="KSh 35,000 submitted by Jane Doe (Pending verification)"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="SUBMIT_PAYMENT", entity="Payment", new_value="KSh 45,000 submitted by Sarah Wanjiku (Pending verification)"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="SUBMIT_PAYMENT", entity="Payment", new_value="KSh 48,000 submitted by Alex Mwenda (Pending verification)"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="INVITE_TENANT", entity="Tenant", new_value="Amos Kizito invited (Pending activation)"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="UPDATE_UNIT_STATUS", entity="Unit", previous_value="Occupied", new_value="Notice Given — Villa 02 (Faith Moraa)"),
            AuditLog(id=str(uuid.uuid4()), organization_id=org_id, action="UPDATE_UNIT_STATUS", entity="Unit", previous_value="Occupied", new_value="Under Maintenance — Unit B20"),
        ]
        for log in audit_logs:
            session.add(log)

        await session.commit()
        print("Database seeded successfully with UUIDs!")


if __name__ == "__main__":
    asyncio.run(seed())
