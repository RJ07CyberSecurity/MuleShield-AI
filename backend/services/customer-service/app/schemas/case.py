import uuid
from datetime import datetime
from pydantic import BaseModel

class CaseResponse(BaseModel):
    """Schema for returning case details."""
    id: uuid.UUID
    customer_id: uuid.UUID
    title: str
    description: str | None
    status: str
    priority: str
    assignee_id: uuid.UUID | None
    reporter_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
    version: int

    class Config:
        from_attributes = True


class CaseStatusUpdateRequest(BaseModel):
    status: str


class CaseNoteCreateRequest(BaseModel):
    text: str
