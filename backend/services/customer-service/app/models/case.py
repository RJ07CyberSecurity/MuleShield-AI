import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from shared.database import Base
from shared.database.models import Case, AuditLog

# Dynamically bind Case relationships to the imported shared Case model
# This prevents class name and table metadata registry duplication in SQLAlchemy.
Case.case_notes = relationship(
    "CaseNote",
    back_populates="case",
    cascade="all, delete-orphan",
    lazy="selectin"
)
Case.evidence = relationship(
    "EvidenceFile",
    back_populates="case",
    cascade="all, delete-orphan",
    lazy="selectin"
)
Case.timeline = relationship(
    "CaseTimeline",
    back_populates="case",
    cascade="all, delete-orphan",
    lazy="selectin"
)


class CaseNote(Base):
    """
    Threaded analyst notes regarding case investigations.
    """
    __tablename__ = "case_notes"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    analyst_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    analyst_name: Mapped[str] = mapped_column(String(100), default="System Analyst", nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    case: Mapped[Case] = relationship("shared.database.models.Case", back_populates="case_notes")


class EvidenceFile(Base):
    """
    Uploaded evidence attachments bound to cases.
    """
    __tablename__ = "evidence_files"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    uploaded_by: Mapped[uuid.UUID] = mapped_column(nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    case: Mapped[Case] = relationship("shared.database.models.Case", back_populates="evidence")


class CaseTimeline(Base):
    """
    System activity audit log associated with specific case investigations.
    """
    __tablename__ = "case_timeline"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("cases.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)  # CREATE, STATUS_CHANGE, ASSIGN, NOTE_ADDED, EVIDENCE_UPLOADED
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    case: Mapped[Case] = relationship("shared.database.models.Case", back_populates="timeline")
