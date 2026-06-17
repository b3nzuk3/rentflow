from sqlalchemy import (
    Column, String, Boolean, Integer, DateTime, ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.db.database import Base


class SubscriptionPlan(str, enum.Enum):
    STARTER = "Starter"
    GROWTH = "Growth"
    ENTERPRISE = "Enterprise"


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ORG_OWNER = "org_owner"
    PROPERTY_MANAGER = "property_manager"
    ACCOUNTANT = "accountant"
    CARETAKER = "caretaker"
    TENANT = "tenant"


class PropertyStatus(str, enum.Enum):
    ACTIVE = "Active"
    INACTIVE = "Inactive"


class UnitStatus(str, enum.Enum):
    VACANT = "Vacant"
    RESERVED = "Reserved"
    OCCUPIED = "Occupied"
    NOTICE_GIVEN = "Notice Given"
    UNDER_MAINTENANCE = "Under Maintenance"


class TenantStatus(str, enum.Enum):
    INVITED = "Invited"
    ACTIVE = "Active"
    NOTICE_GIVEN = "Notice Given"
    MOVED_OUT = "Moved Out"
    BLACKLISTED = "Blacklisted"


class LeaseStatus(str, enum.Enum):
    DRAFT = "Draft"
    ACTIVE = "Active"
    EXPIRED = "Expired"
    TERMINATED = "Terminated"
    COMPLETED = "Completed"


class PaymentStatus(str, enum.Enum):
    PENDING = "Pending"
    VERIFIED = "Verified"
    REJECTED = "Rejected"
    REFUNDED = "Refunded"


class PaymentMethod(str, enum.Enum):
    MPESA_PAYBILL = "M-Pesa Paybill"
    MPESA_BUY_GOODS = "M-Pesa Buy Goods"
    BANK_TRANSFER = "Bank Transfer"
    BANK_DEPOSIT = "Bank Deposit"
    CASH = "Cash"


class NotificationChannel(str, enum.Enum):
    SMS = "SMS"
    EMAIL = "Email"
    IN_APP = "In-App"


class NotificationStatus(str, enum.Enum):
    SENT = "Sent"
    PENDING = "Pending"


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    subscription_plan = Column(SAEnum(SubscriptionPlan), default=SubscriptionPlan.STARTER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    users = relationship("User", back_populates="organization")
    properties = relationship("Property", back_populates="organization")
    units = relationship("Unit", back_populates="organization")
    tenants = relationship("Tenant", back_populates="organization")
    leases = relationship("Lease", back_populates="organization")
    payments = relationship("Payment", back_populates="organization")
    audit_logs = relationship("AuditLog", back_populates="organization")
    notifications = relationship("Notification", back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="users")


class Property(Base):
    __tablename__ = "properties"

    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SAEnum(PropertyStatus), default=PropertyStatus.ACTIVE)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="properties")
    blocks = relationship("Block", back_populates="property")
    units = relationship("Unit", back_populates="property")


class Block(Base):
    __tablename__ = "blocks"

    id = Column(String(36), primary_key=True)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    property = relationship("Property", back_populates="blocks")
    units = relationship("Unit", back_populates="block")


class Unit(Base):
    __tablename__ = "units"

    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(String(36), ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    block_id = Column(String(36), ForeignKey("blocks.id", ondelete="SET NULL"), nullable=True)
    unit_code = Column(String(50), nullable=False)
    rent_amount = Column(Integer, nullable=False, default=0)
    status = Column(SAEnum(UnitStatus), default=UnitStatus.VACANT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="units")
    property = relationship("Property", back_populates="units")
    block = relationship("Block", back_populates="units")
    leases = relationship("Lease", back_populates="unit")


class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False)
    national_id = Column(String(50), nullable=True)
    status = Column(SAEnum(TenantStatus), default=TenantStatus.INVITED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="tenants")
    leases = relationship("Lease", back_populates="tenant")


class Lease(Base):
    __tablename__ = "leases"

    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    unit_id = Column(String(36), ForeignKey("units.id", ondelete="CASCADE"), nullable=False)
    monthly_rent = Column(Integer, nullable=False, default=0)
    security_deposit = Column(Integer, nullable=False, default=0)
    start_date = Column(String(10), nullable=False)
    end_date = Column(String(10), nullable=False)
    status = Column(SAEnum(LeaseStatus), default=LeaseStatus.DRAFT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="leases")
    tenant = relationship("Tenant", back_populates="leases")
    unit = relationship("Unit", back_populates="leases")
    payments = relationship("Payment", back_populates="lease")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    lease_id = Column(String(36), ForeignKey("leases.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Integer, nullable=False, default=0)
    payment_method = Column(SAEnum(PaymentMethod), nullable=False)
    transaction_code = Column(String(50), unique=True, nullable=False, index=True)
    payment_date = Column(String(10), nullable=False)
    submitted_by = Column(String(255), nullable=False)
    verified_by = Column(String(255), nullable=True)
    verification_notes = Column(Text, nullable=True)
    status = Column(SAEnum(PaymentStatus), default=PaymentStatus.PENDING)
    receipt_attachment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="payments")
    lease = relationship("Lease", back_populates="payments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String(100), nullable=False)
    entity = Column(String(100), nullable=False)
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="audit_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    channel = Column(SAEnum(NotificationChannel), nullable=False)
    trigger_type = Column(String(100), nullable=False)
    recipient = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    status = Column(SAEnum(NotificationStatus), default=NotificationStatus.SENT)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organization = relationship("Organization", back_populates="notifications")


class Invitation(Base):
    __tablename__ = "invitations"

    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    token = Column(String(255), unique=True, nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.TENANT)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
