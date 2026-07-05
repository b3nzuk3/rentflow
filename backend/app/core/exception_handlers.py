import logging
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("rentflow.exceptions")


async def custom_http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Custom handler for FastAPI HTTPExceptions.
    Returns structured error responses with correlation ID if available.
    """
    correlation_id = getattr(request.state, "correlation_id", None)

    error_response = {
        "error": {
            "code": exc.status_code,
            "message": exc.detail,
            "type": "http_error",
        }
    }

    if correlation_id:
        error_response["error"]["correlation_id"] = correlation_id

    if exc.status_code >= 500:
        logger.error(
            f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}",
            extra={"correlation_id": correlation_id},
        )
    else:
        logger.warning(
            f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}",
            extra={"correlation_id": correlation_id},
        )

    return JSONResponse(
        status_code=exc.status_code,
        content=error_response,
        headers=exc.headers,
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Generic handler for unhandled exceptions.
    Returns 500 Internal Server Error with structured response.
    """
    correlation_id = getattr(request.state, "correlation_id", None)

    logger.exception(
        f"Unhandled exception on {request.method} {request.url.path}: {exc}",
        extra={"correlation_id": correlation_id},
    )

    error_response = {
        "error": {
            "code": status.HTTP_500_INTERNAL_SERVER_ERROR,
            "message": "Internal server error",
            "type": "internal_error",
        }
    }

    if correlation_id:
        error_response["error"]["correlation_id"] = correlation_id

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response,
    )