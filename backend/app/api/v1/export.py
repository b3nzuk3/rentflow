import io
import csv
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import (
    Tenant,
    Unit,
    Property,
    Lease,
    Payment,
    AuditLog,
)
from app.core.security import get_current_user

router = APIRouter(redirect_slashes=False)


# Mapping of export entity name -> model, columns, headers
EXPORT_CONFIGS = {
    "tenants": {
        "model": Tenant,
        "columns": [
            "id",
            "first_name",
            "last_name",
            "phone_number",
            "email",
            "national_id",
            "status",
            "created_at",
            "updated_at",
        ],
        "headers": [
            "ID",
            "First Name",
            "Last Name",
            "Phone Number",
            "Email",
            "National ID",
            "Status",
            "Created At",
            "Updated At",
        ],
    },
    "units": {
        "model": Unit,
        "columns": [
            "id",
            "property_id",
            "block_id",
            "unit_code",
            "rent_amount",
            "status",
            "created_at",
            "updated_at",
        ],
        "headers": [
            "ID",
            "Property ID",
            "Block ID",
            "Unit Code",
            "Rent Amount",
            "Status",
            "Created At",
            "Updated At",
        ],
    },
    "properties": {
        "model": Property,
        "columns": [
            "id",
            "name",
            "location",
            "description",
            "status",
            "image_url",
            "created_at",
            "updated_at",
        ],
        "headers": [
            "ID",
            "Name",
            "Location",
            "Description",
            "Status",
            "Image URL",
            "Created At",
            "Updated At",
        ],
    },
    "leases": {
        "model": Lease,
        "columns": [
            "id",
            "tenant_id",
            "unit_id",
            "monthly_rent",
            "security_deposit",
            "start_date",
            "end_date",
            "status",
            "created_at",
            "updated_at",
        ],
        "headers": [
            "ID",
            "Tenant ID",
            "Unit ID",
            "Monthly Rent",
            "Security Deposit",
            "Start Date",
            "End Date",
            "Status",
            "Created At",
            "Updated At",
        ],
    },
    "payments": {
        "model": Payment,
        "columns": [
            "id",
            "lease_id",
            "amount",
            "payment_method",
            "transaction_code",
            "payment_date",
            "submitted_by",
            "verified_by",
            "verification_notes",
            "status",
            "payment_type",
            "billing_period",
            "period_start",
            "period_end",
            "created_at",
            "updated_at",
        ],
        "headers": [
            "ID",
            "Lease ID",
            "Amount",
            "Payment Method",
            "Transaction Code",
            "Payment Date",
            "Submitted By",
            "Verified By",
            "Verification Notes",
            "Status",
            "Payment Type",
            "Billing Period",
            "Period Start",
            "Period End",
            "Created At",
            "Updated At",
        ],
    },
    "audit_logs": {
        "model": AuditLog,
        "columns": [
            "id",
            "user_id",
            "action",
            "entity",
            "previous_value",
            "new_value",
            "ip_address",
            "created_at",
        ],
        "headers": [
            "ID",
            "User ID",
            "Action",
            "Entity",
            "Previous Value",
            "New Value",
            "IP Address",
            "Created At",
        ],
    },
}


def _to_csv_value(value):
    """Convert a model attribute value into a CSV-safe string."""
    if value is None:
        return ""
    if isinstance(value, UUID):
        return str(value)
    if hasattr(value, "value"):  # Enum
        return str(value.value)
    if isinstance(value, (dict, list)):
        return str(value)
    return value


@router.get("/{entity}")
async def export_entity(
    entity: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    config = EXPORT_CONFIGS.get(entity)
    if not config:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown export entity: {entity}. Available: {', '.join(EXPORT_CONFIGS.keys())}",
        )

    model = config["model"]
    columns = config["columns"]
    headers = config["headers"]

    result = await db.execute(
        select(model)
        .where(model.organization_id == current_user.organization_id)
        .order_by(model.created_at.desc())
    )
    rows = result.scalars().all()

    def generate():
        buffer = io.StringIO()
        writer = csv.writer(buffer)
        writer.writerow(headers)
        yield buffer.getvalue()
        buffer.seek(0)
        buffer.truncate(0)
        for row in rows:
            writer.writerow([_to_csv_value(getattr(row, col)) for col in columns])
            yield buffer.getvalue()
            buffer.seek(0)
            buffer.truncate(0)

    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{entity}.csv"'},
    )
