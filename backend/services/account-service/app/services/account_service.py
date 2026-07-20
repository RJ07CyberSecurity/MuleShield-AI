import random
import uuid
from decimal import Decimal
from sqlalchemy import text
from app.models.account import Account
from app.repository.account_repository import AccountRepository
from shared.exceptions import ConflictException, NotFoundException, BankingException
import structlog

logger = structlog.get_logger(__name__)

class AccountService:
    """
    Account domain service managing account lifecycles, ledger balances, and freezes.
    """
    def __init__(self, repository: AccountRepository) -> None:
        self.repository = repository

    async def open_account(self, customer_id: uuid.UUID, type_: str, currency: str = "USD") -> Account:
        """
        Creates a new bank account for an existing customer.
        Verifies customer existence via a stateless database lookup.
        """
        # Stateless inter-service check: Verify customer exists in PostgreSQL without importing models
        stmt = text("SELECT 1 FROM customers WHERE id = :cust_id")
        result = await self.repository.session.execute(stmt, {"cust_id": customer_id})
        if not result.scalars().first():
            logger.error("Account opening rejected: customer profile missing", customer_id=str(customer_id))
            raise NotFoundException("Customer profile not found.")

        # Generate a unique 10-digit account number (collision check)
        account_number = ""
        while True:
            account_number = "".join(str(random.randint(0, 9)) for _ in range(10))
            existing = await self.repository.get_account_by_number(account_number)
            if not existing:
                break

        new_account = Account(
            customer_id=customer_id,
            account_number=account_number,
            type=type_.upper().strip(),
            balance=Decimal("0.0000"),
            currency=currency.upper().strip(),
            status="ACTIVE"
        )

        await self.repository.create_account(new_account)
        logger.info(
            "New bank account opened",
            customer_id=str(customer_id),
            account_number=account_number,
            account_id=str(new_account.id)
        )
        return new_account

    async def freeze_account(self, account_id: uuid.UUID, reason: str) -> Account:
        """
        Locks an account, blocking transaction logic. (AML containment control).
        """
        account = await self.repository.get_account_by_id(account_id)
        if not account:
            raise NotFoundException("Bank account record not found.")

        if account.status == "FROZEN":
            raise ConflictException("Bank account is already frozen.")

        account.status = "FROZEN"
        logger.warning("Bank account FROZEN due to audit compliance", account_id=str(account_id), reason=reason)
        return account

    async def unfreeze_account(self, account_id: uuid.UUID, reason: str) -> Account:
        """
        Unlocks a frozen bank account. (Restricted override).
        """
        account = await self.repository.get_account_by_id(account_id)
        if not account:
            raise NotFoundException("Bank account record not found.")

        if account.status != "FROZEN":
            raise ConflictException("Bank account is not currently frozen.")

        account.status = "ACTIVE"
        logger.info("Bank account unfrozen and returned to ACTIVE status", account_id=str(account_id), reason=reason)
        return account

    async def list_accounts(self, customer_id: uuid.UUID | None = None) -> list[Account]:
        """
        Retrieves all bank accounts, optionally filtered by customer ID.
        """
        return await self.repository.list_accounts(customer_id=customer_id)
