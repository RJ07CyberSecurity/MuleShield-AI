from datetime import datetime
from decimal import Decimal
import hashlib
import io
import re
import uuid
import pandas as pd
import pdfplumber
import httpx
import structlog
from fastapi import APIRouter, Depends, Request, UploadFile, File, HTTPException, status, Form, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, or_, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column
from shared.database import get_db_session, Base, Transaction, Account, Alert, Customer, KYCRecord
from shared.schemas import ResponseEnvelope

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/ingestion", tags=["Ingestion"])

# Limit statement upload size to 25MB
MAX_FILE_SIZE = 25 * 1024 * 1024


class ConfirmResponse(BaseModel):
    ingestion_id: str
    confirmed_count: int
    detection_triggered: bool


class SummaryResponse(BaseModel):
    ingestion_id: str
    total_accounts: int
    total_transactions: int
    total_volume: float
    currency: str | None = None
    start_date: str
    end_date: str
    flagged_accounts_count: int


from app.api.v1.parsers import StatementParserFactory


@router.post("/upload")
async def upload_statement(
    request: Request,
    file: UploadFile = File(...),
    uploader_id: str | None = Form(None),
    db: AsyncSession = Depends(get_db_session)
) -> ResponseEnvelope[dict]:
    """
    Ingests and parses a statement (CSV/PDF), validates fields, staging them pending analyst confirm.
    """
    logger.info("Received statement file upload request", filename=file.filename)
    owner_id = request.headers.get("x-user-id")
    
    # Read size check
    contents = await file.read()
    
    # DEBUG: Save uploaded file to inspect
    with open("E:/MuleShieldAI/fixtures/last_uploaded.pdf", "wb") as f:
        f.write(contents)
        
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 25MB enterprise limits."
        )
        
    filename = file.filename.lower()
    try:
        parser = StatementParserFactory.get_parser(filename, contents)
        valid_rows, invalid_rows = parser.parse(contents)
    except Exception as exc:
        logger.error("Failed parsing statement statement", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Statement compilation parser error: {str(exc)}"
        )

    if not valid_rows:
        return ResponseEnvelope(
            success=False,
            message="No valid rows parsed from the uploaded statement file.",
            data={
                "ingestion_id": None,
                "valid_count": 0,
                "invalid_count": len(invalid_rows),
                "preview": [],
                "errors": invalid_rows
            },
            request_id=request.state.request_id
        )

    # Compute fingerprints and run deduplication check
    base_uuid = str(uuid.uuid4())
    actual_owner_id = owner_id or uploader_id
    ingestion_id = f"{actual_owner_id}_{base_uuid}" if actual_owner_id else base_uuid
    
    # Pre-calculate fingerprints
    for row in valid_rows:
        fp_raw = f"{actual_owner_id}:{row['sender_account']}:{row['receiver_account']}:{float(row['amount'])}:{row['currency']}:{row['timestamp'].isoformat()}"
        row["fingerprint"] = hashlib.sha256(fp_raw.encode()).hexdigest()
        # Prefix transaction_id with owner_id to avoid DB unique constraint violations across users
        if row.get("transaction_id"):
            row["transaction_id"] = f"{actual_owner_id}_{row['transaction_id']}"

    tx_ids = [r["transaction_id"] for r in valid_rows if r["transaction_id"]]
    fingerprints = [r["fingerprint"] for r in valid_rows]
    
    # Query database for existing matches
    stmt = select(Transaction.transaction_id, Transaction.fingerprint).where(
        and_(
            or_(
                Transaction.transaction_id.in_(tx_ids) if tx_ids else False,
                Transaction.fingerprint.in_(fingerprints)
            ),
            Transaction.owner_id == actual_owner_id
        )
    )
    result = await db.execute(stmt)
    matches = result.all()
    
    with open("e:/debug.txt", "a") as f:
        f.write(f"Matches for {actual_owner_id}: {matches}\n")
    
    matched_ids = {m[0] for m in matches if m[0]}
    matched_fps = {m[1] for m in matches if m[1]}
    
    # Save staged rows - use INSERT OR IGNORE to gracefully skip any constraint conflicts
    from sqlalchemy.dialects.sqlite import insert as sqlite_insert
    from sqlalchemy import inspect as sa_inspect

    staged_records = []
    duplicate_count = 0
    seen_tx_ids = set()
    seen_fingerprints = set()
    
    for row in valid_rows:
        # Skip rows that are already confirmed duplicates from DB
        if (row["transaction_id"] and row["transaction_id"] in matched_ids) or (row["fingerprint"] in matched_fps):
            duplicate_count += 1
            continue
        
        # Skip fingerprints already seen in this batch
        if row["fingerprint"] in seen_fingerprints:
            duplicate_count += 1
            continue
        seen_fingerprints.add(row["fingerprint"])
            
        # Scrub duplicate transaction_ids within the same batch to avoid UNIQUE constraint failures
        if row["transaction_id"]:
            if row["transaction_id"] in seen_tx_ids:
                row["transaction_id"] = None
            else:
                seen_tx_ids.add(row["transaction_id"])
        
        tx_id = uuid.uuid4()
        row_data = {
            "id": tx_id,
            "ingestion_id": str(ingestion_id),
            "transaction_id": row.get("transaction_id"),
            "sender_account": row["sender_account"],
            "receiver_account": row["receiver_account"],
            "amount": float(row["amount"]),
            "balance": float(row["balance"]) if row.get("balance") is not None else None,
            "currency": row["currency"],
            "timestamp": row["timestamp"],
            "transaction_type": row["transaction_type"],
            "payment_channel": row["payment_channel"],
            "ifsc": row.get("ifsc"),
            "bank_name": row.get("bank_name"),
            "branch": row.get("branch"),
            "beneficiary": row.get("beneficiary"),
            "purpose": row.get("purpose"),
            "upi_id": row.get("upi_id"),
            
            # Verbatim raw values
            "sender_account_raw": row.get("sender_account_raw"),
            "receiver_account_raw": row.get("receiver_account_raw"),
            "amount_raw": str(row.get("amount_raw")) if row.get("amount_raw") is not None else None,
            "balance_raw": str(row.get("balance_raw")) if row.get("balance_raw") is not None else None,
            "timestamp_raw": str(row.get("timestamp_raw")) if row.get("timestamp_raw") is not None else None,
            "transaction_id_raw": row.get("transaction_id_raw"),
            "upi_id_raw": row.get("upi_id_raw"),
            "narration_raw": row.get("narration_raw"),

            "status": "STAGED",
            "fingerprint": row["fingerprint"],
            "owner_id": actual_owner_id,
        }
        
        try:
            async with db.begin_nested():
                tx = Transaction(**row_data)
                db.add(tx)
            staged_records.append(row)
        except Exception as e:
            logger.error("Failed to insert row", error=str(e), tx_id=str(tx_id))
            duplicate_count += 1
            continue
        
    await db.commit()
    
    # Compose preview - limit to first 10 rows
    preview = []
    for r in staged_records[:10]:
        preview.append({
            "sender_account": r["sender_account"],
            "receiver_account": r["receiver_account"],
            "amount": float(r["amount"]),
            "balance": float(r["balance"]) if r.get("balance") is not None else None,
            "currency": r["currency"],
            "timestamp": r["timestamp"].isoformat(),
            "transaction_type": r["transaction_type"],
            "payment_channel": r["payment_channel"],
            "beneficiary": r["beneficiary"],
            "transaction_id": r.get("transaction_id"),
            "upi_id": r.get("upi_id"),
            "purpose": r.get("purpose"),
            
            "sender_account_raw": r.get("sender_account_raw"),
            "receiver_account_raw": r.get("receiver_account_raw"),
            "amount_raw": r.get("amount_raw"),
            "balance_raw": r.get("balance_raw"),
            "timestamp_raw": r.get("timestamp_raw"),
            "transaction_id_raw": r.get("transaction_id_raw"),
            "upi_id_raw": r.get("upi_id_raw"),
            "narration_raw": r.get("narration_raw"),
        })
        
    logger.info(
        "Successfully staged upload records",
        ingestion_id=ingestion_id,
        staged=len(staged_records),
        duplicates_skipped=duplicate_count,
        invalid_rows=len(invalid_rows)
    )
    
    return ResponseEnvelope(
        success=True,
        message=f"Statement uploaded and parsed successfully. {len(staged_records)} transactions staged.",
        data={
            "ingestion_id": ingestion_id,
            "valid_count": len(staged_records),
            "invalid_count": len(invalid_rows) + duplicate_count,
            "preview": preview,
            "errors": invalid_rows
        },
        request_id=request.state.request_id
    )


@router.post("/{ingestion_id}/confirm", response_model=ResponseEnvelope[ConfirmResponse])
async def confirm_ingestion(
    request: Request,
    ingestion_id: str,
    db: AsyncSession = Depends(get_db_session)
) -> ResponseEnvelope[ConfirmResponse]:
    """
    Locks in staged transactions, syncing unknown account nodes, and triggers detection.
    """
    logger.info("Confirming ingestion batch", ingestion_id=ingestion_id)
    
    owner_id = request.headers.get("x-user-id")
    
    # 1. Fetch all staged transactions
    stmt = select(Transaction).where(
        Transaction.ingestion_id == ingestion_id,
        Transaction.status == "STAGED",
        Transaction.owner_id == owner_id
    )
    res = await db.execute(stmt)
    txs = list(res.scalars().all())
    
    if not txs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staged ingestion transaction log not found or already confirmed."
        )
        
    # 2. Sync accounts (creates any sender or receiver account nodes that don't exist yet)
    unique_accts = {}
    for t in txs:
        if t.sender_account not in unique_accts:
            unique_accts[t.sender_account] = {
                "ifsc": t.ifsc or "MSAI0000101",
                "bank_name": t.bank_name or "MuleShield Mock Bank",
                "branch": t.branch or "Compliance Branch"
            }
        if t.receiver_account not in unique_accts:
            unique_accts[t.receiver_account] = {
                "ifsc": t.ifsc or "MSAI0000101",
                "bank_name": t.bank_name or "MuleShield Mock Bank",
                "branch": t.branch or "Compliance Branch"
            }
        
    for acct_num, details in unique_accts.items():
        acct_stmt = select(Account).where(
            Account.account_number == acct_num,
            Account.owner_id == owner_id
        )
        acct_res = await db.execute(acct_stmt)
        acct = acct_res.scalars().first()
        
        if not acct:
            # Create a mock account with a default balance
            logger.info("Auto-registering account node during statement confirmation", account_number=acct_num)
            new_acct = Account(
                id=uuid.uuid4(),
                customer_id=None,
                account_number=acct_num,
                ifsc=details["ifsc"],
                bank_name=details["bank_name"],
                branch=details["branch"],
                account_type="CHECKING",
                balance=Decimal("25000.00"),  # Default opening mockup balance
                status="ACTIVE",
                owner_id=owner_id
            )
            db.add(new_acct)
            
    # Update transactions status
    for t in txs:
        t.status = "CONFIRMED"
        
    await db.commit()
    
    # 3. Trigger Detection Engine automatically
    detection_triggered = False
    try:
        # Resolve target service endpoint
        # detection-engine url: port 8005 or configured service url
        from shared.config import BaseAppSettings
        conf = BaseAppSettings()
        # gateway resolves: settings.DETECTION_ENGINE_URL or SQLite url
        det_url = "http://127.0.0.1:8005" if conf.USE_SQLITE else conf.DETECTION_ENGINE_URL
        
        logger.info("Automatically spawning analysis task on detection scorer...", url=det_url)
        async with httpx.AsyncClient() as client:
            # Trigger run request - pass ingestion_id
            response = await client.post(
                f"{det_url}/api/v1/detection/run",
                json={"ingestion_id": ingestion_id},
                timeout=10.0
            )
            if response.status_code == 200:
                detection_triggered = True
                logger.info("Detection engine execution successfully triggered", response=response.json())
            else:
                logger.error("Failed to run detection pipeline", status_code=response.status_code, body=response.text)
    except Exception as exc:
        logger.error("Detection service connection error during ingestion confirmation", error=str(exc))
        
    return ResponseEnvelope(
        success=True,
        message="Statement ingestion confirmed and accounts synchronized.",
        data=ConfirmResponse(
            ingestion_id=ingestion_id,
            confirmed_count=len(txs),
            detection_triggered=detection_triggered
        ),
        request_id=request.state.request_id
    )


@router.get("/{ingestion_id}/summary", response_model=ResponseEnvelope[SummaryResponse])
async def get_ingestion_summary(
    request: Request,
    ingestion_id: str,
    db: AsyncSession = Depends(get_db_session)
) -> ResponseEnvelope[SummaryResponse]:
    """
    Retrieves aggregate summaries and statistics of an ingestion run.
    """
    logger.info("Compiling ingestion batch summaries", ingestion_id=ingestion_id)
    
    owner_id = request.headers.get("x-user-id") or "0882-MULE"

    try:
        ing_ids = [ingestion_id]
        if "_" in ingestion_id:
            ing_ids.extend(ingestion_id.split("_"))

        tx_stmt = select(Transaction).where(
            or_(
                Transaction.ingestion_id == ingestion_id,
                Transaction.ingestion_id.in_(ing_ids),
                Transaction.ingestion_id.like(f"%{ingestion_id}%")
            )
        )
        res = await db.execute(tx_stmt)
        txs = list(res.scalars().all())
            
        unique_accts = set()
        total_volume = 0.0
        timestamps = []
        
        for t in txs:
            if t.sender_account:
                unique_accts.add(t.sender_account)
            if t.receiver_account:
                unique_accts.add(t.receiver_account)
            if t.amount is not None:
                total_volume += float(t.amount)
            if t.timestamp:
                timestamps.append(t.timestamp)
            
        start_date = min(timestamps).isoformat() if timestamps else datetime.utcnow().isoformat()
        end_date = max(timestamps).isoformat() if timestamps else datetime.utcnow().isoformat()
        
        flagged_count = 0
        if unique_accts:
            try:
                # Query alerts without performing direct SQL IN on EncryptedString
                alert_stmt = select(Account.account_number).select_from(Alert).join(
                    Account, Alert.account_id == Account.id
                ).where(
                    Alert.status != "CLOSED_FALSE_POSITIVE"
                )
                alert_res = await db.execute(alert_stmt)
                alert_accts = alert_res.scalars().all()
                flagged_accts = {acc for acc in alert_accts if acc in unique_accts}
                flagged_count = len(flagged_accts)
            except Exception as e:
                logger.error("Failed to query alerts count linked to ingestion", error=str(e))
                flagged_count = 0
                    
        return ResponseEnvelope(
            success=True,
            message="Statement ingestion stats summary composed.",
            data=SummaryResponse(
                ingestion_id=ingestion_id,
                total_accounts=len(unique_accts),
                total_transactions=len(txs),
                total_volume=total_volume,
                currency=txs[0].currency if txs and getattr(txs[0], "currency", None) else "USD",
                start_date=start_date,
                end_date=end_date,
                flagged_accounts_count=flagged_count
            ),
            request_id=getattr(request.state, "request_id", "srv-req")
        )
    except Exception as exc:
        logger.error("Failed compiling ingestion summary", error=str(exc), ingestion_id=ingestion_id)
        return ResponseEnvelope(
            success=True,
            message="Statement ingestion stats summary composed (fallback mode).",
            data=SummaryResponse(
                ingestion_id=ingestion_id,
                total_accounts=0,
                total_transactions=0,
                total_volume=0.0,
                currency="USD",
                start_date=datetime.utcnow().isoformat(),
                end_date=datetime.utcnow().isoformat(),
                flagged_accounts_count=0
            ),
            request_id=getattr(request.state, "request_id", "srv-req")
        )


# Phase 2 Ingestion Schemas & Routes
class KYCRecordIngest(BaseModel):
    customer_id: uuid.UUID
    kyc_status: str
    account_open_date: datetime
    kyc_verification_date: datetime | None = None
    selfie_match_score: float = 0.0
    doc_verification_score: float = 0.0

class KYCBatchIngestRequest(BaseModel):
    records: list[KYCRecordIngest]

class TransactionIngest(BaseModel):
    sender_account: str
    receiver_account: str
    amount: Decimal
    currency: str = "USD"
    timestamp: datetime
    transaction_type: str = "TRANSFER"
    payment_channel: str = "ACH"
    transaction_id: str | None = None
    ifsc: str | None = None
    bank_name: str | None = None
    branch: str | None = None
    beneficiary: str | None = None
    purpose: str | None = None
    location: str | None = None
    upi_id: str | None = None
    merchant: str | None = None
    device_id: str | None = None
    ip_address: str | None = None

class TransactionBatchIngestRequest(BaseModel):
    transactions: list[TransactionIngest]
    confirm: bool = False



class IngestionListItem(BaseModel):
    ingestion_id: str
    transaction_count: int
    total_volume: float
    currency: str | None = None
    status: str
    uploaded_at: str


@router.get("/list", response_model=ResponseEnvelope[list[IngestionListItem]])
async def list_ingestions(
    request: Request,
    uploader_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db_session),
) -> ResponseEnvelope[list[IngestionListItem]]:
    """
    Returns a list of all past ingestion batches, sorted newest-first.
    Each row includes the ingestion_id, transaction count, total volume, status, and earliest timestamp.
    """
    stmt = select(
        Transaction.ingestion_id,
        func.count(Transaction.id).label("tx_count"),
        func.sum(Transaction.amount).label("total_volume"),
        func.max(Transaction.currency).label("currency"),
        func.max(Transaction.status).label("status"),
        func.min(Transaction.timestamp).label("uploaded_at"),
    ).where(
        Transaction.ingestion_id.isnot(None)
    )
    if uploader_id:
        stmt = stmt.where(Transaction.ingestion_id.like(f"{uploader_id}_%"))
        
    stmt = stmt.group_by(Transaction.ingestion_id).order_by(func.min(Transaction.timestamp).desc())

    res = await db.execute(stmt)
    rows = res.all()

    items = [
        IngestionListItem(
            ingestion_id=str(r.ingestion_id),
            transaction_count=r.tx_count,
            total_volume=float(r.total_volume or 0),
            currency=r.currency,
            status=r.status or "CONFIRMED",
            uploaded_at=r.uploaded_at.isoformat() if r.uploaded_at else "",
        )
        for r in rows
    ]

    return ResponseEnvelope(
        success=True,
        message=f"{len(items)} ingestion batches found.",
        data=items,
        request_id=request.state.request_id,
    )


@router.delete("/{ingestion_id}", response_model=ResponseEnvelope[dict])
async def delete_ingestion(
    request: Request,
    ingestion_id: str,
    db: AsyncSession = Depends(get_db_session),
) -> ResponseEnvelope[dict]:
    """
    Deletes an uploaded statement (and its transactions) by ingestion_id.
    """
    stmt = delete(Transaction).where(Transaction.ingestion_id == ingestion_id)
    await db.execute(stmt)
    await db.commit()
    
    return ResponseEnvelope(
        success=True,
        message=f"Statement {ingestion_id} deleted successfully.",
        data={"ingestion_id": ingestion_id},
        request_id=request.state.request_id,
    )


ingest_router = APIRouter(prefix="/ingest", tags=["Ingest"])

@ingest_router.post("/kyc")
async def ingest_kyc_batch(
    request: Request,
    body: KYCBatchIngestRequest,
    db: AsyncSession = Depends(get_db_session)
) -> ResponseEnvelope[dict]:
    logger.info("Received batch KYC ingestion request", count=len(body.records))
    
    ingested_count = 0
    for record in body.records:
        try:
            # Check if customer exists
            cust_stmt = select(Customer).where(Customer.id == record.customer_id)
            cust_res = await db.execute(cust_stmt)
            customer = cust_res.scalars().first()
            if not customer:
                customer = Customer(
                    id=record.customer_id,
                    full_name="Auto Ingested Customer",
                    dob=datetime(1990, 1, 1),
                    mobile="0000000000",
                    email=f"auto_{record.customer_id}@muleshield.ai",
                    pan_number="UNKNOWN",
                    aadhaar_number_masked="UNKNOWN",
                    occupation="UNKNOWN",
                    annual_income=Decimal("0.00"),
                    address="UNKNOWN"
                )
                db.add(customer)
                await db.flush()
                
            # Create KYC Record
            kyc = KYCRecord(
                customer_id=record.customer_id,
                kyc_status=record.kyc_status,
                account_open_date=record.account_open_date,
                kyc_verification_date=record.kyc_verification_date,
                selfie_match_score=record.selfie_match_score,
                doc_verification_score=record.doc_verification_score
            )
            db.add(kyc)
            ingested_count += 1
        except Exception as e:
            logger.error("Failed to ingest KYC record", error=str(e), record=record)
            
    await db.commit()
    return ResponseEnvelope(
        success=True,
        message=f"Successfully ingested {ingested_count} KYC records.",
        data={"ingested_count": ingested_count},
        request_id=request.state.request_id
    )


@ingest_router.post("/transactions")
async def ingest_transaction_batch(
    request: Request,
    body: TransactionBatchIngestRequest,
    db: AsyncSession = Depends(get_db_session)
) -> ResponseEnvelope[dict]:
    logger.info("Received batch transaction ingestion request", count=len(body.transactions), confirm=body.confirm)
    
    ingestion_id = str(uuid.uuid4())
    status_val = "CONFIRMED" if body.confirm else "STAGED"
    
    ingested_count = 0
    duplicate_count = 0
    
    for tx in body.transactions:
        # Check deduplication fingerprint
        fingerprint_raw = f"{tx.sender_account}:{tx.receiver_account}:{tx.amount}:{tx.currency}:{tx.timestamp.isoformat()}"
        fingerprint = hashlib.sha256(fingerprint_raw.encode("utf-8")).hexdigest()
        
        # Verify if fingerprint/txid exists
        if tx.transaction_id:
            dup_stmt = select(Transaction).where(
                or_(
                    Transaction.transaction_id == tx.transaction_id,
                    Transaction.fingerprint == fingerprint
                )
            )
        else:
            dup_stmt = select(Transaction).where(Transaction.fingerprint == fingerprint)
            
        dup_res = await db.execute(dup_stmt)
        if dup_res.scalars().first():
            duplicate_count += 1
            continue
            
        # Ensure account mapping constraints do not violate foreign keys
        for acct_num in [tx.sender_account, tx.receiver_account]:
            acct_stmt = select(Account).where(Account.account_number == acct_num)
            acct_res = await db.execute(acct_stmt)
            account = acct_res.scalars().first()
            if not account:
                # Dynamically seed unknown accounts
                account = Account(
                    id=uuid.uuid4(),
                    account_number=acct_num,
                    ifsc=tx.ifsc or "MSAI0000001",
                    bank_name=tx.bank_name or "MuleShield AutoBank",
                    branch=tx.branch or "AutoBranch",
                    balance=Decimal("0.00"),
                    daily_limit=Decimal("50000.00"),
                    monthly_limit=Decimal("1500000.00"),
                    status="ACTIVE"
                )
                db.add(account)
                await db.flush()
                
        # Resolve foreign keys for transactions record
        sender_stmt = select(Account.id).where(Account.account_number == tx.sender_account)
        sender_id = (await db.execute(sender_stmt)).scalar()
        
        receiver_stmt = select(Account.id).where(Account.account_number == tx.receiver_account)
        receiver_id = (await db.execute(receiver_stmt)).scalar()
        
        # Create Transaction
        new_tx = Transaction(
            ingestion_id=ingestion_id,
            transaction_id=tx.transaction_id or f"TX-GEN-{uuid.uuid4().hex[:8].upper()}",
            sender_account_id=sender_id,
            receiver_account_id=receiver_id,
            sender_account=tx.sender_account,
            receiver_account=tx.receiver_account,
            amount=tx.amount,
            currency=tx.currency,
            timestamp=tx.timestamp,
            transaction_type=tx.transaction_type,
            payment_channel=tx.payment_channel,
            ifsc=tx.ifsc,
            bank_name=tx.bank_name,
            branch=tx.branch,
            beneficiary=tx.beneficiary or tx.receiver_account,
            purpose=tx.purpose,
            location=tx.location,
            upi_id=tx.upi_id,
            merchant=tx.merchant,
            device_id=tx.device_id,
            ip_address=tx.ip_address,
            status=status_val,
            fingerprint=fingerprint
        )
        db.add(new_tx)
        ingested_count += 1
        
    await db.commit()
    
    # Trigger detection analysis if confirmed
    detection_triggered = False
    if body.confirm and ingested_count > 0:
        try:
            # Sync with Neo4j and trigger engine
            detection_triggered = True
            logger.info("Auto-triggering detection engine for ingestion", ingestion_id=ingestion_id)
            # Find engine service port via configs
            import os
            from shared.config.settings import BaseAppSettings
            settings = BaseAppSettings()
            detection_url = os.getenv("DETECTION_ENGINE_URL", settings.DETECTION_ENGINE_URL)
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"{detection_url}/api/v1/detection/run",
                    json={"ingestion_id": ingestion_id},
                    timeout=10.0
                )
        except Exception as e:
            logger.error("Failed to automatically trigger detection engine", error=str(e))
            
    return ResponseEnvelope(
        success=True,
        message=f"Successfully ingested {ingested_count} transactions (skipped {duplicate_count} duplicates).",
        data={
            "ingestion_id": ingestion_id,
            "ingested_count": ingested_count,
            "duplicate_count": duplicate_count,
            "detection_triggered": detection_triggered
        },
        request_id=request.state.request_id
    )


@router.get("/transactions/{id}")
async def get_transaction(
    request: Request,
    id: str,
    db: AsyncSession = Depends(get_db_session)
) -> ResponseEnvelope[dict]:
    """
    Returns rich dynamic profile of a single transaction by ID or transaction_id.
    """
    import uuid
    from sqlalchemy.orm import selectinload

    # Try matching by primary key (UUID) first, else by transaction_id
    stmt = select(Transaction)
    try:
        tx_uuid = uuid.UUID(id)
        stmt = stmt.where(Transaction.id == tx_uuid)
    except ValueError:
        stmt = stmt.where(Transaction.transaction_id == id)

    res = await db.execute(stmt)
    tx = res.scalars().first()

    if not tx:
        return ResponseEnvelope(success=False, message="Transaction not found", data={})

    # Simulate basic risk scores for sender/receiver based on the same logic in alert.py
    sender_risk = 30
    receiver_risk = 30
    flags = []
    
    if float(tx.amount) > 10000:
        flags.append("High value transfer detected.")
    if float(tx.amount) >= 9900 and float(tx.amount) < 10000:
        flags.append("Amount just under reporting threshold (potential structuring).")
    if tx.receiver_account.lower().startswith("mule"):
        flags.append("Receiver account flagged as high-risk Mule Node.")
        receiver_risk = 94

    history = [
        {"time": tx.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC"), "event": "Transfer initiated by sender."}
    ]
    if flags:
        history.append({"time": (tx.timestamp).strftime("%Y-%m-%d %H:%M:%S UTC"), "event": f"Automated fraud scan triggered ({len(flags)} flags)."})
        history.append({"time": (tx.timestamp).strftime("%Y-%m-%d %H:%M:%S UTC"), "event": "Transaction paused for heuristic evaluation."})
    history.append({"time": (tx.timestamp).strftime("%Y-%m-%d %H:%M:%S UTC"), "event": f"Transaction status updated to {tx.status}."})

    return ResponseEnvelope(
        success=True,
        message="Transaction details retrieved.",
        data={
            "id": tx.transaction_id or str(tx.id),
            "date": tx.timestamp.strftime("%Y-%m-%d %H:%M:%S UTC"),
            "amount": f"${float(tx.amount):,.2f}",
            "status": tx.status,
            "sender": {
                "id": f"ACC-{tx.sender_account}",
                "name": "Unknown Sender",
                "bank": tx.bank_name or "MuleShield First National",
                "riskScore": sender_risk
            },
            "receiver": {
                "id": f"ACC-{tx.receiver_account}",
                "name": tx.beneficiary or "Unknown Receiver",
                "bank": tx.bank_name or "Global Trust Bank",
                "riskScore": receiver_risk
            },
            "flags": flags,
            "history": history
        },
        request_id=request.state.request_id
    )


@router.get("/timeline")
async def get_transaction_timeline(
    request: Request,
    ingestion_id: str | None = None,
    time_range: str = "24H",
    db: AsyncSession = Depends(get_db_session)
) -> ResponseEnvelope[list[dict]]:
    """
    Returns transaction velocity grouped by time range.
    If ingestion_id is provided, only transactions from that batch are counted.
    """
    from sqlalchemy import case as sa_case, Integer
    from datetime import datetime, timedelta, timezone

    # Build base filter
    owner_id = request.headers.get("x-user-id")
    if not owner_id:
        return ResponseEnvelope(
            success=True,
            message="Unauthorized",
            data=[],
            request_id=request.state.request_id
        )

    filters = [Transaction.status == "CONFIRMED", Transaction.owner_id == owner_id]
    if ingestion_id:
        filters.append(Transaction.ingestion_id == ingestion_id)

    now = datetime.now(timezone.utc)
    slots = []

    if time_range == "7D":
        start_date = now - timedelta(days=7)
        filters.append(Transaction.timestamp >= start_date)
        stmt = (
            select(
                func.strftime("%Y-%m-%d", Transaction.timestamp).label("day"),
                func.count(Transaction.id).label("count")
            )
            .where(*filters)
            .group_by(func.strftime("%Y-%m-%d", Transaction.timestamp))
            .order_by(func.strftime("%Y-%m-%d", Transaction.timestamp))
        )
        res = await db.execute(stmt)
        rows = res.all()
        
        day_count = {row.day: row.count for row in rows}
        for d in range(6, -1, -1):
            dt = now - timedelta(days=d)
            dt_str = dt.strftime("%Y-%m-%d")
            slots.append({"time": f"Day {7-d}", "value": day_count.get(dt_str, 0)})

    elif time_range == "30D":
        start_date = now - timedelta(days=30)
        filters.append(Transaction.timestamp >= start_date)
        stmt = (
            select(
                func.strftime("%Y-%m-%d", Transaction.timestamp).label("day"),
                func.count(Transaction.id).label("count")
            )
            .where(*filters)
            .group_by(func.strftime("%Y-%m-%d", Transaction.timestamp))
            .order_by(func.strftime("%Y-%m-%d", Transaction.timestamp))
        )
        res = await db.execute(stmt)
        rows = res.all()
        
        day_count = {row.day: row.count for row in rows}
        for d in range(29, -1, -1):
            dt = now - timedelta(days=d)
            dt_str = dt.strftime("%Y-%m-%d")
            slots.append({"time": f"Day {30-d}", "value": day_count.get(dt_str, 0)})

    else:
        # Default 24H: Extract hour from timestamp
        start_date = now - timedelta(hours=24)
        filters.append(Transaction.timestamp >= start_date)
        stmt = (
            select(
                func.strftime("%H", Transaction.timestamp).label("hour"),
                func.count(Transaction.id).label("count")
            )
            .where(*filters)
            .group_by(func.strftime("%H", Transaction.timestamp))
            .order_by(func.strftime("%H", Transaction.timestamp))
        )
        res = await db.execute(stmt)
        rows = res.all()

        hour_count: dict[int, int] = {}
        for row in rows:
            try:
                hour_count[int(row.hour)] = row.count
            except (TypeError, ValueError):
                pass

        for slot_start in range(0, 24, 2):
            slot_label = f"{slot_start:02d}:00"
            value = hour_count.get(slot_start, 0) + hour_count.get(slot_start + 1, 0)
            slots.append({"time": slot_label, "value": value})

    # If no real data, return fallback so chart always has content
    has_data = any(s["value"] > 0 for s in slots)
    if not has_data:
        if time_range == "7D":
            slots = [
                {"time": "Day 1", "value": 0},
                {"time": "Day 2", "value": 0},
                {"time": "Day 3", "value": 0},
                {"time": "Day 4", "value": 0},
                {"time": "Day 5", "value": 0},
                {"time": "Day 6", "value": 0},
                {"time": "Day 7", "value": 0},
            ]
        elif time_range == "30D":
            slots = [{"time": f"Day {i}", "value": 0} for i in range(1, 31)]
        else:
            slots = [
                {"time": "00:00", "value": 0},
                {"time": "02:00", "value": 0},
                {"time": "04:00", "value": 0},
                {"time": "06:00", "value": 0},
                {"time": "08:00", "value": 0},
                {"time": "10:00", "value": 0},
                {"time": "12:00", "value": 0},
                {"time": "14:00", "value": 0},
                {"time": "16:00", "value": 0},
                {"time": "18:00", "value": 0},
            ]

    return ResponseEnvelope(
        success=True,
        message="Transaction velocity timeline retrieved.",
        data=slots,
        request_id=request.state.request_id
    )


@router.post("/kyc/upload")
async def upload_kyc_csv(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db_session)
) -> ResponseEnvelope[dict]:
    """
    Bulk import KYC customer profiles and associated records via CSV.
    """
    logger.info("Received KYC CSV upload request", filename=file.filename)
    
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the limit."
        )
        
    filename = file.filename.lower()
    if not filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported format. Upload only CSV for KYC."
        )
        
    try:
        try:
            df = pd.read_csv(io.BytesIO(contents), encoding="utf-8")
        except Exception:
            df = pd.read_csv(io.BytesIO(contents), encoding="latin-1")
            
        df = df.where(pd.notnull(df), None)
        
        required = ["full_name", "email", "pan_number", "aadhaar_number", "dob", "mobile", "kyc_status", "account_open_date"]
        missing = [col for col in required if col not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {', '.join(missing)}")
            
        success_count = 0
        error_count = 0
        errors = []
        
        for index, row in df.iterrows():
            row_dict = row.to_dict()
            try:
                email = str(row_dict.get("email")).strip()
                if not email or email == "None":
                    raise ValueError("Email is required.")
                
                # Try parsing DOB
                dob_str = str(row_dict.get("dob") or "").strip()
                try:
                    dob = pd.to_datetime(dob_str).to_pydatetime()
                except Exception:
                    dob = datetime.utcnow()
                    
                # Try parsing account open date
                acc_date_str = str(row_dict.get("account_open_date") or "").strip()
                try:
                    account_open_date = pd.to_datetime(acc_date_str).to_pydatetime()
                except Exception:
                    account_open_date = datetime.utcnow()
                
                # Check if customer exists
                stmt = select(Customer).where(func.lower(Customer.email) == email.lower())
                res = await db.execute(stmt)
                customer = res.scalars().first()
                
                if not customer:
                    customer = Customer(
                        full_name=str(row_dict.get("full_name") or ""),
                        dob=dob,
                        mobile=str(row_dict.get("mobile") or ""),
                        email=email,
                        pan_number=str(row_dict.get("pan_number") or ""),
                        aadhaar_number_masked=str(row_dict.get("aadhaar_number") or "0000")[-4:],
                        occupation=str(row_dict.get("occupation") or "Unknown"),
                        annual_income=Decimal(str(row_dict.get("annual_income") or "0")),
                        address=str(row_dict.get("address") or "")
                    )
                    db.add(customer)
                    await db.flush()
                
                # Add/Update KYC Record
                kyc_stmt = select(KYCRecord).where(KYCRecord.customer_id == customer.id)
                k_res = await db.execute(kyc_stmt)
                kyc_record = k_res.scalars().first()
                
                if not kyc_record:
                    kyc_record = KYCRecord(
                        customer_id=customer.id,
                        kyc_status=str(row_dict.get("kyc_status") or "PENDING").upper(),
                        account_open_date=account_open_date,
                        selfie_match_score=float(row_dict.get("selfie_match_score") or 0.0),
                        doc_verification_score=float(row_dict.get("doc_verification_score") or 0.0)
                    )
                    db.add(kyc_record)
                else:
                    kyc_record.kyc_status = str(row_dict.get("kyc_status") or "PENDING").upper()
                    if row_dict.get("selfie_match_score"):
                        kyc_record.selfie_match_score = float(row_dict.get("selfie_match_score"))
                    if row_dict.get("doc_verification_score"):
                        kyc_record.doc_verification_score = float(row_dict.get("doc_verification_score"))
                
                success_count += 1
            except Exception as e:
                error_count += 1
                errors.append({"row": index + 2, "error": str(e)})
                
        await db.commit()
        
        return ResponseEnvelope(
            success=True,
            message=f"Successfully imported {success_count} KYC records.",
            data={
                "success_count": success_count,
                "error_count": error_count,
                "errors": errors
            },
            request_id=request.state.request_id
        )
            
    except Exception as exc:
        await db.rollback()
        logger.error("Failed parsing KYC CSV", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"KYC Parse Error: {str(exc)}"
        )
