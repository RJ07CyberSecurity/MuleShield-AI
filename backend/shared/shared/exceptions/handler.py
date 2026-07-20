from datetime import datetime, timezone
from typing import Any
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from shared.logging.logger import get_logger

logger = get_logger(__name__)

class AppException(Exception):
    """Base exception class for all MuleShield AI exceptions."""
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        errors: list[Any] | None = None
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors or []


class DatabaseException(AppException):
    """Raised when a database query or transaction fails."""
    def __init__(self, message: str = "Database operation failed", errors: list[Any] | None = None):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR, errors)


class NotFoundException(AppException):
    """Raised when a requested resource is not found."""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class AuthenticationException(AppException):
    """Raised when user authentication fails."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class AuthorizationException(AppException):
    """Raised when a user lacks sufficient permissions."""
    def __init__(self, message: str = "Permission denied"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)


class ConflictException(AppException):
    """Raised when a state conflict occurs (e.g. duplicate resource)."""
    def __init__(self, message: str = "Conflict occurred"):
        super().__init__(message, status.HTTP_409_CONFLICT)


class BankingException(AppException):
    """Raised when business logic validation fails (e.g. insufficient funds, blocked account)."""
    def __init__(self, message: str, errors: list[Any] | None = None):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, errors)


def create_error_response(
    success: bool,
    message: str,
    status_code: int,
    request_id: str,
    errors: list[Any] | None = None
) -> JSONResponse:
    """Helper to format JSON envelope error response."""
    return JSONResponse(
        status_code=status_code,
        content={
            "success": success,
            "message": message,
            "data": None,
            "errors": errors or [],
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )


def register_exception_handlers(app: FastAPI) -> None:
    """
    Registers global exception handlers on a FastAPI application.
    """
    @app.exception_handler(AppException)
    async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "N/A")
        logger.error(
            "Application error occurred",
            request_id=request_id,
            message=exc.message,
            status_code=exc.status_code,
            errors=exc.errors,
            exc_info=True
        )
        return create_error_response(
            success=False,
            message=exc.message,
            status_code=exc.status_code,
            request_id=request_id,
            errors=exc.errors
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "N/A")
        
        # Format the validation errors into a clean path-based structure
        formatted_errors = []
        for error in exc.errors():
            loc = ".".join(str(x) for x in error.get("loc", []))
            formatted_errors.append({
                "field": loc,
                "type": error.get("type"),
                "message": error.get("msg")
            })

        logger.warning(
            "Validation error occurred",
            request_id=request_id,
            errors=formatted_errors
        )
        return create_error_response(
            success=False,
            message="Schema validation failed",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            request_id=request_id,
            errors=formatted_errors
        )

    @app.exception_handler(StarletteHTTPException)
    async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "N/A")
        logger.warning(
            "HTTP exception occurred",
            request_id=request_id,
            detail=exc.detail,
            status_code=exc.status_code
        )
        return create_error_response(
            success=False,
            message=exc.detail,
            status_code=exc.status_code,
            request_id=request_id
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "N/A")
        logger.critical(
            "Unhandled server exception",
            request_id=request_id,
            error=str(exc),
            exc_info=True
        )
        # Safe default to avoid leaking internal db traceback or credentials
        return create_error_response(
            success=False,
            message="Internal server error",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            request_id=request_id
        )
