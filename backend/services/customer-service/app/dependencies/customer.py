from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from shared.database import get_db_session
from app.repository.customer_repository import CustomerRepository
from app.services.customer_service import CustomerService

async def get_customer_repository(session: AsyncSession = Depends(get_db_session)) -> CustomerRepository:
    """
    Dependency yielding CustomerRepository instance.
    """
    return CustomerRepository(session)


async def get_customer_service(repo: CustomerRepository = Depends(get_customer_repository)) -> CustomerService:
    """
    Dependency yielding CustomerService instance.
    """
    return CustomerService(repo)
