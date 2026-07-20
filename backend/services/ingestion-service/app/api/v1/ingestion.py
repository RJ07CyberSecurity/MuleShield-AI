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
from fastapi import APIRouter, Depends, Request, UploadFile, File, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, func, or_
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
    start_date: str
    end_date: str
    flagged_accounts_count: int


def parse_csv(file_bytes: bytes) -> tuple[list[dict], list[dict]]:
    valid = []
    invalid = []
    
    try:
        # Check encoding
        try:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8")
        except Exception:
            df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin-1")
            
        df = df.where(pd.notnull(df), None)
        
        # Verify required fields
        required = ["sender_account", "receiver_account", "amount", "timestamp"]
        missing = [col for col in required if col not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {', '.join(missing)}")
            
        for index, row in df.iterrows():
            row_dict = row.to_dict()
            try:
                s_val = row_dict.get("sender_account")
                r_val = row_dict.get("receiver_account")
                
                sender = "" if s_val is None or pd.isna(s_val) or str(s_val).strip() == "" or str(s_val).lower() == "nan" else str(s_val).strip()
                receiver = "" if r_val is None or pd.isna(r_val) or str(r_val).strip() == "" or str(r_val).lower() == "nan" else str(r_val).strip()
                
                if not sender or not receiver:
                    raise ValueError("Sender and receiver accounts are required and cannot be empty.")
                
                amt_str = str(row_dict.get("amount") or "0").replace("$", "").replace(",", "").strip()
                amount = Decimal(amt_str)
                if amount <= 0:
                    raise ValueError("Transaction amount must be greater than zero.")
                
                ts_str = str(row_dict.get("timestamp") or "").strip()
                try:
                    timestamp = pd.to_datetime(ts_str).to_pydatetime()
                except Exception:
                    timestamp = datetime.fromisoformat(ts_str)
                
                record = {
                    "sender_account": sender,
                    "receiver_account": receiver,
                    "amount": amount,
                    "currency": str(row_dict.get("currency") or "USD").strip().upper(),
                    "timestamp": timestamp,
                    "transaction_type": str(row_dict.get("transaction_type") or "TRANSFER").strip().upper(),
                    "payment_channel": str(row_dict.get("payment_channel") or "ACH").strip().upper(),
                    "ifsc": str(row_dict.get("ifsc")).strip() if row_dict.get("ifsc") else None,
                    "bank_name": str(row_dict.get("bank_name")).strip() if row_dict.get("bank_name") else None,
                    "branch": str(row_dict.get("branch")).strip() if row_dict.get("branch") else None,
                    "beneficiary": str(row_dict.get("beneficiary") or receiver).strip(),
                    "purpose": str(row_dict.get("purpose")).strip() if row_dict.get("purpose") else None,
                    "transaction_id": str(row_dict.get("transaction_id")).strip() if row_dict.get("transaction_id") else None,
                }
                valid.append(record)
            except Exception as e:
                invalid.append({"row": index + 2, "data": row_dict, "reason": str(e)})
                
    except Exception as e:
        raise ValueError(f"CSV Parse Exception: {str(e)}")
        
    return valid, invalid


def _clean_amount(val: str) -> Decimal | None:
    """Parse an amount string from a bank statement, returning None if unparseable."""
    if not val:
        return None
    cleaned = re.sub(r"[₹$,\s]", "", str(val)).strip()
    # Remove trailing alphabetic junk (e.g. "1,200Cr" → "1200")
    cleaned = re.sub(r"[A-Za-z]+$", "", cleaned)
    if not cleaned:
        return None
    try:
        return Decimal(cleaned)
    except Exception:
        return None


def _parse_date(val: str) -> datetime | None:
    """Try parsing Indian and ISO date formats."""
    if not val:
        return None
    val = str(val).strip()
    # Try various formats
    formats = [
        "%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y",
        "%Y-%m-%d", "%d %b %Y", "%d %b %y", "%b %d %Y",
        "%d/%m/%Y %H:%M:%S", "%d-%m-%Y %H:%M:%S",
        "%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(val, fmt)
        except ValueError:
            continue
    try:
        return pd.to_datetime(val).to_pydatetime()
    except Exception:
        return None


def parse_pdf(file_bytes: bytes) -> tuple[list[dict], list[dict]]:
    valid = []
    invalid = []

    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            all_text = ""
            all_tables = []

            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    all_text += text + "\n"
                
                # Check for table rows
                tables = page.extract_tables()
                if not tables:
                    continue
                    
                for table in tables:
                    if len(table) < 2:
                        continue
                    
                    # Inspect header elements to establish columns
                    header = [str(cell or "").lower().strip() for cell in table[0]]
                    
                    sender_idx = next((i for i, h in enumerate(header) if "sender" in h or "source" in h or "from" in h), -1)
                    receiver_idx = next((i for i, h in enumerate(header) if "receiver" in h or "dest" in h or "to" in h or "beneficiary" in h or "payee" in h), -1)
                    amount_idx = next((i for i, h in enumerate(header) if "amount" in h or "val" in h or "txn amount" in h), -1)
                    date_idx = next((i for i, h in enumerate(header) if "date" in h or "time" in h or "timestamp" in h), -1)
                    type_idx = next((i for i, h in enumerate(header) if "type" in h or "txn_type" in h), -1)
                    channel_idx = next((i for i, h in enumerate(header) if "channel" in h or "mode" in h), -1)
                    ifsc_idx = next((i for i, h in enumerate(header) if "ifsc" in h or "code" in h or "branch" in h), -1)
                    bank_idx = next((i for i, h in enumerate(header) if "bank" in h), -1)
                    branch_idx = next((i for i, h in enumerate(header) if "branch" in h), -1)
                    purpose_idx = next((i for i, h in enumerate(header) if "purpose" in h or "remark" in h or "narrative" in h), -1)
                    txid_idx = next((i for i, h in enumerate(header) if "tx" in h or "ref" in h or "id" in h), -1)
                    
                    # Apply index guesses
                    if sender_idx == -1: sender_idx = 0
                    if receiver_idx == -1: receiver_idx = 1 if len(header) > 1 else 0
                    if amount_idx == -1: amount_idx = 2 if len(header) > 2 else 0
                    if date_idx == -1: date_idx = 3 if len(header) > 3 else 0
                    
                    for r_idx, row in enumerate(table[1:]):
                        if not row or all(c is None or c == "" for c in row):
                            continue
                        try:
                            sender = str(row[sender_idx] or "").strip()
                            receiver = str(row[receiver_idx] or "").strip()
                            
                            # Filter headers
                            if sender.lower() == "sender_account" or receiver.lower() == "receiver_account":
                                continue
                                
                            amt_str = str(row[amount_idx] or "0").replace("$", "").replace(",", "").strip()
                            amount = Decimal(amt_str)
                            
                            if not sender or not receiver or amount <= 0:
                                continue
                                
                            ts_str = str(row[date_idx] or "").strip()
                            try:
                                timestamp = pd.to_datetime(ts_str).to_pydatetime()
                            except Exception:
                                timestamp = datetime.utcnow()
                                
                            record = {
                                "sender_account": sender,
                                "receiver_account": receiver,
                                "amount": amount,
                                "currency": "USD",
                                "timestamp": timestamp,
                                "transaction_type": str(row[type_idx]).strip().upper() if type_idx != -1 and row[type_idx] else "TRANSFER",
                                "payment_channel": str(row[channel_idx]).strip().upper() if channel_idx != -1 and row[channel_idx] else "ACH",
                                "ifsc": str(row[ifsc_idx]).strip() if ifsc_idx != -1 and row[ifsc_idx] else None,
                                "bank_name": str(row[bank_idx]).strip() if bank_idx != -1 and row[bank_idx] else None,
                                "branch": str(row[branch_idx]).strip() if branch_idx != -1 and row[branch_idx] else None,
                                "beneficiary": receiver,
                                "purpose": str(row[purpose_idx]).strip() if purpose_idx != -1 and row[purpose_idx] else None,
                                "transaction_id": str(row[txid_idx]).strip() if txid_idx != -1 and row[txid_idx] else None,
                            }
                            valid.append(record)
                        except Exception as e:
                            invalid.append({"row": r_idx + 2, "data": row, "reason": str(e)})

            # Unruled / text fallback
            if not valid:
                lines = all_text.split("\n")
                
                # Try to extract the account owner from the top of the file
                account_owner = "UNKNOWN_ACCOUNT"
                for line in lines[:30]:
                    if "A/C number" in line:
                        m = re.search(r"A/C number\s+(\d+)", line)
                        if m: account_owner = m.group(1)
                    elif "Account No" in line:
                        m = re.search(r"Account No\s+(\d+)", line)
                        if m: account_owner = m.group(1)
                        
                for line_idx, line in enumerate(lines):
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Pattern Match: Match Date, Amount
                    # Dates: YYYY-MM-DD or DD/MM/YY or DD MMM 'YY (e.g., 01 Jul '26)
                    date_match = re.search(r"(\d{4}-\d{2}-\d{2}|\d{2}/\d{2}/\d{2,4}|\d{2}\s+[a-zA-Z]{3}\s+'?\d{2,4})", line)
                    
                    # Rupee based amounts e.g., ₹300, -₹1
                    rupee_matches = re.findall(r"(-?₹[\d,]+(?:\.\d{1,2})?)", line)
                    
                    if date_match and rupee_matches:
                        try:
                            amt_str = rupee_matches[0].replace("₹", "").replace(",", "")
                            amount = Decimal(amt_str)
                            
                            # Clean up the date
                            date_str = date_match.group(1).replace("'", "20") # '26 -> 2026
                            try:
                                timestamp = pd.to_datetime(date_str).to_pydatetime()
                            except Exception:
                                timestamp = datetime.utcnow()
                                
                            counterparty = line.replace(date_match.group(1), "")
                            for r in rupee_matches:
                                counterparty = counterparty.replace(r, "")
                            counterparty = counterparty.strip()[:50]
                            
                            if amount < 0:
                                sender = account_owner
                                receiver = counterparty
                                amount = abs(amount)
                                txn_type = "DEBIT"
                            else:
                                sender = counterparty
                                receiver = account_owner
                                txn_type = "CREDIT"
                            
                            record = {
                                "sender_account": sender,
                                "receiver_account": receiver,
                                "amount": amount,
                                "currency": "INR",
                                "timestamp": timestamp,
                                "transaction_type": txn_type,
                                "payment_channel": "UPI" if "UPI" in counterparty else "TRANSFER",
                                "ifsc": None,
                                "bank_name": None,
                                "branch": None,
                                "beneficiary": receiver,
                                "purpose": "Text-parsed PDF line",
                                "transaction_id": None,
                            }
                            valid.append(record)
                        except Exception as e:
                            invalid.append({"row": line_idx + 1, "data": line, "reason": str(e)})
                    
                    # Fallback for standard YYYY-MM-DD + two accounts
                    elif date_match:
                        amount_match = re.search(r"(\d+(?:\.\d{2})?)", line)
                        accounts = re.findall(r"([a-zA-Z0-9-]{8,25})", line)
                        accounts = [acc for acc in accounts if not re.match(r"^\d{4}-\d{2}-\d{2}$", acc) and not re.match(r"^\d+\.\d{2}$", acc)]
                        
                        if amount_match and len(accounts) >= 2:
                            try:
                                timestamp = pd.to_datetime(date_match.group(1)).to_pydatetime()
                                amount = Decimal(amount_match.group(1))
                                sender = accounts[0]
                                receiver = accounts[1]
                                
                                record = {
                                    "sender_account": sender,
                                    "receiver_account": receiver,
                                    "amount": amount,
                                    "currency": "USD",
                                    "timestamp": timestamp,
                                    "transaction_type": "TRANSFER",
                                    "payment_channel": "ACH",
                                    "ifsc": None,
                                    "bank_name": None,
                                    "branch": None,
                                    "beneficiary": receiver,
                                    "purpose": "Text-parsed PDF line",
                                    "transaction_id": None,
                                }
                                valid.append(record)
                            except Exception as e:
                                invalid.append({"row": line_idx + 1, "data": line, "reason": str(e)})

            if not valid and not invalid:
                raise ValueError("No matching transaction logs could be extracted from PDF text or tables.")
            
    except Exception as e:
        raise ValueError(f"PDF Parse Exception: {str(e)}")
        
    return valid, invalid


@router.post("/upload")
async def upload_statement(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db_session)
) -> ResponseEnvelope[dict]:
    """
    Ingests and parses a statement (CSV/PDF), validates fields, staging them pending analyst confirm.
    """
    logger.info("Received statement file upload request", filename=file.filename)
    
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
        if filename.endswith(".csv"):
            valid_rows, invalid_rows = parse_csv(contents)
        elif filename.endswith(".pdf"):
            valid_rows, invalid_rows = parse_pdf(contents)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported statement format. Upload only CSV or PDF format Statements."
            )
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
    ingestion_id = str(uuid.uuid4())
    
    # Pre-calculate fingerprints
    for row in valid_rows:
        fp_raw = f"{row['sender_account']}:{row['receiver_account']}:{float(row['amount'])}:{row['currency']}:{row['timestamp'].isoformat()}"
        row["fingerprint"] = hashlib.sha256(fp_raw.encode()).hexdigest()

    tx_ids = [r["transaction_id"] for r in valid_rows if r["transaction_id"]]
    fingerprints = [r["fingerprint"] for r in valid_rows]
    
    # Query database for existing matches
    stmt = select(Transaction.transaction_id, Transaction.fingerprint).where(
        or_(
            Transaction.transaction_id.in_(tx_ids) if tx_ids else False,
            Transaction.fingerprint.in_(fingerprints)
        )
    )
    result = await db.execute(stmt)
    matches = result.all()
    
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
            "transaction_id": row["transaction_id"],
            "sender_account": row["sender_account"],
            "receiver_account": row["receiver_account"],
            "amount": float(row["amount"]),
            "currency": row["currency"],
            "timestamp": row["timestamp"],
            "transaction_type": row["transaction_type"],
            "payment_channel": row["payment_channel"],
            "ifsc": row.get("ifsc"),
            "bank_name": row.get("bank_name"),
            "branch": row.get("branch"),
            "beneficiary": row.get("beneficiary"),
            "purpose": row.get("purpose"),
            "status": "STAGED",
            "fingerprint": row["fingerprint"],
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
            "currency": r["currency"],
            "timestamp": r["timestamp"].isoformat(),
            "transaction_type": r["transaction_type"],
            "payment_channel": r["payment_channel"],
            "beneficiary": r["beneficiary"]
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
    
    # 1. Fetch all staged transactions
    stmt = select(Transaction).where(
        Transaction.ingestion_id == ingestion_id,
        Transaction.status == "STAGED"
    )
    res = await db.execute(stmt)
    txs = list(res.scalars().all())
    
    if not txs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Staged ingestion transaction log not found or already confirmed."
        )
        
    # 2. Sync accounts (creates any sender or receiver account nodes that don't exist yet)
    unique_accts = set()
    for t in txs:
        unique_accts.add((t.sender_account, t.currency))
        unique_accts.add((t.receiver_account, t.currency))
        
    for acct_num, currency in unique_accts:
        acct_stmt = select(Account).where(Account.account_number == acct_num)
        acct_res = await db.execute(acct_stmt)
        acct = acct_res.scalars().first()
        
        if not acct:
            # Create a mock account with a default balance & customer ID
            logger.info("Auto-registering account node during statement confirmation", account_number=acct_num)
            new_acct = Account(
                id=uuid.uuid4(),
                customer_id=uuid.uuid4(),  # Mock compliance customer binder
                account_number=acct_num,
                type="CHECKING",
                balance=Decimal("25000.00"),  # Default opening mockup balance
                currency=currency,
                status="ACTIVE"
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
    
    # 1. Fetch confirmed transactions count & aggregate values
    tx_stmt = select(Transaction).where(
        Transaction.ingestion_id == ingestion_id,
        Transaction.status == "CONFIRMED"
    )
    res = await db.execute(tx_stmt)
    txs = list(res.scalars().all())
    
    if not txs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ingestion batch summary could not be found."
        )
        
    unique_accts = set()
    total_volume = 0.0
    timestamps = []
    
    for t in txs:
        unique_accts.add(t.sender_account)
        unique_accts.add(t.receiver_account)
        total_volume += float(t.amount)
        timestamps.append(t.timestamp)
        
    start_date = min(timestamps).isoformat() if timestamps else datetime.utcnow().isoformat()
    end_date = max(timestamps).isoformat() if timestamps else datetime.utcnow().isoformat()
    
    # 2. Get alerts/flagged count linked to accounts involved in this ingestion run
    # Query accounts in account-service/alerts
    # In SQLite, we can join alerts table on account_id
    # Get Account ids of accounts in this ingestion
    acct_stmt = select(Account.id).where(Account.account_number.in_(list(unique_accts)))
    acct_res = await db.execute(acct_stmt)
    acct_ids = [row[0] for row in acct_res.all()]
    
    flagged_count = 0
    if acct_ids:
        try:
            alert_stmt = select(func.count(func.distinct(Alert.account_id))).where(
                Alert.account_id.in_(acct_ids),
                Alert.status != "DISMISSED"
            )
            alert_res = await db.execute(alert_stmt)
            flagged_count = alert_res.scalar() or 0
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
            start_date=start_date,
            end_date=end_date,
            flagged_accounts_count=flagged_count
        ),
        request_id=request.state.request_id
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
