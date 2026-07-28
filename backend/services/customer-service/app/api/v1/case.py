import asyncio
import json
import uuid
from datetime import datetime
import os
import shutil
from fastapi import APIRouter, Depends, Request, status, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.models.case import Case, CaseNote, CaseTimeline, EvidenceFile
from app.schemas.case import (
    CaseResponse,
    CaseStatusUpdateRequest,
    CaseNoteCreateRequest,
    CaseCreateRequest,
    CaseUpdateRequest,
)
from app.dependencies.auth import get_token_claims
from shared.database import get_db_session, Account, AuditLog
from shared.schemas import ResponseEnvelope
from app.api.v1.websocket import manager

router = APIRouter(prefix="", tags=["Cases"])


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _build_case_response(case) -> CaseResponse:
    """Build a CaseResponse, populating customer_id from the linked Alert if available."""
    resp = CaseResponse.model_validate(case)
    # Case has no direct customer_id column — traverse Case → Alert → customer_id
    if case.alert and case.alert.customer_id:
        resp.customer_id = case.alert.customer_id
        
    # Map evidence to response
    evidence_list = []
    if hasattr(case, 'evidence') and case.evidence:
        for ev in case.evidence:
            evidence_list.append({
                "id": str(ev.id),
                "filename": ev.file_name,
                "type": ev.content_type,
                "size": ev.file_size,
                "uploadedBy": str(ev.uploaded_by),
                "uploadDate": ev.uploaded_at.isoformat()
            })
    resp.evidence = evidence_list
    
    return resp


async def _write_audit(
    session: AsyncSession,
    actor_id: uuid.UUID,
    action: str,
    entity_id: uuid.UUID,
    before: dict | None = None,
    after: dict | None = None,
):
    audit = AuditLog(
        id=uuid.uuid4(),
        actor_id=actor_id,
        action=action,
        entity_type="Case",
        entity_id=entity_id,
        before_state=json.dumps(before) if before else None,
        after_state=json.dumps(after) if after else None,
        timestamp=datetime.utcnow(),
    )
    session.add(audit)


# ─────────────────────────────────────────────────────────────────────────────
# POST /cases — Create a new shared investigation case
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/cases", response_model=ResponseEnvelope[CaseResponse])
async def create_case(
    request: Request,
    payload: CaseCreateRequest,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims),
) -> ResponseEnvelope[CaseResponse]:
    """
    Creates a new compliance case visible to all authorised investigators.
    Broadcasts a case_created event to all connected WebSocket clients.
    """
    owner_id = request.headers.get("x-user-id")
    
    # Prevent duplicate escalation if alert_id is provided
    if payload.alert_id:
        existing = await session.execute(
            select(Case).where(Case.alert_id == payload.alert_id)
        )
        existing_case = existing.scalars().first()
        if existing_case:
            return ResponseEnvelope(
                success=True,
                message="Investigation already exists for this alert.",
                data=_build_case_response(existing_case),
                request_id=request.state.request_id,
            )

    new_case = Case(
        id=uuid.uuid4(),
        owner_id=owner_id,           # retained for audit/attribution, NOT used as a filter
        status=payload.status,
        notes=payload.notes or "Manually registered case.",
        recommended_action=payload.recommended_action or "PENDING_REVIEW",
        escalation_status=payload.escalation_status,
        escalated_by=payload.escalated_by or (owner_id if payload.escalation_status else None),
        alert_id=payload.alert_id,
        title=payload.title,
        customer_name=payload.customer_name,
        customer_id=payload.customer_id,
        priority=payload.priority,
        stage=payload.stage,
        risk_score=payload.risk_score,
        ai_confidence=payload.ai_confidence
    )
    session.add(new_case)
    await session.commit()
    await session.refresh(new_case)

    # Re-fetch with relations for the response payload
    result = await session.execute(
        select(Case)
        .where(Case.id == new_case.id)
        .options(selectinload(Case.alert), selectinload(Case.case_notes), selectinload(Case.timeline), selectinload(Case.evidence))
    )
    new_case = result.scalars().first()

    user_id_str = claims.get("sub")
    user_uuid = uuid.UUID(user_id_str) if user_id_str else uuid.uuid4()
    await _write_audit(session, user_uuid, "CASE_CREATE", new_case.id, after={"status": new_case.status})
    await session.commit()

    case_data = _build_case_response(new_case)

    # ── Real-time broadcast ───────────────────────────────────────────────────
    asyncio.create_task(manager.broadcast({
        "type": "case_created",
        "data": case_data.model_dump(mode="json"),
    }))

    return ResponseEnvelope(
        success=True,
        message="Case successfully registered.",
        data=case_data,
        request_id=request.state.request_id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /cases — Shared case list (all authenticated users see the same data)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/cases", response_model=ResponseEnvelope[list[CaseResponse]])
async def list_cases(
    request: Request,
    status: str | None = None,
    location: str | None = None,
    min_size: float | None = None,
    max_size: float | None = None,
    account_type: str | None = None,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims),
) -> ResponseEnvelope[list[CaseResponse]]:
    """
    Retrieves ALL shared investigation cases visible to every authorised user.
    The legacy per-user owner_id filter has been removed; cases are system-wide entities.
    """
    from shared.database.models import Account, Customer, Alert

    # Base query — NO owner_id filter. Every authenticated user sees every case.
    stmt = (
        select(Case)
        .options(
            selectinload(Case.alert),
            selectinload(Case.case_notes),
            selectinload(Case.timeline),
            selectinload(Case.evidence)
        )
        .order_by(Case.created_at.desc())
    )

    # Optional filters (preserved from original)
    needs_alert_join = location is not None or account_type is not None or min_size is not None or max_size is not None
    if needs_alert_join:
        stmt = stmt.join(Alert, Case.alert_id == Alert.id)

    needs_account_join = account_type is not None or min_size is not None or max_size is not None
    if needs_account_join:
        stmt = stmt.join(Account, Alert.account_id == Account.id)
        if account_type:
            stmt = stmt.where(Account.account_type == account_type.upper().strip())
        if min_size is not None:
            stmt = stmt.where(Account.balance >= min_size)
        if max_size is not None:
            stmt = stmt.where(Account.balance <= max_size)

    if location:
        stmt = stmt.join(Customer, Alert.customer_id == Customer.id)
        stmt = stmt.where(Customer.address.ilike(f"%{location}%"))

    if status:
        stmt = stmt.where(Case.status == status.upper().strip())

    result = await session.execute(stmt)
    cases = result.scalars().all()

    return ResponseEnvelope(
        success=True,
        message="Shared investigation cases retrieved.",
        data=[_build_case_response(c) for c in cases],
        request_id=request.state.request_id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /cases/{id} — Case detail (any authenticated user)
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/cases/{id}", response_model=ResponseEnvelope[CaseResponse])
async def get_case(
    request: Request,
    id: str,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims),
) -> ResponseEnvelope[CaseResponse]:
    """
    Retrieves details of a specific compliance case. Any authenticated user may view any case.
    """
    from shared.database.models import Account, Alert

    case = None
    try:
        case_uuid = uuid.UUID(id)
        # Shared: no owner_id filter
        result = await session.execute(
            select(Case)
            .where(Case.id == case_uuid)
            .options(
                selectinload(Case.alert),
                selectinload(Case.case_notes),
                selectinload(Case.timeline),
                selectinload(Case.evidence)
            )
        )
        case = result.scalars().first()
    except ValueError:
        # Fallback: look up latest case by Account Number
        stmt = (
            select(Case)
            .join(Alert, Case.alert_id == Alert.id)
            .join(Account, Alert.account_id == Account.id)
            .where(Account.account_number == id)
            .options(selectinload(Case.alert))
            .order_by(Case.created_at.desc())
        )
        result = await session.execute(stmt)
        case = result.scalars().first()

        if not case:
            # Auto-create case for investigation if none exists but an alert is present
            alert_stmt = (
                select(Alert)
                .join(Account, Alert.account_id == Account.id)
                .where(Account.account_number == id)
            )
            alert_res = await session.execute(alert_stmt.order_by(Alert.created_at.desc()))
            alert = alert_res.scalars().first()
            if alert:
                owner_id = request.headers.get("x-user-id")
                case = Case(
                    id=uuid.uuid4(),
                    owner_id=owner_id,
                    alert_id=alert.id,
                    status="OPEN",
                    notes="Auto-generated investigation dossier for flagged account.",
                    recommended_action="PENDING_REVIEW",
                )
                session.add(case)
                await session.commit()

                result = await session.execute(
                    select(Case).where(Case.id == case.id).options(selectinload(Case.alert))
                )
                case = result.scalars().first()

    if not case:
        # Dynamic counterparty case (external account not in DB)
        from shared.database.models import Transaction
        from sqlalchemy import func

        case_id = uuid.uuid4()
        out_res = await session.execute(select(func.sum(Transaction.amount)).where(Transaction.sender_account == id))
        total_outflow = out_res.scalar() or 0.0
        in_res = await session.execute(select(func.sum(Transaction.amount)).where(Transaction.receiver_account == id))
        total_inflow = in_res.scalar() or 0.0

        dynamic_case = CaseResponse(
            id=case_id,
            customer_id=None,
            alert_id=uuid.uuid4(),
            status="OPEN",
            notes="External Counterparty mapped from transaction relationships. Deep investigation view enabled.",
            recommended_action="MONITOR",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        setattr(dynamic_case, "financial_telemetry", {
            "current_balance": total_inflow - total_outflow,
            "total_inflow": total_inflow,
            "total_outflow": total_outflow,
            "velocity_increase": 0,
        })
        setattr(dynamic_case, "subject_profile", {
            "name": f"Counterparty {id[:15]}",
            "email": "external@unknown.net",
            "phone": "Unknown",
            "occupation": "Unverified Counterparty",
            "income": 0,
            "onboarding_date": "N/A",
            "kyc_status": "UNVERIFIED",
        })
        return ResponseEnvelope(
            success=True,
            message="Dynamic Counterparty Case retrieved.",
            data=dynamic_case,
            request_id=request.state.request_id,
        )

    # Audit: case viewed
    user_id_str = claims.get("sub")
    user_uuid = uuid.UUID(user_id_str) if user_id_str else uuid.uuid4()
    await _write_audit(session, user_uuid, "CASE_VIEW", case.id, after={"viewed_at": datetime.utcnow().isoformat()})
    await session.commit()

    response_data = _build_case_response(case)

    # Attach financial telemetry
    from shared.database.models import Transaction, Account, Customer
    from sqlalchemy import func

    acct_num = case.alert.account.account_number if (case.alert and case.alert.account) else None
    if acct_num:
        out_res = await session.execute(select(func.sum(Transaction.amount)).where(Transaction.sender_account == acct_num))
        total_outflow = out_res.scalar() or 0.0
        in_res = await session.execute(select(func.sum(Transaction.amount)).where(Transaction.receiver_account == acct_num))
        total_inflow = in_res.scalar() or 0.0

        cust_info = {}
        if case.alert and case.alert.account and case.alert.account.customer_id:
            cust_res = await session.execute(select(Customer).where(Customer.id == case.alert.account.customer_id))
            cust = cust_res.scalars().first()
            if cust:
                cust_info = {
                    "name": cust.full_name,
                    "email": cust.email,
                    "phone": cust.mobile,
                    "occupation": cust.occupation,
                    "income": float(cust.annual_income),
                    "onboarding_date": "12 MAR 2021",
                }

        setattr(response_data, "financial_telemetry", {
            "current_balance": total_inflow - total_outflow,
            "total_inflow": total_inflow,
            "total_outflow": total_outflow,
            "velocity_increase": 245,
        })
        setattr(response_data, "subject_profile", cust_info)

    return ResponseEnvelope(
        success=True,
        message="Case details retrieved.",
        data=response_data,
        request_id=request.state.request_id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /cases/{id}/status — Update status and broadcast
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/cases/{id}/status", response_model=ResponseEnvelope[CaseResponse])
async def update_case_status(
    request: Request,
    id: str,
    payload: CaseStatusUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims),
) -> ResponseEnvelope[CaseResponse]:
    """
    Updates the workflow status of a specific compliance case and broadcasts the change.
    """
    from shared.database.models import Account, Alert

    case = None
    try:
        case_uuid = uuid.UUID(id)
        result = await session.execute(
            select(Case).where(Case.id == case_uuid).options(selectinload(Case.alert))
        )
        case = result.scalars().first()
    except ValueError:
        result = await session.execute(
            select(Case)
            .join(Alert, Case.alert_id == Alert.id)
            .join(Account, Alert.account_id == Account.id)
            .where(Account.account_number == id)
            .order_by(Case.created_at.desc())
            .options(selectinload(Case.alert))
        )
        case = result.scalars().first()

    if not case:
        from shared.exceptions import NotFoundException
        raise NotFoundException("Case not found.")

    old_status = case.status
    new_status = payload.status.upper().strip()
    case.status = new_status

    user_id_str = claims.get("sub")
    user_uuid = uuid.UUID(user_id_str) if user_id_str else uuid.uuid4()

    timeline_entry = CaseTimeline(
        case_id=case.id,
        event_type="STATUS_CHANGE",
        description=f"Status updated from {old_status} to {new_status}.",
        created_by=user_uuid,
    )
    session.add(timeline_entry)
    await _write_audit(session, user_uuid, "CASE_STATUS_UPDATE", case.id,
                       before={"status": old_status}, after={"status": new_status})
    await session.commit()
    await session.refresh(case)

    case_data = _build_case_response(case)

    # Determine event type for rich client-side routing
    if new_status == "CLOSED":
        event_type = "case_closed"
    elif old_status == "CLOSED":
        event_type = "case_reopened"
    else:
        event_type = "case_updated"

    asyncio.create_task(manager.broadcast({
        "type": event_type,
        "case_id": str(case.id),
        "data": case_data.model_dump(mode="json"),
    }))

    return ResponseEnvelope(
        success=True,
        message="Case status updated successfully.",
        data=case_data,
        request_id=request.state.request_id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /cases/{id}/notes — Add investigator note and broadcast
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/cases/{id}/notes", response_model=ResponseEnvelope[dict])
async def add_case_note(
    request: Request,
    id: str,
    payload: CaseNoteCreateRequest,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims),
) -> ResponseEnvelope[dict]:
    """
    Appends an investigator note to a compliance case and broadcasts the event.
    """
    from shared.database.models import Account, Alert

    case = None
    try:
        case_uuid = uuid.UUID(id)
        result = await session.execute(select(Case).where(Case.id == case_uuid))
        case = result.scalars().first()
    except ValueError:
        result = await session.execute(
            select(Case)
            .join(Alert, Case.alert_id == Alert.id)
            .join(Account, Alert.account_id == Account.id)
            .where(Account.account_number == id)
            .order_by(Case.created_at.desc())
        )
        case = result.scalars().first()

    if not case:
        from shared.exceptions import NotFoundException
        raise NotFoundException("Case not found.")

    user_id_str = claims.get("sub")
    user_uuid = uuid.UUID(user_id_str) if user_id_str else uuid.uuid4()

    # Derive analyst display name from JWT claims
    first = claims.get("first_name", "")
    last = claims.get("last_name", "")
    email = claims.get("email", "")
    if first or last:
        analyst_name = f"{first} {last}".strip()
    elif email:
        analyst_name = email.split("@")[0].title()
    else:
        analyst_name = "System Analyst"

    new_note = CaseNote(
        case_id=case.id,
        analyst_id=user_uuid,
        analyst_name=analyst_name,
        note=payload.text.strip(),
    )
    session.add(new_note)

    timeline_entry = CaseTimeline(
        case_id=case.id,
        event_type="NOTE_ADDED",
        description=f"{analyst_name} added an investigation note.",
        created_by=user_uuid,
    )
    session.add(timeline_entry)
    await session.commit()

    note_payload = {
        "id": str(new_note.id),
        "investigator": analyst_name,
        "timestamp": new_note.created_at.isoformat(),
        "text": new_note.note,
    }

    asyncio.create_task(manager.broadcast({
        "type": "case_note_added",
        "case_id": str(case.id),
        "note": note_payload,
    }))

    return ResponseEnvelope(
        success=True,
        message="Note added successfully.",
        data=note_payload,
        request_id=request.state.request_id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /cases/{id}/freeze-account — Preserved as-is
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/cases/{id}/freeze-account", response_model=ResponseEnvelope[dict])
async def freeze_account_flow(
    request: Request,
    id: str,
    payload: dict,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims),
) -> ResponseEnvelope[dict]:
    """
    Enforces compliance officer human-in-the-loop verification to freeze an account.
    """
    user_roles = [r.lower() for r in claims.get("roles", [])]
    is_authorized = any(r in user_roles for r in ["officer", "compliance_officer", "administrator", "admin"])

    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only authorized compliance officers or administrators can approve account freezes.",
        )

    legal_ref = payload.get("legal_reference")
    acct_num = payload.get("account_number")
    if not legal_ref or not acct_num:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account number and legal reference reasons must be supplied.",
        )

    from shared.database.models import Account, Alert

    case = None
    try:
        case_uuid = uuid.UUID(id)
        result = await session.execute(select(Case).where(Case.id == case_uuid))
        case = result.scalars().first()
    except ValueError:
        result = await session.execute(
            select(Case)
            .join(Alert, Case.alert_id == Alert.id)
            .join(Account, Alert.account_id == Account.id)
            .where(Account.account_number == id)
            .order_by(Case.created_at.desc())
        )
        case = result.scalars().first()

    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")

    acct_res = await session.execute(select(Account).where(Account.account_number == acct_num))
    account = acct_res.scalars().first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")

    old_status = account.status
    account.status = "FROZEN"

    user_id_str = claims.get("sub")
    user_uuid = uuid.UUID(user_id_str) if user_id_str else uuid.uuid4()

    timeline_entry = CaseTimeline(
        case_id=case.id,
        event_type="ACCOUNT_FREEZE",
        description=f"Account {acct_num} frozen under legal reference {legal_ref}.",
        created_by=user_uuid,
    )
    session.add(timeline_entry)
    await _write_audit(session, user_uuid, "ACCOUNT_FREEZE", account.id,
                       before={"status": old_status}, after={"status": "FROZEN", "legal_reference": legal_ref})
    await session.commit()

    asyncio.create_task(manager.broadcast({
        "type": "case_updated",
        "case_id": str(case.id),
        "action": "account_frozen",
        "account_number": acct_num,
    }))

    return ResponseEnvelope(
        success=True,
        message="Account frozen successfully under legal authorization.",
        data={"account_number": acct_num, "status": "FROZEN", "legal_reference": legal_ref},
        request_id=request.state.request_id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /cases/{case_id}/assign — Assign and broadcast
# ─────────────────────────────────────────────────────────────────────────────

class AssignRequest(BaseModel):
    officer_id: str


@router.patch("/cases/{case_id}/assign", response_model=ResponseEnvelope[CaseResponse])
async def assign_case(
    case_id: str,
    payload: AssignRequest,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims),
):
    roles = claims.get("roles", [])
    if "Read-Only" in roles:
        raise HTTPException(status_code=403, detail="Read-only users cannot assign cases")

    case = await session.get(Case, uuid.UUID(case_id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    old_officer = str(case.officer_id) if case.officer_id else None
    case.officer_id = uuid.UUID(payload.officer_id)
    await session.commit()
    await session.refresh(case)

    case_data = _build_case_response(case)

    asyncio.create_task(manager.broadcast({
        "type": "case_assigned",
        "case_id": str(case.id),
        "assigned_to": str(case.officer_id),
        "reassigned_from": old_officer,
        "data": case_data.model_dump(mode="json"),
    }))

    return ResponseEnvelope(
        success=True,
        message="Case assigned successfully.",
        data=case_data,
        request_id=request.state.request_id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# PATCH /cases/{case_id}/escalate — Escalate and broadcast
# ─────────────────────────────────────────────────────────────────────────────

class EscalateRequest(BaseModel):
    escalation_level: str
    reason: str
    escalated_to: str


@router.patch("/cases/{case_id}/escalate", response_model=ResponseEnvelope[CaseResponse])
async def escalate_case(
    case_id: str,
    payload: EscalateRequest,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims),
):
    roles = claims.get("roles", [])
    if "Read-Only" in roles or "Analyst" in roles:
        raise HTTPException(status_code=403, detail="Unauthorized to escalate cases")

    case = await session.get(Case, uuid.UUID(case_id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    case.escalation_status = payload.escalation_level
    case.escalated_by = claims.get("sub", "unknown")
    case.escalated_to = payload.escalated_to
    await session.commit()
    await session.refresh(case)

    case_data = _build_case_response(case)

    asyncio.create_task(manager.broadcast({
        "type": "case_escalated",
        "case_id": str(case.id),
        "escalation_level": payload.escalation_level,
        "escalated_to": payload.escalated_to,
        "reason": payload.reason,
        "data": case_data.model_dump(mode="json"),
    }))

    return ResponseEnvelope(
        success=True,
        message="Case escalated successfully.",
        data=case_data,
        request_id=request.state.request_id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /cases/{id}/evidence — Upload evidence
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/cases/{id}/evidence", response_model=ResponseEnvelope[CaseResponse])
async def upload_case_evidence(
    request: Request,
    id: str,
    file: UploadFile = File(...),
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims),
):
    """
    Uploads a file and attaches it as evidence to a case.
    """
    case = await session.get(Case, uuid.UUID(id))
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    user_id_str = claims.get("sub")
    user_uuid = uuid.UUID(user_id_str) if user_id_str else uuid.uuid4()

    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))), "uploads", "evidence")
    os.makedirs(upload_dir, exist_ok=True)

    file_uuid = uuid.uuid4()
    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{file_uuid}{file_ext}"
    file_path = os.path.join(upload_dir, safe_filename)

    file_size = 0
    with open(file_path, "wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024)
            if not chunk:
                break
            buffer.write(chunk)
            file_size += len(chunk)

    evidence = EvidenceFile(
        id=file_uuid,
        case_id=case.id,
        file_name=file.filename,
        file_path=file_path,
        file_size=file_size,
        content_type=file.content_type or "application/octet-stream",
        uploaded_by=user_uuid,
        uploaded_at=datetime.utcnow()
    )
    session.add(evidence)

    timeline_entry = CaseTimeline(
        case_id=case.id,
        event_type="EVIDENCE_UPLOADED",
        description=f"Evidence file '{file.filename}' uploaded.",
        created_by=user_uuid,
    )
    session.add(timeline_entry)
    await _write_audit(session, user_uuid, "EVIDENCE_UPLOAD", case.id,
                       after={"file_name": file.filename, "file_id": str(file_uuid)})
    await session.commit()
    await session.refresh(case)

    # Re-fetch to ensure relationships are loaded
    result = await session.execute(
        select(Case)
        .where(Case.id == case.id)
        .options(
            selectinload(Case.alert),
            selectinload(Case.case_notes),
            selectinload(Case.timeline),
            selectinload(Case.evidence)
        )
    )
    case = result.scalars().first()
    
    case_data = _build_case_response(case)

    asyncio.create_task(manager.broadcast({
        "type": "case_updated",
        "case_id": str(case.id),
        "data": case_data.model_dump(mode="json"),
    }))

    return ResponseEnvelope(
        success=True,
        message="Evidence uploaded successfully.",
        data=case_data,
        request_id=request.state.request_id,
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /cases/{id}/evidence/{evidence_id}/download — Download evidence
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/cases/{id}/evidence/{evidence_id}/download")
async def download_case_evidence(
    id: str,
    evidence_id: str,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims),
):
    """
    Downloads a previously uploaded evidence file.
    """
    evidence = await session.get(EvidenceFile, uuid.UUID(evidence_id))
    if not evidence or str(evidence.case_id) != id:
        raise HTTPException(status_code=404, detail="Evidence not found")

    if not os.path.exists(evidence.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(
        path=evidence.file_path,
        filename=evidence.file_name,
        media_type=evidence.content_type
    )

@router.patch("/cases/{id}", response_model=ResponseEnvelope[CaseResponse])
async def update_case(
    request: Request,
    id: str,
    payload: CaseUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
    claims: dict = Depends(get_token_claims),
) -> ResponseEnvelope[CaseResponse]:
    """
    Updates metadata on a compliance case and broadcasts the change.
    """
    from shared.database.models import Account, Alert

    try:
        case_uuid = uuid.UUID(id)
        result = await session.execute(
            select(Case).where(Case.id == case_uuid).options(
                selectinload(Case.alert),
                selectinload(Case.case_notes),
                selectinload(Case.timeline),
                selectinload(Case.evidence)
            )
        )
        case = result.scalars().first()
    except ValueError:
        return ResponseEnvelope(success=False, message="Invalid Case ID.")

    if not case:
        return ResponseEnvelope(success=False, message="Case not found.")

    updated_fields = {}
    if payload.status is not None:
        updated_fields['status'] = payload.status
        case.status = payload.status
    if payload.priority is not None:
        updated_fields['priority'] = payload.priority
        case.priority = payload.priority
    if payload.stage is not None:
        updated_fields['stage'] = payload.stage
        case.stage = payload.stage
    if payload.risk_score is not None:
        updated_fields['risk_score'] = payload.risk_score
        case.risk_score = payload.risk_score
    if payload.ai_confidence is not None:
        updated_fields['ai_confidence'] = payload.ai_confidence
        case.ai_confidence = payload.ai_confidence
    if payload.title is not None:
        updated_fields['title'] = payload.title
        case.title = payload.title
    if payload.customer_name is not None:
        updated_fields['customer_name'] = payload.customer_name
        case.customer_name = payload.customer_name

    await session.commit()
    await session.refresh(case)

    # Re-fetch with relations to ensure complete payload
    result = await session.execute(
        select(Case)
        .where(Case.id == case.id)
        .options(
            selectinload(Case.alert),
            selectinload(Case.case_notes),
            selectinload(Case.timeline),
            selectinload(Case.evidence)
        )
    )
    case = result.scalars().first()

    user_id_str = claims.get("sub")
    user_uuid = uuid.UUID(user_id_str) if user_id_str else uuid.uuid4()
    await _write_audit(session, user_uuid, "CASE_UPDATE", case.id, after=updated_fields)
    await session.commit()

    case_data = _build_case_response(case)

    asyncio.create_task(manager.broadcast({
        "type": "case_updated",
        "data": case_data.model_dump(mode="json"),
    }))

    return ResponseEnvelope(
        success=True,
        message="Case successfully updated.",
        data=case_data,
        request_id=request.state.request_id,
    )
