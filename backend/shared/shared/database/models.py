import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, Numeric, DateTime, Float, ForeignKey, Text, JSON, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from shared.database.postgres import Base

class Customer(Base):
    """
    Customer profile entity keeping track of core attributes, identity numbers, and verified details.
    """
    __tablename__ = "customers"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    dob: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    mobile: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    pan_number: Mapped[str] = mapped_column(String(255), nullable=False)  # Encrpyted at rest
    aadhaar_number_masked: Mapped[str] = mapped_column(String(255), nullable=False)  # Encrypted at rest
    occupation: Mapped[str] = mapped_column(String(100), nullable=False)
    annual_income: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=2), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)

    # Relationships
    kyc_records: Mapped[list["KYCRecord"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    accounts: Mapped[list["Account"]] = relationship(back_populates="customer", cascade="all, delete-orphan")
    device_sessions: Mapped[list["DeviceSession"]] = relationship(back_populates="customer", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Customer(email={self.email}, full_name={self.full_name})>"


class KYCRecord(Base):
    """
    KYC validation records tracking selfie match and identity validation scores.
    """
    __tablename__ = "kyc_records"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    kyc_status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)  # PENDING, VERIFIED, FAILED
    account_open_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    kyc_verification_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    selfie_match_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    doc_verification_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationships
    customer: Mapped["Customer"] = relationship(back_populates="kyc_records")

    def __repr__(self) -> str:
        return f"<KYCRecord(status={self.kyc_status}, selfie={self.selfie_match_score})>"


class Account(Base):
    """
    Financial Account profile containing limits, current balances, and status.
    """
    __tablename__ = "accounts"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True)
    account_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    ifsc: Mapped[str] = mapped_column(String(50), nullable=False)
    bank_name: Mapped[str] = mapped_column(String(100), nullable=False)
    branch: Mapped[str] = mapped_column(String(100), nullable=False)
    account_type: Mapped[str] = mapped_column(String(50), default="CHECKING", nullable=False)  # CHECKING, SAVINGS
    balance: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=2), default=0.00, nullable=False)
    daily_limit: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=2), default=50000.00, nullable=False)
    monthly_limit: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=2), default=1500000.00, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="ACTIVE", nullable=False)  # ACTIVE, SUSPENDED, FROZEN

    # Relationships
    customer: Mapped["Customer | None"] = relationship(back_populates="accounts")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="account", cascade="all, delete-orphan")
    risk_scores: Mapped[list["RiskScore"]] = relationship(back_populates="account", cascade="all, delete-orphan")
    external_intel: Mapped[list["ExternalIntel"]] = relationship(back_populates="account", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Account(number={self.account_number}, balance={self.balance}, status={self.status})>"


class Transaction(Base):
    """
    SQL ledger transaction record storing transfer flows, details, and audit fingerprints.
    """
    __tablename__ = "transactions"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ingestion_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    transaction_id: Mapped[str | None] = mapped_column(String(100), unique=True, index=True, nullable=True)
    sender_account_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    receiver_account_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True)
    sender_account: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    receiver_account: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=4), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True, nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)  # TRANSFER, DEPOSIT, WITHDRAWAL
    payment_channel: Mapped[str] = mapped_column(String(50), nullable=False)  # SWIFT, P2P, ACH
    ifsc: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    branch: Mapped[str | None] = mapped_column(String(100), nullable=True)
    beneficiary: Mapped[str | None] = mapped_column(String(100), nullable=True)
    purpose: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location: Mapped[str | None] = mapped_column(String(250), nullable=True)
    upi_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    merchant: Mapped[str | None] = mapped_column(String(100), nullable=True)
    device_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="STAGED", nullable=False)  # STAGED, CONFIRMED
    fingerprint: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)

    def __repr__(self) -> str:
        return (
            f"<Transaction(sender={self.sender_account}, receiver={self.receiver_account}, "
            f"amount={self.amount}, timestamp={self.timestamp}, status={self.status})>"
        )


class DeviceSession(Base):
    """
    Investigators sessions and logs mapping device tokens used by customers.
    """
    __tablename__ = "device_sessions"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    device_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    ip_address: Mapped[str] = mapped_column(String(50), nullable=False)
    login_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    geo_location: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    customer: Mapped["Customer"] = relationship(back_populates="device_sessions")

    def __repr__(self) -> str:
        return f"<DeviceSession(device={self.device_id}, ip={self.ip_address})>"


class ExternalIntel(Base):
    """
    Blacklist intelligence files reported by cyber-complaint portals, FIR logs, or RBI circular lists.
    """
    __tablename__ = "external_intel"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False)  # FIR, CYBER_COMPLAINT, RBI_BLACKLIST
    reference_number: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Relationships
    account: Mapped["Account"] = relationship(back_populates="external_intel")

    def __repr__(self) -> str:
        return f"<ExternalIntel(source={self.source}, ref={self.reference_number})>"


class RiskScore(Base):
    """
    Calculated threat matrices combining rule weights, ML inference thresholds, and graph Centrality.
    """
    __tablename__ = "risk_scores"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    rule_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    ml_probability: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    graph_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    final_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    risk_band: Mapped[str] = mapped_column(String(30), default="NORMAL", nullable=False)  # NORMAL, LOW, MEDIUM, HIGH, CRITICAL
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    explainability_payload: Mapped[dict] = mapped_column(JSON, nullable=False)  # contributer rules list + SHAP weights

    # Relationships
    account: Mapped["Account"] = relationship(back_populates="risk_scores")
    alerts: Mapped[list["Alert"]] = relationship(back_populates="risk_score", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<RiskScore(score={self.final_score}, band={self.risk_band})>"


class Alert(Base):
    """
    Alert events triggered by threat algorithms.
    """
    __tablename__ = "alerts"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_score_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("risk_scores.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="OPEN", nullable=False)  # OPEN, ASSIGNED, INVESTIGATING, CLOSED_FALSE_POSITIVE, ESCALATED
    assigned_officer_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    account: Mapped["Account"] = relationship(back_populates="alerts")
    risk_score: Mapped["RiskScore | None"] = relationship(back_populates="alerts")
    cases: Mapped[list["Case"]] = relationship(back_populates="alert", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Alert(status={self.status}, score_id={self.risk_score_id})>"


class Case(Base):
    """
    Legal case folders tracking human-in-the-loop actions and freeze authorizations.
    """
    __tablename__ = "cases"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    alert_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("alerts.id", ondelete="SET NULL"), nullable=True, index=True)
    officer_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    recommended_action: Mapped[str | None] = mapped_column(String(255), nullable=True)
    legal_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="OPEN", nullable=False)  # OPEN, INVESTIGATING, FROZEN, CLOSED

    # Relationships
    alert: Mapped["Alert | None"] = relationship(back_populates="cases")

    def __repr__(self) -> str:
        return f"<Case(status={self.status}, ref={self.legal_reference})>"


class AuditLog(Base):
    """
    Immutable logs tracking analyst lookups and state alterations for law enforcement admissibility.
    """
    __tablename__ = "audit_log"
    __table_args__ = {'extend_existing': True}

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    actor_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., REVEAL_PII, FREEZE_ACCOUNT, RUN_SCORING
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # e.g., CUSTOMER, ACCOUNT, CASE
    entity_id: Mapped[uuid.UUID | None] = mapped_column(nullable=True)
    before_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    after_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)

    def __repr__(self) -> str:
        return f"<AuditLog(actor={self.actor_id}, action={self.action}, timestamp={self.timestamp})>"
