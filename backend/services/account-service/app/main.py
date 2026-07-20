from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from app.api.v1.account import router as account_router
from app.api.v1.alert import router as alert_router
from shared.config import BaseAppSettings
from shared.database import db_manager
from shared.exceptions import register_exception_handlers
from shared.logging import configure_logging, get_logger
from shared.middleware import RequestLoggingMiddleware
from shared.schemas import ResponseEnvelope

class AccountServiceSettings(BaseAppSettings):
    pass

settings = AccountServiceSettings()

configure_logging(
    service_name="account-service",
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
        if settings.USE_SQLITE:
            from shared.database import Base
            import app.models.account
            import app.models.alert
            async with db_manager._engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("SQLite database tables verified and created")
            # Trigger seeding
            await seed_account_data()
        else:
            logger.info("Connection pool successfully established")
    except Exception as exc:
        logger.critical("PostgreSQL initialization failed, aborting startup", error=str(exc))
        raise exc

    yield  # Application runs here

    logger.info("Closing PostgreSQL connection pool on shutdown...")
    await db_manager.close()
    logger.info("Connection pool closed and disposed")


app = FastAPI(
    title="MuleShield AI - Account Service",
    description="Bank account lifecycles, ledger balances, and compliance controls.",
    version="1.0.0",
    lifespan=lifespan
)

# Global middleware & exception boundary
app.add_middleware(RequestLoggingMiddleware)
register_exception_handlers(app)

# Include routes
app.include_router(account_router, prefix="/api/v1")
app.include_router(alert_router, prefix="/api/v1")


@app.get("/health", response_model=ResponseEnvelope[dict])
async def health_check(request: Request) -> ResponseEnvelope[dict]:
    """
    Standardized health check endpoint.
    """
    return ResponseEnvelope(
        success=True,
        message="Account Service is healthy",
        data={
            "status": "UP",
            "environment": settings.ENV,
            "components": {
                "postgres": "initialized"
            }
        },
        request_id=request.state.request_id
    )


async def seed_account_data() -> None:
    import uuid
    from decimal import Decimal
    sessionmaker = db_manager.get_sessionmaker()
    if not sessionmaker:
        return
    async with sessionmaker() as session:
        from app.models.account import Account
        from app.models.alert import Alert, Rule
        from sqlalchemy import select
        # check if accounts exist
        result = await session.execute(select(Account))
        if result.scalars().first() is not None:
            return
        logger.info("Seeding default bank accounts, rules, and alerts...")
        
        # Accounts
        a1 = Account(
            id=uuid.UUID("aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa"),
            customer_id=uuid.UUID("11111111-1111-1111-1111-111111111111"),  # John Doe
            account_number="1000000001",
            type="CHECKING",
            balance=Decimal("12450.50"),
            currency="USD",
            status="ACTIVE"
        )
        a2 = Account(
            id=uuid.UUID("bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb"),
            customer_id=uuid.UUID("22222222-2222-2222-2222-222222222222"),  # Sarah Jenkins
            account_number="1000000002",
            type="CHECKING",
            balance=Decimal("890000.00"),
            currency="USD",
            status="ACTIVE"
        )
        a3 = Account(
            id=uuid.UUID("cccccccc-3333-3333-3333-cccccccccccc"),
            customer_id=uuid.UUID("33333333-3333-3333-3333-333333333333"),  # Michael Chang
            account_number="1000000003",
            type="CHECKING",
            balance=Decimal("4520.00"),
            currency="USD",
            status="ACTIVE"
        )
        a4 = Account(
            id=uuid.UUID("dddddddd-4444-4444-4444-dddddddddddd"),
            customer_id=uuid.UUID("44444444-4444-4444-4444-444444444444"),  # Amira Al-Farsi
            account_number="1000000004",
            type="SAVINGS",
            balance=Decimal("150.00"),
            currency="USD",
            status="ACTIVE"
        )
        session.add_all([a1, a2, a3, a4])
        await session.flush()
        
        # Seed rules
        r1 = Rule(
            id=uuid.UUID("f1f1f1f1-1111-1111-1111-f1f1f1f1f1f1"),
            code="RULE_001",
            name="Rapid Outbound Structuring",
            description="Detects multiple transactions under currency transaction reporting ($10,000) threshold.",
            expression="transaction.amount > 9000 and transaction.amount < 10000",
            status="ACTIVE",
            version=1
        )
        r2 = Rule(
            id=uuid.UUID("f2f2f2f2-2222-2222-2222-f2f2f2f2f2f2"),
            code="RULE_002",
            name="Rapid Pass-through Mule Transit",
            description="Detects rapid inflow followed by matching outflow in under 5 minutes.",
            expression="account.velocity_inbound_5m > 0.9 * account.velocity_outbound_5m",
            status="ACTIVE",
            version=1
        )
        session.add_all([r1, r2])
        await session.flush()
        
        # Alerts
        al1 = Alert(
            id=uuid.UUID("1a1a1a1a-1111-1111-1111-1a1a1a1a1a1a"),
            account_id=a2.id,
            customer_id=a2.customer_id,
            alert_type="VELOCITY_SPIKE",
            severity="HIGH",
            status="NEW",
            score=85.0,
            trigger_reason="Transfer of $450,000 received from international source followed by immediate outbound structuring attempts."
        )
        al2 = Alert(
            id=uuid.UUID("2b2b2b2b-2222-2222-2222-2b2b2b2b2b2b"),
            account_id=a2.id,
            customer_id=a2.customer_id,
            alert_type="MULE_TRANSIT",
            severity="CRITICAL",
            status="UNDER_REVIEW",
            score=94.0,
            trigger_reason="Account matches rapid pass-through transit characteristics matching money mule cluster 48."
        )
        al3 = Alert(
            id=uuid.UUID("3c3c3c3c-3333-3333-3333-3c3c3c3c3c3c"),
            account_id=a3.id,
            customer_id=a3.customer_id,
            alert_type="RAPID_DRAIN",
            severity="MEDIUM",
            status="NEW",
            score=55.0,
            trigger_reason="Total balance drained via multiple rapid P2P requests in under 2 minutes."
        )
        session.add_all([al1, al2, al3])
        await session.commit()
        logger.info("Seeding completed successfully.")
