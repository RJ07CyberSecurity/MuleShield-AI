from collections.abc import AsyncGenerator
from neo4j import AsyncDriver, AsyncGraphDatabase, AsyncSession
import structlog

logger = structlog.get_logger(__name__)

class Neo4jManager:
    """
    Manages the lifecycle of the Neo4j async graph database driver.
    """
    def __init__(self) -> None:
        self._driver: AsyncDriver | None = None

    def init(self, uri: str, user: str, password: str) -> None:
        """
        Initialize the async Neo4j bolt driver.
        """
        logger.info("Initializing async Neo4j graph driver", uri=uri)
        self._driver = AsyncGraphDatabase.driver(uri, auth=(user, password))

    async def close(self) -> None:
        """
        Closes the Neo4j driver connection.
        """
        if self._driver is None:
            logger.warning("Neo4j driver is not initialized, nothing to close.")
            return
        logger.info("Closing Neo4j graph driver connection")
        await self._driver.close()
        self._driver = None

    def get_driver(self) -> AsyncDriver:
        """
        Returns the active driver.
        """
        if self._driver is None:
            logger.critical("Neo4j driver was not initialized prior to calling get_driver.")
            raise RuntimeError("Neo4jManager is not initialized.")
        return self._driver


# Singleton manager instance
neo4j_manager = Neo4jManager()


async def get_neo4j_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency yielding an async Neo4j session.
    """
    driver = neo4j_manager.get_driver()
    async with driver.session() as session:
        try:
            yield session
        finally:
            await session.close()
            
            
async def verify_neo4j_connection() -> bool:
    """
    Verifies that the Neo4j driver can connect and query.
    """
    driver = neo4j_manager.get_driver()
    try:
        await driver.verify_connectivity()
        return True
    except Exception as exc:
        logger.error("Failed to verify Neo4j connectivity", error=str(exc))
        return False


# Cypher Sync Utilities
async def sync_customer_node(session: AsyncSession, customer_id: str, email: str, name: str, phone: str) -> None:
    query = (
        "MERGE (c:Customer {id: $customer_id}) "
        "SET c.email = $email, c.name = $name, c.phone = $phone"
    )
    await session.run(query, customer_id=customer_id, email=email, name=name, phone=phone)


async def sync_account_node(session: AsyncSession, account_number: str, bank_name: str, status: str) -> None:
    query = (
        "MERGE (a:Account {number: $account_number}) "
        "SET a.bank_name = $bank_name, a.status = $status"
    )
    await session.run(query, account_number=account_number, bank_name=bank_name, status=status)


async def sync_device_node(session: AsyncSession, device_id: str) -> None:
    query = "MERGE (d:Device {id: $device_id})"
    await session.run(query, device_id=device_id)


async def sync_ip_node(session: AsyncSession, ip_address: str) -> None:
    query = "MERGE (i:IP {address: $ip_address})"
    await session.run(query, ip_address=ip_address)


async def sync_owns_relationship(session: AsyncSession, customer_id: str, account_number: str) -> None:
    query = (
        "MATCH (c:Customer {id: $customer_id}), (a:Account {number: $account_number}) "
        "MERGE (c)-[:OWNS]->(a)"
    )
    await session.run(query, customer_id=customer_id, account_number=account_number)


async def sync_transfer_relationship(
    session: AsyncSession, sender_number: str, receiver_number: str, amount: float, timestamp: str, txn_id: str
) -> None:
    query = (
        "MATCH (a1:Account {number: $sender_number}), (a2:Account {number: $receiver_number}) "
        "MERGE (a1)-[r:TRANSFERRED_TO {txn_id: $txn_id}]->(a2) "
        "SET r.amount = $amount, r.timestamp = $timestamp"
    )
    await session.run(
        query,
        sender_number=sender_number,
        receiver_number=receiver_number,
        amount=amount,
        timestamp=timestamp,
        txn_id=txn_id
    )


async def sync_used_device_relationship(session: AsyncSession, customer_id: str, device_id: str) -> None:
    query = (
        "MATCH (c:Customer {id: $customer_id}), (d:Device {id: $device_id}) "
        "MERGE (c)-[:USED_DEVICE]->(d)"
    )
    await session.run(query, customer_id=customer_id, device_id=device_id)


async def sync_used_ip_relationship(session: AsyncSession, customer_id: str, ip_address: str) -> None:
    query = (
        "MATCH (c:Customer {id: $customer_id}), (i:IP {address: $ip_address}) "
        "MERGE (c)-[:USED_IP]->(i)"
    )
    await session.run(query, customer_id=customer_id, ip_address=ip_address)

