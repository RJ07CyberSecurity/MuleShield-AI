from pydantic import BaseModel
from typing import List, Optional
import uuid
from decimal import Decimal
from datetime import datetime

class CustomerInfo(BaseModel):
    full_name: str
    mobile: str
    email: str
    pan_number: str
    aadhaar_number_masked: str
    occupation: str
    address: str

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
    ifsc: str
    bank_name: str
    branch: str
    balance: Decimal
    currency: str
    status: str
    customer: Optional[CustomerInfo]
    transaction_summary: Optional[TransactionSummary]
    linked_accounts: List[LinkedAccountSummary]

    class Config:
        from_attributes = True
