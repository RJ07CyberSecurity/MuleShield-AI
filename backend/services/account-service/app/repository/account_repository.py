import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.account import Account

class AccountRepository:
    """
    SQLAlchemy async repository for managing Account persistence.
    """
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_account_by_id(self, account_id: uuid.UUID) -> Account | None:
        """
        Retrieves a bank account by its UUID.
        """
        result = await self.session.execute(
            select(Account).where(Account.id == account_id)
        )
        return result.scalars().first()

    async def get_account_by_number(self, account_number: str) -> Account | None:
        """
        Retrieves an account by its unique string account number.
        """
        result = await self.session.execute(
            select(Account).where(Account.account_number == account_number)
        )
        return result.scalars().first()

    async def create_account(self, account: Account) -> Account:
        """
        Saves a new bank account in the session.
        """
        self.session.add(account)
        await self.session.flush()  # Populates account.id and timestamps
        return account

    async def list_accounts(self, customer_id: uuid.UUID | None = None) -> list[Account]:
        """
        Returns bank accounts, optionally filtered by customer UUID.
        """
        stmt = select(Account)
        if customer_id:
            stmt = stmt.where(Account.customer_id == customer_id)
            
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_last_account(self) -> Account | None:
        """
        Retrieves the last created account record. Used for sequential account number seeds.
        """
        result = await self.session.execute(
            select(Account)
            .order_by(Account.created_at.desc() if hasattr(Account, "created_at") else Account.id)
            .limit(1)
        )
        return result.scalars().first()
