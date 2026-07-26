import uuid
from datetime import datetime
from pydantic import BaseModel, Field

class CaseResponse(BaseModel):
    """Schema for returning case details."""
    id: uuid.UUID
    alert_id: uuid.UUID | None = None
    officer_id: uuid.UUID | None = None
    notes: str | None = None
    recommended_action: str | None = None
    legal_reference: str | None = None
    status: str

    # Fallbacks for UI compatibility — these columns don't exist on the shared Case model
    # so they stay as defaults and are never populated from ORM attributes.
    customer_id: uuid.UUID | None = None
    title: str = "Investigation Case"
    description: str | None = "Compliance Case Investigation"
    priority: str = "MEDIUM"
    assignee_id: uuid.UUID | None = None
    reporter_id: uuid.UUID | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = 1

    model_config = {"from_attributes": True, "extra": "allow"}


class CaseStatusUpdateRequest(BaseModel):
    status: str


class CaseNoteCreateRequest(BaseModel):
    text: str

class CaseCreateRequest(BaseModel):
    notes: str | None = None
    recommended_action: str | None = None
    status: str = "NEW"
