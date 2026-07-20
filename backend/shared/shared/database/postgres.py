from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from sqlalchemy import DateTime, func
from sqlalchemy.ext.asyncio import AsyncAttrs, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
import structlog

logger = structlog.get_logger(__name__)

class Base(AsyncAttrs, DeclarativeBase):
    """
    Base declarative class for all SQLAlchemy ORM models.
    Enforces audit columns with timezone-aware datetimes.
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )


class DatabaseSessionManager:
    """
    Manages the life-cycle of the PostgreSQL async database connections.
    """
    def __init__(self) -> None:
        self._engine = None
        self._sessionmaker = None

    def init(self, connection_string: str, pool_size: int = 20, max_overflow: int = 10) -> None:
        """
        Initialize the database engine and session maker with connection limits.
        """
        if connection_string.startswith("sqlite"):
            from sqlalchemy.pool import NullPool
            logger.info("Initializing async SQLite database engine", path=connection_string)
            self._engine = create_async_engine(
                connection_string,
                poolclass=NullPool,
                echo=False,
                future=True
            )
        else:
            logger.info("Initializing PostgreSQL async database engine")
            self._engine = create_async_engine(
                connection_string,
                pool_size=pool_size,
                max_overflow=max_overflow,
                echo=False,
                future=True
            )
        self._sessionmaker = async_sessionmaker(
            bind=self._engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False
        )

    async def close(self) -> None:
        """
        Gracefully close and dispose the PostgreSQL database connection pool.
        """
        if self._engine is None:
            logger.warning("PostgreSQL engine is not initialized, nothing to close.")
            return
        logger.info("Disposing PostgreSQL async engine connection pool")
        await self._engine.dispose()
        self._engine = None
        self._sessionmaker = None

    def get_sessionmaker(self) -> async_sessionmaker[AsyncSession] | None:
        """
        Returns the configured sessionmaker.
        """
        return self._sessionmaker


# Singleton instance to be used across the app lifecycle
db_manager = DatabaseSessionManager()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding an async database session.
    Transactions must be explicitly committed or rolled back in repositories/services.
    """
    sessionmaker = db_manager.get_sessionmaker()
    if sessionmaker is None:
        logger.critical("DatabaseSessionManager was not initialized prior to request.")
        raise RuntimeError("DatabaseSessionManager is not initialized.")
        
    async with sessionmaker() as session:
        try:
            yield session
        except Exception as exc:
            logger.error("Database transaction failed, performing rollback", error=str(exc))
            await session.rollback()
            raise
        finally:
            await session.close()
