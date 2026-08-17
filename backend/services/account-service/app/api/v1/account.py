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
from shared.database.models import ProfileAccessLog

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


from app.schemas.profile import AccountProfileResponse

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
    owner_id = claims.get("sub")
    accounts = await service.list_accounts(customer_id=customer_id, owner_id=owner_id)
    return ResponseEnvelope(
        success=True,
        message="Bank accounts retrieved.",
        data=[AccountResponse.model_validate(a) for a in accounts],
        request_id=request.state.request_id
    )

@router.get("/{id}/profile", response_model=ResponseEnvelope[AccountProfileResponse])
async def get_account_profile(
    request: Request,
    id: uuid.UUID,
    service: AccountService = Depends(get_account_service),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[AccountProfileResponse]:
    """
    Retrieves detailed bank account profile including customer info and linked accounts.
    """
    account = await service.repository.get_account_by_id(id)
    if not account:
        from shared.exceptions import NotFoundException
        raise NotFoundException("Bank account record not found.")

    user_id = claims.get("sub")
    user_role = (claims.get("role") or "analyst").lower()
    is_privileged = user_role in ("administrator", "admin", "compliance_officer", "compliance_admin", "investigator")
    access_result = "denied" if (not is_privileged and account.owner_id != user_id) else "allowed"

    # Write audit log for EVERY access attempt (allowed AND denied)
    try:
        ip_addr = request.headers.get("x-forwarded-for") or (request.client.host if request.client else None)
        access_log = ProfileAccessLog(
            user_id=str(user_id) if user_id else None,
            ingestion_id=None,
            account_id=account.id,
            result=access_result,
            role_at_time=user_role,
            ip_address=str(ip_addr) if ip_addr else None,
        )
        service.repository.session.add(access_log)
        await service.repository.session.flush()
    except Exception as audit_err:
        import structlog
        structlog.get_logger(__name__).error("Failed to write ProfileAccessLog for account profile", error=str(audit_err))

    if access_result == "denied":
        await service.repository.session.commit()
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied to access this account profile."
        )

    profile_data = await service.get_account_profile(id)
    return ResponseEnvelope(
        success=True,
        message="Account profile retrieved.",
        data=AccountProfileResponse.model_validate(profile_data),
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

    user_id = claims.get("sub")
    user_role = (claims.get("role") or "analyst").lower()
    is_privileged = user_role in ("administrator", "admin", "compliance_officer", "compliance_admin", "investigator")
    if not is_privileged and account.owner_id != user_id:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied to access this account record."
        )
        
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
