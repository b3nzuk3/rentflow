import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from app.db.models import Payment, PaymentStatus


class TestPayments:
    """Test payment endpoints."""

    @pytest.mark.asyncio
    async def test_submit_payment(self, authenticated_client: AsyncClient, test_db, test_org, test_lease):
        """Test submitting a rent payment."""
        data = {
            "lease_id": str(test_lease.id),
            "amount": 50000,
            "payment_method": "M-Pesa Paybill",
            "transaction_code": "QHK1234XYZ",
            "payment_date": "2026-01-15",
            "submitted_by": "john.doe@test.com",
            "payment_type": "Monthly Rent",
            "billing_period": "2026-01",
            "period_start": "2026-01-01",
            "period_end": "2026-01-31",
        }
        response = await authenticated_client.post("/api/v1/payments/", json=data)
        assert response.status_code == 200
        result = response.json()
        assert result["amount"] == 50000
        assert result["status"] == "Pending"

    @pytest.mark.asyncio
    async def test_list_payments(self, authenticated_client: AsyncClient, test_db, test_org, test_lease):
        """Test listing payments."""
        payment = Payment(
            id=str(uuid.uuid4()),
            organization_id=test_org.id,
            lease_id=test_lease.id,
            amount=50000,
            payment_method="M-Pesa Paybill",
            transaction_code="LIST1234",
            payment_date="2026-01-15",
            submitted_by="john@test.com",
            status=PaymentStatus.PENDING,
        )
        test_db.add(payment)
        await test_db.commit()

        response = await authenticated_client.get("/api/v1/payments/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    @pytest.mark.asyncio
    async def test_verify_payment(self, authenticated_client: AsyncClient, test_db, test_org, test_lease):
        """Test verifying a payment."""
        payment = Payment(
            id=str(uuid.uuid4()),
            organization_id=test_org.id,
            lease_id=test_lease.id,
            amount=50000,
            payment_method="Bank Transfer",
            transaction_code="VERIFY1234",
            payment_date="2026-01-15",
            submitted_by="john@test.com",
            status=PaymentStatus.PENDING,
        )
        test_db.add(payment)
        await test_db.commit()

        data = {"status": "Verified", "verification_notes": "Confirmed"}
        response = await authenticated_client.patch(f"/api/v1/payments/{payment.id}/verify", json=data)
        assert response.status_code == 200
        result = response.json()
        assert result["status"] == "Verified"
