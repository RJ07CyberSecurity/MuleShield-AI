import time
import uuid
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
import structlog
from structlog.contextvars import bind_contextvars, clear_contextvars

logger = structlog.get_logger(__name__)

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle request logging, correlation tracing, and latency tracking.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Clear any left-over context variables from previous threads
        clear_contextvars()
        
        start_time = time.perf_counter()
        
        # 1. Tracing ID generation/extraction
        # Request-ID is unique to this specific server request
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        # Correlation-ID traces transactions across multiple distributed services
        correlation_id = request.headers.get("X-Correlation-ID") or request_id
        
        # Save request ID to request state so exception handlers can retrieve it
        request.state.request_id = request_id
        request.state.correlation_id = correlation_id
        
        # Bind context variables to the logging context
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        bind_contextvars(
            request_id=request_id,
            correlation_id=correlation_id,
            ip=client_ip,
            method=request.method,
            path=request.url.path,
        )
        
        # Log initial request arrival at debug level
        logger.debug("Request started", user_agent=user_agent)
        
        try:
            # 2. Proceed with request execution pipeline
            response = await call_next(request)
            
            # Measure execution latency
            process_time_ms = (time.perf_counter() - start_time) * 1000
            
            # Log successful requests
            logger.info(
                "Request processed",
                status_code=response.status_code,
                latency_ms=round(process_time_ms, 2),
            )
            
            # 3. Inject tracing IDs back into response headers for client verification
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Correlation-ID"] = correlation_id
            return response
            
        except Exception as exc:
            # Measure execution latency in case of raw crash
            process_time_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                "Request crashed during processing",
                error=str(exc),
                latency_ms=round(process_time_ms, 2),
                exc_info=True
            )
            raise exc
        finally:
            # Ensure context variables are cleaned up from thread context
            clear_contextvars()
