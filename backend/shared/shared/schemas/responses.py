from datetime import datetime, timezone
from typing import Any, Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")

class ResponseEnvelope(BaseModel, Generic[T]):
    """
    Standard successful API response envelope.
    Ensures consistent communication interface for all microservices.
    """
    success: bool = Field(default=True, description="Indicates if the operation succeeded")
    message: str = Field(default="Operation completed successfully", description="User-friendly status message")
    data: T | None = Field(default=None, description="The generic resource payload")
    errors: list[Any] = Field(default_factory=list, description="List of fine-grained error details")
    request_id: str = Field(description="Unique correlation ID for tracing the request lifecycle")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC time the response was generated"
    )


class PageMetadata(BaseModel):
    """
    Standard pagination metadata.
    """
    page: int = Field(description="Current 1-indexed page number")
    size: int = Field(description="Number of records requested per page")
    total_items: int = Field(description="Total count of matching records across all pages")
    total_pages: int = Field(description="Total number of pages based on size and total_items")
    has_next: bool = Field(description="True if there is a subsequent page of data")
    has_previous: bool = Field(description="True if there is a preceding page of data")


class PaginatedResponseEnvelope(BaseModel, Generic[T]):
    """
    Standard envelope format for lists of paginated resources.
    """
    success: bool = Field(default=True)
    message: str = Field(default="Data fetched successfully")
    data: list[T] = Field(default_factory=list, description="List of payload items for the current page")
    pagination: PageMetadata = Field(description="Pagination context")
    errors: list[Any] = Field(default_factory=list)
    request_id: str = Field(description="Unique correlation ID for tracing the request lifecycle")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
