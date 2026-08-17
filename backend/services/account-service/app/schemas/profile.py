from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from decimal import Decimal
from datetime import datetime


class CustomerInfo(BaseModel):
    full_name: str
    mobile: Optional[str] = None
    email: Optional[str] = None
    pan_number: Optional[str] = None
    aadhaar_number_masked: Optional[str] = None
    occupation: Optional[str] = None
    address: Optional[str] = None
    # KYC / compliance fields surfaced from statement extraction
    ckyc_number: Optional[str] = None
    nominee: Optional[str] = None
    kyc_status: Optional[str] = None


class LinkedAccountSummary(BaseModel):
    account_number: str
    bank_name: str
    transaction_count: int
    total_volume: Decimal


class TransactionSummary(BaseModel):
    latest_amount: Decimal
    latest_timestamp: datetime
    total_volume_30d: Decimal


class AccountProfileResponse(BaseModel):
    account_id: uuid.UUID
    account_number: str
    ifsc: Optional[str] = None
    bank_name: Optional[str] = None
    branch: Optional[str] = None
    balance: Decimal
    currency: str
    status: str
    # Additional fields stored on Account model from statement extraction
    micr: Optional[str] = None
    alternate_ifsc: Optional[str] = None
    opening_date: Optional[str] = None
    customer: Optional[CustomerInfo] = None
    transaction_summary: Optional[TransactionSummary] = None
    linked_accounts: List[LinkedAccountSummary] = []
    # Confidence metadata — populated for privileged roles
    extraction_confidence: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
