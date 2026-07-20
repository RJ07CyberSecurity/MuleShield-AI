from redis.asyncio import ConnectionPool, Redis
import structlog

logger = structlog.get_logger(__name__)

class RedisManager:
    """
    Manages the lifecycle of async Redis connections and pool.
    """
    def __init__(self) -> None:
        self._pool: ConnectionPool | None = None
        self._client: Redis | None = None

    def init(self, redis_url: str) -> None:
        """
        Initialize the Redis connection pool.
        """
        logger.info("Initializing async Redis connection pool")
        self._pool = ConnectionPool.from_url(
            redis_url,
            decode_responses=True,  # Automatically decode bytes to str
            max_connections=50      # Default connection limit for pools
        )
        self._client = Redis(connection_pool=self._pool)

    async def ping(self) -> bool:
        """
        Pings the Redis server to verify that the connection is active.
        """
        if self._client is None:
            logger.error("Redis client is not initialized, cannot ping.")
            return False
        try:
            return await self._client.ping()
        except Exception as exc:
            logger.error("Failed to ping Redis server", error=str(exc))
            return False

    async def close(self) -> None:
        """
        Gracefully closes the connection pool and client.
        """
        if self._client is not None:
            logger.info("Closing Redis client")
            await self._client.aclose()
        if self._pool is not None:
            logger.info("Disconnecting Redis connection pool")
            await self._pool.disconnect()
            
        self._client = None
        self._pool = None

    def get_client(self) -> Redis | None:
        """
        Returns the active async Redis client, or None if not initialized.
        """
        return self._client


# Singleton manager instance
redis_manager = RedisManager()


async def get_redis() -> Redis | None:
    """
    FastAPI dependency yielding the async Redis client or None.
    """
    return redis_manager.get_client()
