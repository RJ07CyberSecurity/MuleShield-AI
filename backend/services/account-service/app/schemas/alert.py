import uuid
from datetime import datetime
from pydantic import BaseModel, Field

class AlertResponse(BaseModel):
    """Schema for returning alert details."""
    id: uuid.UUID
    account_id: uuid.UUID
    customer_id: uuid.UUID
    alert_type: str
    severity: str
    status: str
    trigger_reason: str
    score: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RuleResponse(BaseModel):
    """Schema for returning rule details."""
    id: uuid.UUID
    code: str
    name: str
    description: str | None
    expression: str
    status: str
    version: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AlertResolveRequest(BaseModel):
    action: str


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # "account" | "customer" | "device" | "ip" | "bank"
    riskScore: float
    details: dict | None = None


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str | None = None
    value: float | None = None


class GraphDataResponse(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]
