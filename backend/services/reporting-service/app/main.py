from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.api.v1.reports import router as reports_router
from shared.config import BaseAppSettings
from shared.database import db_manager
from shared.exceptions import register_exception_handlers
from shared.logging import configure_logging, get_logger
from shared.middleware import RequestLoggingMiddleware

class ReportingServiceSettings(BaseAppSettings):
    pass

settings = ReportingServiceSettings()

configure_logging(
    service_name="reporting-service",
    log_level=settings.LOG_LEVEL,
    is_dev=(settings.ENV == "development")
)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database connection on startup for Reporting Service...")
    try:
        db_manager.init(
            connection_string=settings.async_postgres_url,
            pool_size=settings.POSTGRES_POOL_SIZE,
            max_overflow=settings.POSTGRES_MAX_OVERFLOW
        )
        if settings.USE_SQLITE:
            from shared.database import Base
            from shared.database.transaction import Transaction
            async with db_manager._engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("SQLite database tables verified and created in Reporting Service")
        else:
            logger.info("Connection pool successfully established in Reporting Service")
    except Exception as exc:
        logger.critical("Database initialization failed, aborting Reporting Service startup", error=str(exc))
        raise exc

    yield

    logger.info("Closing database connection on Reporting Service shutdown...")
    await db_manager.close()
    logger.info("Database connection closed and disposed")


app = FastAPI(
    title="MuleShield AI - Reporting Service",
    description="Generates compliance investigation reports using AI.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(RequestLoggingMiddleware)
register_exception_handlers(app)

app.include_router(reports_router, prefix="/api/v1")
