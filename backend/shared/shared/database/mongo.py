from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import structlog

logger = structlog.get_logger(__name__)

class MongoManager:
    """
    Manages the lifecycle of MongoDB async client and databases.
    """
    def __init__(self) -> None:
        self._client: AsyncIOMotorClient | None = None
        self._db: AsyncIOMotorDatabase | None = None

    def init(self, uri: str, db_name: str) -> None:
        """
        Initialize the MongoDB client and select default database.
        """
        logger.info("Initializing async MongoDB client", database=db_name)
        self._client = AsyncIOMotorClient(uri)
        self._db = self._client[db_name]

    def close(self) -> None:
        """
        Closes the MongoDB connections.
        """
        if self._client is None:
            logger.warning("MongoDB client is not initialized, nothing to close.")
            return
        logger.info("Closing MongoDB connections")
        self._client.close()
        self._client = None
        self._db = None

    def get_db(self) -> AsyncIOMotorDatabase:
        """
        Returns the default database instance.
        """
        if self._db is None:
            logger.critical("MongoDB was not initialized prior to calling get_db.")
            raise RuntimeError("MongoManager is not initialized.")
        return self._db

    def get_client(self) -> AsyncIOMotorClient:
        """
        Returns the raw motor client instance.
        """
        if self._client is None:
            logger.critical("MongoDB client was not initialized prior to calling get_client.")
            raise RuntimeError("MongoManager client is not initialized.")
        return self._client


# Singleton manager instance
mongo_manager = MongoManager()


async def get_mongo_db() -> AsyncIOMotorDatabase:
    """
    FastAPI dependency yielding the MongoDB database instance.
    """
    return mongo_manager.get_db()
