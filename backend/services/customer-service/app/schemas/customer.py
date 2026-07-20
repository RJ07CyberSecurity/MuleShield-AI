import uuid
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

class KYCRecordResponse(BaseModel):
    """Schema for returning KYC record details."""
    id: uuid.UUID
    document_type: str
    document_number: str
    status: str
    verified_at: datetime | None = None
    verifier_notes: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerCreateRequest(BaseModel):
    """Payload to register a new customer."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    phone: str = Field(..., min_length=5, max_length=50, description="International format phone number")


class KYCSubmitRequest(BaseModel):
    """Payload to submit KYC document details."""
    document_type: str = Field(..., description="Must be one of: PASSPORT, NATIONAL_ID, DRIVERS_LICENSE")
    document_number: str = Field(..., min_length=4, max_length=100)

    @field_validator("document_type")
    @classmethod
    def validate_doc_type(cls, v: str) -> str:
        upper_v = v.upper().strip()
        allowed = {"PASSPORT", "NATIONAL_ID", "DRIVERS_LICENSE"}
        if upper_v not in allowed:
            raise ValueError(f"document_type must be one of {allowed}")
        return upper_v


class KYCVerifyRequest(BaseModel):
    """Payload to approve/reject KYC records by an authorized agent."""
    status: str = Field(..., description="Must be either: VERIFIED, FAILED")
    notes: str | None = Field(default=None, max_length=255)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        upper_v = v.upper().strip()
        allowed = {"VERIFIED", "FAILED"}
        if upper_v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return upper_v


class CustomerResponse(BaseModel):
    """Schema for returning customer details."""
    id: uuid.UUID
    first_name: str
    last_name: str
    email: str
    phone: str
    kyc_status: str
    risk_score: float
    kyc_records: list[KYCRecordResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
