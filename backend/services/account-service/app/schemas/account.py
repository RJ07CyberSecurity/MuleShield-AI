import uuid
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

class AccountCreateRequest(BaseModel):
    """Payload to open a new bank account."""
    customer_id: uuid.UUID = Field(..., description="The owner customer ID")
    type: str = Field(..., description="Must be either: CHECKING, SAVINGS")
    currency: str = Field(default="USD", min_length=3, max_length=10)

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        upper_v = v.upper().strip()
        allowed = {"CHECKING", "SAVINGS"}
        if upper_v not in allowed:
            raise ValueError(f"Account type must be one of {allowed}")
        return upper_v

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        return v.upper().strip()


class AccountFreezeRequest(BaseModel):
    """Payload to request freezing a bank account."""
    reason: str = Field(..., min_length=5, max_length=255)


class AccountResponse(BaseModel):
    """Schema for returning account details."""
    id: uuid.UUID
    customer_id: uuid.UUID
    account_number: str
    type: str
    balance: Decimal
    currency: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
