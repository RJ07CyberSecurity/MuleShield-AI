from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from shared.database import get_db_session
from app.repository.account_repository import AccountRepository
from app.services.account_service import AccountService

async def get_account_repository(session: AsyncSession = Depends(get_db_session)) -> AccountRepository:
    """
    Dependency yielding AccountRepository instance.
    """
    return AccountRepository(session)


async def get_account_service(repo: AccountRepository = Depends(get_account_repository)) -> AccountService:
    """
    Dependency yielding AccountService instance.
    """
    return AccountService(repo)
