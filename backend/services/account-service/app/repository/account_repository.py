import uuid
from sqlalchemy import select, func, or_
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.account import Account
from shared.database.models import Customer, Transaction

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

    async def get_account_with_customer(self, account_id: uuid.UUID) -> Account | None:
        """
        Retrieves a bank account by its UUID, including its linked customer profile.
        """
        result = await self.session.execute(
            select(Account)
            .options(joinedload(Account.customer))
            .where(Account.id == account_id)
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

    async def list_accounts(self, customer_id: uuid.UUID | None = None, owner_id: str | None = None) -> list[Account]:
        """
        Returns bank accounts, optionally filtered by customer UUID.
        """
        if not owner_id:
            return []
        stmt = select(Account)
        if customer_id:
            stmt = stmt.where(Account.customer_id == customer_id)
        stmt = stmt.where(Account.owner_id == owner_id)
            
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

    async def get_linked_accounts(self, account_number: str, limit: int = 5) -> list[dict]:
        """
        Fetches summary of recent transactions to identify linked accounts.
        """
        stmt = (
            select(
                Transaction.receiver_account.label("linked_account"),
                Transaction.bank_name,
                func.count(Transaction.id).label("txn_count"),
                func.sum(Transaction.amount).label("total_vol"),
                Account.id.label("linked_account_id")
            )
            .outerjoin(Account, Account.account_number == Transaction.receiver_account)
            .where(Transaction.sender_account == account_number, Transaction.status == "CONFIRMED")
            .group_by(Transaction.receiver_account, Transaction.bank_name, Account.id)
            .order_by(func.sum(Transaction.amount).desc())
            .limit(limit)
        )
        res = await self.session.execute(stmt)
        rows = res.all()
        return [
            {
                "account_number": r.linked_account,
                "account_id": str(r.linked_account_id) if r.linked_account_id else None,
                "bank_name": r.bank_name or "Unknown Bank",
                "transaction_count": r.txn_count,
                "total_volume": r.total_vol
            }
            for r in rows
        ]

    async def get_transaction_summary(self, account_number: str) -> dict:
        """
        Fetches latest transaction amount and timestamp.
        """
        stmt = (
            select(Transaction.amount, Transaction.timestamp)
            .where(
                or_(Transaction.sender_account == account_number, Transaction.receiver_account == account_number),
                Transaction.status == "CONFIRMED"
            )
            .order_by(Transaction.timestamp.desc())
            .limit(1)
        )
        res = await self.session.execute(stmt)
        row = res.first()
        
        sum_stmt = (
            select(func.sum(Transaction.amount))
            .where(
                or_(Transaction.sender_account == account_number, Transaction.receiver_account == account_number),
                Transaction.status == "CONFIRMED"
            )
        )
        sum_res = await self.session.execute(sum_stmt)
        total_vol = sum_res.scalar() or 0.0

        if row:
            return {
                "latest_amount": row.amount,
                "latest_timestamp": row.timestamp,
                "total_volume_30d": total_vol
            }
        return None
