from fastapi import APIRouter, Depends, Request, status
import uuid
from app.schemas.account import (
    AccountCreateRequest,
    AccountResponse,
    AccountFreezeRequest
)
from app.dependencies.account import get_account_service
from app.dependencies.auth import get_token_claims, RoleChecker
from app.services.account_service import AccountService
from shared.schemas import ResponseEnvelope

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.post("", response_model=ResponseEnvelope[AccountResponse], status_code=status.HTTP_201_CREATED)
async def create_account(
    request: Request,
    payload: AccountCreateRequest,
    service: AccountService = Depends(get_account_service),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[AccountResponse]:
    """
    Opens a new checking or savings bank account. (Requires general authentication).
    """
    account = await service.open_account(
        customer_id=payload.customer_id,
        type_=payload.type,
        currency=payload.currency
    )
    await service.repository.session.commit()
    
    return ResponseEnvelope(
        success=True,
        message="Bank account opened successfully.",
        data=AccountResponse.model_validate(account),
        request_id=request.state.request_id
    )


@router.get("", response_model=ResponseEnvelope[list[AccountResponse]])
async def list_accounts(
    request: Request,
    customer_id: uuid.UUID | None = None,
    service: AccountService = Depends(get_account_service),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[list[AccountResponse]]:
    """
    Returns registered accounts, optionally filtered by customer UUID.
    """
    accounts = await service.list_accounts(customer_id=customer_id)
    return ResponseEnvelope(
        success=True,
        message="Bank accounts retrieved.",
        data=[AccountResponse.model_validate(a) for a in accounts],
        request_id=request.state.request_id
    )


@router.get("/{id}", response_model=ResponseEnvelope[AccountResponse])
async def get_account(
    request: Request,
    id: uuid.UUID,
    service: AccountService = Depends(get_account_service),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[AccountResponse]:
    """
    Retrieves detailed bank account profile by UUID.
    """
    account = await service.repository.get_account_by_id(id)
    if not account:
        from shared.exceptions import NotFoundException
        raise NotFoundException("Bank account record not found.")
        
    return ResponseEnvelope(
        success=True,
        message="Account record retrieved.",
        data=AccountResponse.model_validate(account),
        request_id=request.state.request_id
    )


@router.post("/{id}/freeze", response_model=ResponseEnvelope[AccountResponse])
async def freeze_account(
    request: Request,
    id: uuid.UUID,
    payload: AccountFreezeRequest,
    service: AccountService = Depends(get_account_service),
    authorized: bool = Depends(RoleChecker(["investigator", "compliance_officer"]))
) -> ResponseEnvelope[AccountResponse]:
    """
    Locks a bank account, blocking transaction operations. (Restricted to investigators/compliance officers).
    """
    account = await service.freeze_account(account_id=id, reason=payload.reason)
    await service.repository.session.commit()
    
    return ResponseEnvelope(
        success=True,
        message="Bank account has been successfully FROZEN.",
        data=AccountResponse.model_validate(account),
        request_id=request.state.request_id
    )


@router.post("/{id}/unfreeze", response_model=ResponseEnvelope[AccountResponse])
async def unfreeze_account(
    request: Request,
    id: uuid.UUID,
    payload: AccountFreezeRequest,
    service: AccountService = Depends(get_account_service),
    authorized: bool = Depends(RoleChecker(["compliance_officer"]))
) -> ResponseEnvelope[AccountResponse]:
    """
    Unlocks a bank account, restoring active transaction status. (Restricted to compliance officers).
    """
    account = await service.unfreeze_account(account_id=id, reason=payload.reason)
    await service.repository.session.commit()
    
    return ResponseEnvelope(
        success=True,
        message="Bank account has been successfully unfrozen and returned to ACTIVE status.",
        data=AccountResponse.model_validate(account),
        request_id=request.state.request_id
    )
