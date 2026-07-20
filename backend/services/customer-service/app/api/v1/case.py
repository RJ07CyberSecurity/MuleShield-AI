from fastapi import APIRouter, Depends, Request, status, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.case import Case, CaseNote, CaseTimeline
from app.schemas.case import CaseResponse, CaseStatusUpdateRequest, CaseNoteCreateRequest
from app.dependencies.auth import get_token_claims
from shared.database import get_db_session, Account, AuditLog
from shared.schemas import ResponseEnvelope

router = APIRouter(prefix="", tags=["Cases"])

@router.get("/cases", response_model=ResponseEnvelope[list[CaseResponse]])
async def list_cases(
    request: Request,
    status: str | None = None,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[list[CaseResponse]]:
    """
    Retrieves compliance cases, optionally filtered by status.
    """
    stmt = select(Case)
    if status:
        stmt = stmt.where(Case.status == status.upper().strip())
        
    result = await session.execute(stmt)
    cases = result.scalars().all()
    
    return ResponseEnvelope(
        success=True,
        message="Compliance cases retrieved.",
        data=[CaseResponse.model_validate(c) for c in cases],
        request_id=request.state.request_id
    )

@router.get("/cases/{id}", response_model=ResponseEnvelope[CaseResponse])
async def get_case(
    request: Request,
    id: str,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[CaseResponse]:
    """
    Retrieves details of a specific compliance case folder.
    """
    import uuid
    try:
        case_uuid = uuid.UUID(id)
    except ValueError:
        from shared.exceptions import NotFoundException
        raise NotFoundException("Case not found (invalid UUID format).")

    result = await session.execute(select(Case).where(Case.id == case_uuid))
    case = result.scalars().first()
    if not case:
        from shared.exceptions import NotFoundException
        raise NotFoundException("Case not found.")
        
    # Write audit log for case lookup (capturing lookups, PII reveal indicator)
    import json
    from datetime import datetime
    user_id_str = claims.get("sub")
    user_uuid = uuid.UUID(user_id_str) if user_id_str else uuid.uuid4()
    
    audit = AuditLog(
        id=uuid.uuid4(),
        actor_id=user_uuid,
        action="PII_REVEAL",
        target_entity="Case",
        target_id=case.id,
        old_state=None,
        new_state=json.dumps({"viewed_at": datetime.utcnow().isoformat()}),
        timestamp=datetime.utcnow()
    )
    session.add(audit)
    await session.commit()
        
    return ResponseEnvelope(
        success=True,
        message="Case details retrieved.",
        data=CaseResponse.model_validate(case),
        request_id=request.state.request_id
    )


@router.post("/cases/{id}/status", response_model=ResponseEnvelope[CaseResponse])
async def update_case_status(
    request: Request,
    id: str,
    payload: CaseStatusUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[CaseResponse]:
    """
    Updates the workflow status of a specific compliance case.
    """
    import uuid
    try:
        case_uuid = uuid.UUID(id)
    except ValueError:
        from shared.exceptions import NotFoundException
        raise NotFoundException("Case not found (invalid UUID format).")

    result = await session.execute(select(Case).where(Case.id == case_uuid))
    case = result.scalars().first()
    if not case:
        from shared.exceptions import NotFoundException
        raise NotFoundException("Case not found.")

    old_status = case.status
    case.status = payload.status.upper().strip()
    case.version += 1

    # Audit timeline entry
    user_id_str = claims.get("sub")
    user_uuid = uuid.UUID(user_id_str) if user_id_str else uuid.uuid4()
    
    timeline_entry = CaseTimeline(
        case_id=case.id,
        event_type="STATUS_CHANGE",
        description=f"Status updated from {old_status} to {case.status}.",
        created_by=user_uuid
    )
    session.add(timeline_entry)
    
    # Save immutable audit log entry
    import json
    from datetime import datetime
    audit = AuditLog(
        id=uuid.uuid4(),
        actor_id=user_uuid,
        action="CASE_STATUS_UPDATE",
        target_entity="Case",
        target_id=case.id,
        old_state=json.dumps({"status": old_status}),
        new_state=json.dumps({"status": case.status}),
        timestamp=datetime.utcnow()
    )
    session.add(audit)
    await session.commit()

    return ResponseEnvelope(
        success=True,
        message="Case status updated successfully.",
        data=CaseResponse.model_validate(case),
        request_id=request.state.request_id
    )


@router.post("/cases/{id}/notes", response_model=ResponseEnvelope[dict])
async def add_case_note(
    request: Request,
    id: str,
    payload: CaseNoteCreateRequest,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[dict]:
    """
    Appends an investigator note to a specific compliance case folder.
    """
    import uuid
    try:
        case_uuid = uuid.UUID(id)
    except ValueError:
        from shared.exceptions import NotFoundException
        raise NotFoundException("Case not found (invalid UUID format).")

    result = await session.execute(select(Case).where(Case.id == case_uuid))
    case = result.scalars().first()
    if not case:
        from shared.exceptions import NotFoundException
        raise NotFoundException("Case not found.")

    user_id_str = claims.get("sub")
    user_uuid = uuid.UUID(user_id_str) if user_id_str else uuid.uuid4()

    new_note = CaseNote(
        case_id=case.id,
        analyst_id=user_uuid,
        analyst_name="Sarah Chambers" if user_id_str else "System Analyst",
        note=payload.text.strip()
    )
    session.add(new_note)

    timeline_entry = CaseTimeline(
        case_id=case.id,
        event_type="NOTE_ADDED",
        description="Analyst added a new note to this case.",
        created_by=user_uuid
    )
    session.add(timeline_entry)
    await session.commit()

    return ResponseEnvelope(
        success=True,
        message="Note added successfully.",
        data={
            "id": str(new_note.id),
            "created_at": new_note.created_at.isoformat()
        },
        request_id=request.state.request_id
    )


@router.post("/cases/{id}/freeze-account", response_model=ResponseEnvelope[dict])
async def freeze_account_flow(
    request: Request,
    id: str,
    payload: dict,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims)
) -> ResponseEnvelope[dict]:
    """
    Enforces compliance officer human-in-the-loop verification to freeze an account.
    """
    # Enforce RBAC
    user_roles = [r.lower() for r in claims.get("roles", [])]
    # Check mappings for compliance officer or admin
    is_authorized = any(r in user_roles for r in ["officer", "compliance_officer", "administrator", "admin"])
    
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only authorized compliance officers or administrators can approve account freezes."
        )
        
    legal_ref = payload.get("legal_reference")
    acct_num = payload.get("account_number")
    if not legal_ref or not acct_num:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account number and legal reference reasons must be supplied."
        )
        
    # Check if case exists
    import uuid
    try:
        case_uuid = uuid.UUID(id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid case UUID format.")
        
    result = await session.execute(select(Case).where(Case.id == case_uuid))
    case = result.scalars().first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
        
    # Check if account exists
    acct_stmt = select(Account).where(Account.account_number == acct_num)
    acct_res = await session.execute(acct_stmt)
    account = acct_res.scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")
        
    # Freeze
    old_status = account.status
    account.status = "FROZEN"
    
    user_id_str = claims.get("sub")
    user_uuid = uuid.UUID(user_id_str) if user_id_str else uuid.uuid4()
    
    timeline_entry = CaseTimeline(
        case_id=case.id,
        event_type="ACCOUNT_FREEZE",
        description=f"Account {acct_num} frozen under legal reference {legal_ref}.",
        created_by=user_uuid
    )
    session.add(timeline_entry)
    
    # Save audit log
    import json
    from datetime import datetime
    audit = AuditLog(
        id=uuid.uuid4(),
        actor_id=user_uuid,
        action="ACCOUNT_FREEZE",
        target_entity="Account",
        target_id=account.id,
        old_state=json.dumps({"status": old_status}),
        new_state=json.dumps({"status": "FROZEN", "legal_reference": legal_ref}),
        timestamp=datetime.utcnow()
    )
    session.add(audit)
    await session.commit()
    
    return ResponseEnvelope(
        success=True,
        message="Account frozen successfully under legal authorization.",
        data={
            "account_number": acct_num,
            "status": "FROZEN",
            "legal_reference": legal_ref
        },
        request_id=request.state.request_id
    )
