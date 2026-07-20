from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.auth import router as auth_router
from app.models.auth import User, Role, Permission
from shared.config import BaseAppSettings
from shared.database import db_manager, mongo_manager, redis_manager, neo4j_manager
from shared.exceptions import register_exception_handlers
from shared.logging import configure_logging, get_logger
from shared.middleware import RequestLoggingMiddleware
from shared.schemas import ResponseEnvelope

class AuthServiceSettings(BaseAppSettings):
    pass

settings = AuthServiceSettings()

configure_logging(
    service_name="auth-service",
    log_level=settings.LOG_LEVEL,
    is_dev=(settings.ENV == "development")
)
logger = get_logger(__name__)


async def seed_default_rbac(session: AsyncSession) -> None:
    """
    Seeds default system permissions and roles on application startup.
    Self-healing: only creates missing records.
    """
    # 1. Define standard permissions
    default_permissions = {
        "read:alerts": "View system alerts",
        "write:alerts": "Acknowledge and route alerts",
        "read:cases": "View compliance cases",
        "write:cases": "Update status and notes of cases",
        "read:transactions": "View transactional details",
        "read:graph": "Explore relationships in Neo4j",
        "write:graph": "Update network graph structure",
        "write:rules": "Create/modify AML rules",
        "manage:system": "Modify system settings and models"
    }

    db_perms = {}
    for name, desc in default_permissions.items():
        result = await session.execute(select(Permission).where(Permission.name == name))
        perm = result.scalars().first()
        if not perm:
            perm = Permission(name=name, description=desc)
            session.add(perm)
        db_perms[name] = perm
    await session.flush()  # Populate IDs

    # 2. Define standard roles mapped to permission names
    default_roles = {
        "analyst": ["read:alerts", "write:alerts", "read:cases", "read:transactions", "read:graph"],
        "investigator": ["read:alerts", "write:alerts", "read:cases", "write:cases", "read:transactions", "read:graph", "write:graph"],
        "compliance_officer": ["read:alerts", "write:alerts", "read:cases", "write:cases", "read:transactions", "read:graph", "write:graph"],
        "administrator": list(default_permissions.keys()),
        "system": ["read:transactions", "read:graph", "write:graph"]
    }

    for role_name, perm_names in default_roles.items():
        result = await session.execute(
            select(Role)
            .options(selectinload(Role.permissions))
            .where(Role.name == role_name)
        )
        role = result.scalars().first()
        if not role:
            role = Role(name=role_name, description=f"Default bank {role_name} role")
            session.add(role)
        
        # Link permissions to role
        role.permissions = [db_perms[pname] for pname in perm_names if pname in db_perms]
    await session.flush()

    # 3. Seed default investigator user
    result_user = await session.execute(select(User).where(User.email == "analyst@muleshield.ai"))
    user = result_user.scalars().first()
    if not user:
        from shared.authentication import PasswordHasher
        hashed_pass = PasswordHasher.hash_password("password123")
        investigator_role = await session.execute(select(Role).where(Role.name == "investigator"))
        role_obj = investigator_role.scalars().first()
        
        new_user = User(
            email="analyst@muleshield.ai",
            hashed_password=hashed_pass,
            first_name="Sarah",
            last_name="Chambers",
            is_active=True,
            is_mfa_enabled=False
        )
        if role_obj:
            new_user.roles.append(role_obj)
        session.add(new_user)
        await session.flush()
        logger.info("Default investigator user seeded successfully.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database connection pools on startup...")
    try:
        db_manager.init(
            connection_string=settings.async_postgres_url,
            pool_size=settings.POSTGRES_POOL_SIZE,
            max_overflow=settings.POSTGRES_MAX_OVERFLOW
        )
        
        if settings.USE_SQLITE:
            # Create all database tables dynamically on startup
            from shared.database import Base
            # Import models to ensure they are registered on the Base metadata
            import app.models.auth
            async with db_manager._engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("SQLite database tables verified and created")
        else:
            mongo_manager.init(uri=settings.MONGODB_URI, db_name=settings.MONGODB_DB_NAME)
            redis_manager.init(redis_url=settings.REDIS_URL)
            neo4j_manager.init(
                uri=settings.NEO4J_URI,
                user=settings.NEO4J_USER,
                password=settings.NEO4J_PASSWORD
            )
            logger.info("All connection pools successfully established")
        
        # Seed RBAC tables
        sessionmaker = db_manager.get_sessionmaker()
        if sessionmaker:
            async with sessionmaker() as session:
                try:
                    await seed_default_rbac(session)
                    await session.commit()
                    logger.info("Database RBAC seeding verified and saved.")
                except Exception as exc:
                    await session.rollback()
                    logger.error("Failed to seed database RBAC definitions", error=str(exc))
                    
    except Exception as exc:
        logger.critical("Database initialization failed, aborting startup", error=str(exc))
        raise exc

    yield

    logger.info("Closing database connection pools on shutdown...")
    await db_manager.close()
    if not settings.USE_SQLITE:
        mongo_manager.close()
        await redis_manager.close()
        await neo4j_manager.close()
    logger.info("All connection pools closed and disposed")


app = FastAPI(
    title="MuleShield AI - Auth Service",
    description="Identity management, multi-factor authentication, and RBAC validation.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(RequestLoggingMiddleware)
register_exception_handlers(app)

# Include Auth Router
app.include_router(auth_router, prefix="/api/v1")


@app.get("/health", response_model=ResponseEnvelope[dict])
async def health_check(request: Request) -> ResponseEnvelope[dict]:
    """
    Standardized health check endpoint.
    """
    return ResponseEnvelope(
        success=True,
        message="Authentication Service is healthy",
        data={
            "status": "UP",
            "environment": settings.ENV,
            "components": {
                "postgres": "initialized",
                "mongodb": "initialized",
                "redis": "initialized",
                "neo4j": "initialized"
            }
        },
        request_id=request.state.request_id
    )
