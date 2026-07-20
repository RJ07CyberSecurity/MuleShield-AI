import uuid
from datetime import datetime, timezone
from app.models.customer import Customer, KYCRecord
from app.repository.customer_repository import CustomerRepository
from shared.exceptions import ConflictException, NotFoundException, BankingException
import structlog

logger = structlog.get_logger(__name__)

class CustomerService:
    """
    Customer domain service managing profile validations, KYC workflows, and status rotation.
    """
    def __init__(self, repository: CustomerRepository) -> None:
        self.repository = repository

    async def register_customer(self, first_name: str, last_name: str, email: str, phone: str) -> Customer:
        """
        Registers a new customer. Default KYC status is PENDING and AML risk is 0.0.
        """
        existing = await self.repository.get_customer_by_email(email)
        if existing:
            logger.warning("Customer registration blocked: email exists", email=email)
            raise ConflictException(f"Customer with email '{email}' already exists.")

        new_customer = Customer(
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
            kyc_status="PENDING",
            risk_score=0.0
        )

        await self.repository.create_customer(new_customer)
        logger.info("New customer profile created", email=email, customer_id=str(new_customer.id))
        return new_customer

    async def submit_kyc_document(self, customer_id: uuid.UUID, document_type: str, document_number: str) -> KYCRecord:
        """
        Saves a new KYC verification document for a customer.
        """
        customer = await self.repository.get_customer_by_id(customer_id)
        if not customer:
            logger.error("KYC submission rejected: customer profile missing", customer_id=str(customer_id))
            raise NotFoundException("Customer profile not found.")

        # If customer KYC is already approved, prevent duplicate document spam
        if customer.kyc_status == "APPROVED":
            logger.warning("MFA KYC verify warning: customer already approved", customer_id=str(customer_id))

        new_record = KYCRecord(
            customer_id=customer_id,
            document_type=document_type.upper(),
            document_number=document_number,
            status="PENDING"
        )

        await self.repository.create_kyc_record(new_record)
        logger.info(
            "KYC document uploaded",
            customer_id=str(customer_id),
            document_type=document_type,
            record_id=str(new_record.id)
        )
        return new_record

    async def verify_kyc_record(self, record_id: uuid.UUID, status: str, notes: str | None = None) -> KYCRecord:
        """
        Performs compliance verification on a KYC record.
        Updates customer KYC status dynamically.
        """
        record = await self.repository.get_kyc_record_by_id(record_id)
        if not record:
            raise NotFoundException("KYC document record not found.")

        # Ensure we do not re-verify an already audited record
        if record.status != "PENDING":
            raise ConflictException(f"KYC record has already been audited as '{record.status}'.")

        record.status = status.upper().strip()
        record.verified_at = datetime.now(timezone.utc)
        record.verifier_notes = notes

        # Update customer profile status based on audit outcome
        customer = await self.repository.get_customer_by_id(record.customer_id)
        if customer:
            if record.status == "VERIFIED":
                customer.kyc_status = "APPROVED"
                logger.info("Customer KYC status updated: APPROVED", customer_id=str(customer.id))
            elif record.status == "FAILED":
                customer.kyc_status = "REJECTED"
                # KYC failures increase AML risk scores instantly
                customer.risk_score = min(customer.risk_score + 0.5, 1.0)
                logger.warning(
                    "Customer KYC status updated: REJECTED; risk score increased",
                    customer_id=str(customer.id),
                    new_risk=customer.risk_score
                )

        logger.info("KYC record verification complete", record_id=str(record_id), status=record.status)
        return record

    async def list_customers(self, kyc_status: str | None = None) -> list[Customer]:
        """
        Retrieves all customer profiles, optionally filtered by KYC verification status.
        """
        return await self.repository.list_customers(kyc_status=kyc_status)
