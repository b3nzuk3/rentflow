import uuid
import time
import logging
from contextvars import ContextVar
from starlette.types import ASGIApp, Receive, Scope, Send

logger = logging.getLogger("rentflow.middleware")

correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")


class CorrelationIDMiddleware:
    """Pure ASGI middleware to generate and propagate correlation IDs."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Extract correlation ID from headers (ASGI headers are list of (bytes, bytes) tuples)
        corr_id = None
        for name, value in scope.get("headers", []):
            if name == b"x-request-id":
                corr_id = value.decode("utf-8")
                break
        if corr_id is None:
            corr_id = str(uuid.uuid4())

        correlation_id_var.set(corr_id)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"x-request-id", corr_id.encode("utf-8")))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)


class RequestLoggingMiddleware:
    """Pure ASGI middleware to log request/response details."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        start_time = time.time()
        method = scope.get("method", "?")
        path = scope.get("path", "?")
        status_code = 200

        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message.get("status", 200)
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            duration = time.time() - start_time
            if status_code >= 500:
                logger.error(f"{method} {path} -> {status_code} ({duration:.3f}s)")
            elif status_code >= 400:
                logger.warning(f"{method} {path} -> {status_code} ({duration:.3f}s)")
            else:
                logger.info(f"{method} {path} -> {status_code} ({duration:.3f}s)")


class SecurityHeadersMiddleware:
    """Pure ASGI middleware to add security headers to responses."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.append((b"x-content-type-options", b"nosniff"))
                headers.append((b"x-frame-options", b"DENY"))
                headers.append((b"x-xss-protection", b"1; mode=block"))
                message["headers"] = headers
            await send(message)

        await self.app(scope, receive, send_wrapper)
