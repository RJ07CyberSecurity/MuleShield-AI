import logging
import sys
from typing import Any
import structlog
from structlog.types import EventDict, Processor

# Shared context variables that will be attached to every log record if present.
# These are managed thread-safely/coroutine-safely by structlog.contextvars.
def add_service_context(logger: Any, method_name: str, event_dict: EventDict) -> EventDict:
    """Adds global service identifier context to the log event."""
    event_dict["service"] = "muleshield-shared"
    return event_dict

def configure_logging(service_name: str, log_level: str = "INFO", is_dev: bool = False) -> None:
    """
    Configure structured logging for the application.
    Reroutes python standard library logs to structlog and defines standard JSON or console outputs.
    """
    # Map string log level to python standard logging levels
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    # Set up basic config for standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=numeric_level,
    )

    # Core structlog processors that will format the log events
    shared_processors: list[Processor] = [
        # Merges context variables set via structlog.contextvars.bind_contextvars()
        structlog.contextvars.merge_contextvars,
        # Adds log level (debug, info, warning, etc.)
        structlog.processors.add_log_level,
        # Adds standard ISO timestamp
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        # Handles any positional arguments passed to the logger
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        # Injects the application or microservice name
        lambda _, __, event_dict: {**event_dict, "service": service_name},
    ]

    if is_dev:
        # Development layout: human-readable, colorized output
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True)
        ]
    else:
        # Production layout: strict JSON output for aggregators (ELK, Loki)
        processors = shared_processors + [
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ]

    structlog.configure(
        processors=processors,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Re-route root loggers of popular libraries to structlog standard library wrapper
    for logger_name in ("uvicorn", "uvicorn.error", "uvicorn.access", "sqlalchemy.engine", "gunicorn.error"):
        lib_logger = logging.getLogger(logger_name)
        lib_logger.handlers = []
        lib_logger.propagate = True

    # Adjust levels for noisy dependencies
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> structlog.stdlib.BoundLogger:
    """
    Returns a configured, structured logger instance.
    """
    return structlog.get_logger(name)
