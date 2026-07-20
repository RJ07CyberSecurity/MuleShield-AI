import uuid
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.customer import Customer, KYCRecord

class CustomerRepository:
    """
    SQLAlchemy async repository for managing Customer and KYCRecord persistence.
    """
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_customer_by_id(self, customer_id: uuid.UUID) -> Customer | None:
        """
        Retrieves a customer profile with all uploaded KYC records loaded.
        """
        result = await self.session.execute(
            select(Customer)
            .options(selectinload(Customer.kyc_records))
            .where(Customer.id == customer_id)
        )
        return result.scalars().first()

    async def get_customer_by_email(self, email: str) -> Customer | None:
        """
        Retrieves a customer by email with all KYC records loaded.
        """
        result = await self.session.execute(
            select(Customer)
            .options(selectinload(Customer.kyc_records))
            .where(Customer.email == email)
        )
        return result.scalars().first()

    async def create_customer(self, customer: Customer) -> Customer:
        """
        Registers a new customer.
        """
        self.session.add(customer)
        await self.session.flush()  # Populates customer.id and timestamps
        return customer

    async def get_kyc_record_by_id(self, record_id: uuid.UUID) -> KYCRecord | None:
        """
        Retrieves a single KYC record by UUID.
        """
        result = await self.session.execute(
            select(KYCRecord)
            .where(KYCRecord.id == record_id)
        )
        return result.scalars().first()

    async def create_kyc_record(self, record: KYCRecord) -> KYCRecord:
        """
        Saves a new KYC document.
        """
        self.session.add(record)
        await self.session.flush()
        return record

    async def list_customers(self, kyc_status: str | None = None) -> list[Customer]:
        """
        Returns registered customers, optionally filtered by KYC state.
        """
        stmt = select(Customer).options(selectinload(Customer.kyc_records))
        if kyc_status:
            stmt = stmt.where(Customer.kyc_status == kyc_status.upper().strip())
            
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
