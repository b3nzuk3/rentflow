import logging
from typing import Optional

logger = logging.getLogger(__name__)


async def send_invitation_email(
    to_email: str,
    tenant_name: str,
    property_name: str,
    unit_code: str,
    invitation_link: str,
    inviter_name: str,
):
    """Send an invitation email to a tenant with an activation link.

    For now this logs the invitation. In production, configure SMTP settings
    and send a real email.
    """
    logger.info(
        f"INVITATION EMAIL to={to_email} "
        f"tenant={tenant_name} "
        f"property={property_name} "
        f"unit={unit_code} "
        f"link={invitation_link} "
        f"by={inviter_name}"
    )
    # TODO: Replace with actual SMTP sending in production
    # Example with aiosmtplib or an email service like SendGrid:
    #
    # from email.mime.text import MIMEText
    # from email.mime.multipart import MIMEMultipart
    # import aiosmtplib
    #
    # msg = MIMEMultipart("alternative")
    # msg["Subject"] = f"You've been invited to join {property_name} on RentFlow"
    # msg["From"] = settings.EMAIL_FROM
    # msg["To"] = to_email
    #
    # html = f"""
    # <html><body>
    # <h2>Welcome to RentFlow</h2>
    # <p>Hi {tenant_name},</p>
    # <p>{inviter_name} has invited you to join <strong>{property_name}</strong>
    # as a tenant for <strong>{unit_code}</strong>.</p>
    # <p>Click the link below to activate your account and set your password:</p>
    # <p><a href="{invitation_link}">{invitation_link}</a></p>
    # <p>This link expires in 7 days.</p>
    # </body></html>
    # """
    # msg.attach(MIMEText(html, "html"))
    # await aiosmtplib.send(
    #     msg,
    #     hostname=settings.SMTP_HOST,
    #     port=settings.SMTP_PORT,
    #     username=settings.SMTP_USERNAME,
    #     password=settings.SMTP_PASSWORD,
    #     use_tls=True,
    # )
