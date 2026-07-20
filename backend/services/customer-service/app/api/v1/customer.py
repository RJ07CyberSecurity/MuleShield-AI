from fastapi import APIRouter, Depends, Request, status
import uuid
from app.schemas.customer import (
    CustomerCreateRequest,
    CustomerResponse,
    KYCSubmitRequest,
    KYCRecordResponse,
    KYCVerifyRequest
)
from app.dependencies.customer import get_customer_service
from app.dependencies.auth import get_token_claims, RoleChecker
from app.services.customer_service import CustomerService
from shared.schemas import ResponseEnvelope

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("", response_model=ResponseEnvelope[CustomerResponse], status_code=status.HTTP_201_CREATED)
async def create_customer(
    request: Request,
    payload: CustomerCreateRequest,
    service: CustomerService = Depends(get_customer_service),
    claims: dict = Depends(get_token_claims)  # Requires valid JWT session
) -> ResponseEnvelope[CustomerResponse]:
    """
    Registers a new bank customer. (Requires general authentication).
    """
    customer = await service.register_customer(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        phone=payload.phone
    )
    await service.repository.session.commit()
    
    return ResponseEnvelope(
        success=True,
        message="Customer profile created successfully.",
        data=CustomerResponse.model_validate(customer),
        request_id=request.state.request_id
    )


@router.get("", response_model=ResponseEnvelope[list[CustomerResponse]])
async def list_customers(
    request: Request,
    kyc_status: str | None = None,
    service: CustomerService = Depends(get_customer_service),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[list[CustomerResponse]]:
    """
    Returns registered bank customers, optionally filtered by KYC verification state.
    """
    customers = await service.list_customers(kyc_status=kyc_status)
    return ResponseEnvelope(
        success=True,
        message="Customer profiles retrieved.",
        data=[CustomerResponse.model_validate(c) for c in customers],
        request_id=request.state.request_id
    )


@router.get("/{id}", response_model=ResponseEnvelope[CustomerResponse])
async def get_customer(
    request: Request,
    id: uuid.UUID,
    service: CustomerService = Depends(get_customer_service),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[CustomerResponse]:
    """
    Retrieves detailed customer profile by UUID.
    """
    customer = await service.repository.get_customer_by_id(id)
    if not customer:
        from shared.exceptions import NotFoundException
        raise NotFoundException("Customer profile not found.")
        
    return ResponseEnvelope(
        success=True,
        message="Customer profile retrieved.",
        data=CustomerResponse.model_validate(customer),
        request_id=request.state.request_id
    )


@router.post("/{id}/kyc", response_model=ResponseEnvelope[KYCRecordResponse], status_code=status.HTTP_201_CREATED)
async def submit_kyc(
    request: Request,
    id: uuid.UUID,
    payload: KYCSubmitRequest,
    service: CustomerService = Depends(get_customer_service),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[KYCRecordResponse]:
    """
    Submits identity documents (passport, national ID, drivers license) for verification.
    """
    record = await service.submit_kyc_document(
        customer_id=id,
        document_type=payload.document_type,
        document_number=payload.document_number
    )
    await service.repository.session.commit()
    
    return ResponseEnvelope(
        success=True,
        message="KYC document uploaded. Pending review.",
        data=KYCRecordResponse.model_validate(record),
        request_id=request.state.request_id
    )


@router.post("/kyc/{record_id}/verify", response_model=ResponseEnvelope[KYCRecordResponse])
async def verify_kyc(
    request: Request,
    record_id: uuid.UUID,
    payload: KYCVerifyRequest,
    service: CustomerService = Depends(get_customer_service),
    authorized: bool = Depends(RoleChecker(["investigator", "compliance_officer"]))
) -> ResponseEnvelope[KYCRecordResponse]:
    """
    Audits a KYC document verification. (Restricted to compliance auditors/investigators).
    """
    record = await service.verify_kyc_record(
        record_id=record_id,
        status=payload.status,
        notes=payload.notes
    )
    await service.repository.session.commit()
    
    return ResponseEnvelope(
        success=True,
        message=f"KYC document has been verified as '{payload.status}'.",
        data=KYCRecordResponse.model_validate(record),
        request_id=request.state.request_id
    )
