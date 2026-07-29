import uuid
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field

class CaseResponse(BaseModel):
    """Schema for returning case details."""
    id: uuid.UUID
    alert_id: uuid.UUID | None = None
    owner_id: str | None = None
    officer_id: uuid.UUID | None = None
    notes: str | None = None
    recommended_action: str | None = None
    legal_reference: str | None = None
    status: str
    escalation_status: str | None = None
    escalated_by: str | None = None
    escalated_to: str | None = None
    evidence: list[Any] = []

    # New persistent fields
    title: str | None = None
    customer_name: str | None = None
    customer_id: str | None = None
    priority: str | None = None
    stage: str | None = None
    risk_score: int | None = None
    ai_confidence: int | None = None
    closed_at: datetime | None = None

    assignee_id: uuid.UUID | None = None
    reporter_id: uuid.UUID | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    version: int = 1

    model_config = {"from_attributes": True, "extra": "allow"}

class CaseStatusUpdateRequest(BaseModel):
    status: str

class CaseUpdateRequest(BaseModel):
    status: str | None = None
    priority: str | None = None
    stage: str | None = None
    risk_score: int | None = None
    ai_confidence: int | None = None
    title: str | None = None
    customer_name: str | None = None

class CaseNoteCreateRequest(BaseModel):
    text: str

class CaseCreateRequest(BaseModel):
    notes: str | None = None
    recommended_action: str | None = None
    status: str = "NEW"
    escalation_status: str | None = None
    escalated_by: str | None = None
    alert_id: uuid.UUID | None = None
    title: str | None = None
    customer_name: str | None = None
    customer_id: str | None = None
    priority: str | None = None
    stage: str = "Alert Triage"
    risk_score: int | None = None
    ai_confidence: int | None = None
