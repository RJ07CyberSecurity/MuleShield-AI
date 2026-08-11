from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from app.api.v1.customer import router as customer_router
from app.api.v1.case import router as case_router
from app.api.v1.websocket import router as websocket_router
from shared.config import BaseAppSettings
from shared.database import db_manager
from shared.exceptions import register_exception_handlers
from shared.logging import configure_logging, get_logger
from shared.middleware import RequestLoggingMiddleware
from shared.schemas import ResponseEnvelope

class CustomerServiceSettings(BaseAppSettings):
    pass

settings = CustomerServiceSettings()

configure_logging(
    service_name="customer-service",
    log_level=settings.LOG_LEVEL,
    is_dev=(settings.ENV == "development")
)
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing PostgreSQL connection pool on startup...")
    try:
        db_manager.init(
            connection_string=settings.async_postgres_url,
            pool_size=settings.POSTGRES_POOL_SIZE,
            max_overflow=settings.POSTGRES_MAX_OVERFLOW
        )
        from shared.database import Base
        import app.models.customer
        import app.models.case
        async with db_manager._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified and created in Customer Service")
        if not settings.USE_SQLITE:
            logger.info("Connection pool successfully established")
    except Exception as exc:
        logger.critical("PostgreSQL initialization failed, aborting startup", error=str(exc))
        raise exc

    yield  # Application runs here

    logger.info("Closing PostgreSQL connection pool on shutdown...")
    await db_manager.close()
    logger.info("Connection pool closed and disposed")


app = FastAPI(
    title="MuleShield AI - Customer Service",
    description="Customer onboarding, compliance management, and KYC validation.",
    version="1.0.0",
    lifespan=lifespan
)

# Global middleware & exception bounds
app.add_middleware(RequestLoggingMiddleware)
register_exception_handlers(app)

from app.api.v1.websocket import router as websocket_router

# Include routes
app.include_router(customer_router, prefix="/api/v1")
app.include_router(case_router, prefix="/api/v1")
app.include_router(websocket_router)

@app.get("/health", response_model=ResponseEnvelope[dict])
async def health_check(request: Request) -> ResponseEnvelope[dict]:
    """
    Standardized health check endpoint.
    """
    return ResponseEnvelope(
        success=True,
        message="Customer Service is healthy",
        data={
            "status": "UP",
            "environment": settings.ENV,
            "components": {
                "postgres": "initialized"
            }
        },
        request_id=request.state.request_id
    )


async def seed_customer_data() -> None:
    import uuid
    sessionmaker = db_manager.get_sessionmaker()
    if not sessionmaker:
        return
    async with sessionmaker() as session:
        from app.models.customer import Customer
        from app.models.case import Case
        from sqlalchemy import select
        # check if customers exist
        result = await session.execute(select(Customer))
        if result.scalars().first() is not None:
            return
        logger.info("Seeding default customer and case management records...")
        
        c1 = Customer(
            id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
            first_name="John",
            last_name="Doe",
            email="john.doe@gmail.com",
            phone="+1-555-0199",
            kyc_status="APPROVED",
            risk_score=0.15,
            pan_number="AABPJ1234C",
            aadhaar_number_masked="XXXX-XXXX-1234",
            occupation="Software Engineer",
            annual_income=95000.00,
            address="123 Main St, New York, NY 10001"
        )
        c2 = Customer(
            id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
            first_name="Sarah",
            last_name="Jenkins",
            email="sarah.j@yahoo.com",
            phone="+1-555-0142",
            kyc_status="APPROVED",
            risk_score=0.85,
            pan_number="BCDQR5678D",
            aadhaar_number_masked="XXXX-XXXX-5678",
            occupation="Financial Analyst",
            annual_income=120000.00,
            address="456 Park Ave, Chicago, IL 60601"
        )
        c3 = Customer(
            id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
            first_name="Michael",
            last_name="Chang",
            email="mchang@techcorp.com",
            phone="+1-555-0177",
            kyc_status="APPROVED",
            risk_score=0.45,
            pan_number="CEFST9012E",
            aadhaar_number_masked="XXXX-XXXX-9012",
            occupation="Business Owner",
            annual_income=250000.00,
            address="789 Tech Blvd, San Francisco, CA 94105"
        )
        c4 = Customer(
            id=uuid.UUID("44444444-4444-4444-4444-444444444444"),
            first_name="Amira",
            last_name="Al-Farsi",
            email="amira.f@outlook.com",
            phone="+1-555-0121",
            kyc_status="PENDING",
            risk_score=0.10,
            pan_number="DFGUV3456F",
            aadhaar_number_masked="XXXX-XXXX-3456",
            occupation="Consultant",
            annual_income=75000.00,
            address="321 Desert Rd, Dubai, UAE"
        )
        c5 = Customer(
            id=uuid.UUID("55555555-5555-5555-5555-555555555555"),
            first_name="Robert",
            last_name="Kowalski",
            email="rkowalski@banking.pl",
            phone="+48-601-234-567",
            kyc_status="REJECTED",
            risk_score=0.95,
            pan_number="EGHWX7890G",
            aadhaar_number_masked="XXXX-XXXX-7890",
            occupation="Unemployed",
            annual_income=0.00,
            address="99 Nowy Swiat, Warsaw, Poland"
        )
        session.add_all([c1, c2, c3, c4, c5])
        await session.flush()
        
        # Add cases — Case model only has: id, alert_id, officer_id, notes, recommended_action, legal_reference, status
        case1 = Case(
            id=uuid.UUID("c1c1c1c1-1111-1111-1111-c1c1c1c1c1c1"),
            alert_id=None,
            officer_id=None,
            notes="Sarah's account is exhibiting high risk metrics from automated transfer clusters.",
            recommended_action="FREEZE_AND_INVESTIGATE",
            legal_reference="FIU-IND/2024/001",
            status="INVESTIGATING"
        )
        case2 = Case(
            id=uuid.UUID("c2c2c2c2-2222-2222-2222-c2c2c2c2c2c2"),
            alert_id=None,
            officer_id=None,
            notes="Robert's account logged in from Warsaw IP and Singapore device fingerprint within 10 minutes.",
            recommended_action="ESCALATE_TO_COMPLIANCE",
            legal_reference="FIU-IND/2024/002",
            status="OPEN"
        )
        session.add_all([case1, case2])
        await session.commit()
        logger.info("Seeding completed successfully.")
