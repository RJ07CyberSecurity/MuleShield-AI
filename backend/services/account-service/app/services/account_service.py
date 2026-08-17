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

    async def list_accounts(self, customer_id: uuid.UUID | None = None, owner_id: str | None = None) -> list[Account]:
        return await self.repository.list_accounts(customer_id=customer_id, owner_id=owner_id)

    async def get_account_profile(self, account_id: uuid.UUID) -> dict:
        """
        Aggregates account details, customer identity, and recent linked accounts.
        """
        account = await self.repository.get_account_with_customer(account_id)
        if not account:
            raise NotFoundException("Bank account record not found.")

        # If it's the mock data or SQLite, customer might be None, so handle gracefully
        customer_info = None
        if account.customer:
            customer_info = {
                "full_name": account.customer.full_name,
                "mobile": account.customer.mobile,
                "email": account.customer.email,
                "pan_number": account.customer.pan_number,
                "aadhaar_number_masked": account.customer.aadhaar_number_masked,
                "occupation": account.customer.occupation,
                "address": account.customer.address,
                # KYC / compliance fields from statement extraction
                "ckyc_number": getattr(account.customer, "ckyc_number", None),
                "nominee": getattr(account.customer, "nominee", None),
                "kyc_status": getattr(account.customer, "kyc_status", None),
            }

        transaction_summary = await self.repository.get_transaction_summary(account.account_number)
        linked_accounts = await self.repository.get_linked_accounts(account.account_number, limit=5)

        # Build response payload matching the schema
        return {
            "account_id": account.id,
            "account_number": account.account_number,
            "ifsc": getattr(account, "ifsc", None),
            "bank_name": getattr(account, "bank_name", None),
            "branch": getattr(account, "branch", None),
            "balance": account.balance,
            "currency": getattr(account, "currency", "USD"),
            "status": account.status,
            # New fields from statement extraction pipeline
            "micr": getattr(account, "micr", None),
            "alternate_ifsc": getattr(account, "alternate_ifsc", None),
            "opening_date": getattr(account, "opening_date", None),
            "customer": customer_info,
            "transaction_summary": transaction_summary,
            "linked_accounts": linked_accounts,
        }
