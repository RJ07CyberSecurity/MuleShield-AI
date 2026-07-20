from datetime import datetime, timezone
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import select, desc, func
from shared.database.models import Customer, KYCRecord, Account, RiskScore

# Timezone-aware min datetime for robust sorting
TZ_MIN = datetime.min.replace(tzinfo=timezone.utc)

# Dynamically add compatibility properties to Customer class
# Maps legacy properties to modern schema columns and handles aggregates

@property
def customer_first_name(self) -> str:
    return self.full_name.split(" ", 1)[0] if self.full_name else ""

@customer_first_name.setter
def customer_first_name(self, val: str):
    last = self.last_name or ""
    self.full_name = f"{val} {last}".strip()

@property
def customer_last_name(self) -> str:
    parts = self.full_name.split(" ", 1) if self.full_name else []
    return parts[1] if len(parts) > 1 else ""

@customer_last_name.setter
def customer_last_name(self, val: str):
    first = self.first_name or ""
    self.full_name = f"{first} {val}".strip()

@property
def customer_phone(self) -> str:
    return self.mobile

@customer_phone.setter
def customer_phone(self, val: str):
    self.mobile = val

@hybrid_property
def customer_kyc_status(self) -> str:
    if getattr(self, "_kyc_status_val", None):
        return self._kyc_status_val
    if self.kyc_records:
        sorted_records = sorted(
            self.kyc_records,
            key=lambda r: r.created_at or TZ_MIN,
            reverse=True
        )
        return sorted_records[0].kyc_status
    return "PENDING"

@customer_kyc_status.setter
def customer_kyc_status(self, val: str):
    self._kyc_status_val = val
    if self.kyc_records:
        sorted_records = sorted(
            self.kyc_records,
            key=lambda r: r.created_at or TZ_MIN,
            reverse=True
        )
        sorted_records[0].kyc_status = val

@customer_kyc_status.expression
def customer_kyc_status(cls):
    subq = (
        select(KYCRecord.kyc_status)
        .where(KYCRecord.customer_id == cls.id)
        .order_by(desc(KYCRecord.created_at))
        .limit(1)
        .correlate_except(KYCRecord)
        .scalar_subquery()
    )
    return func.coalesce(subq, "PENDING")

@hybrid_property
def customer_risk_score(self) -> float:
    if hasattr(self, "_risk_score_val"):
        return self._risk_score_val
    
    max_score = 0.0
    if self.accounts:
        for acct in self.accounts:
            if acct.risk_scores:
                sorted_scores = sorted(
                    acct.risk_scores,
                    key=lambda s: s.computed_at or TZ_MIN,
                    reverse=True
                )
                max_score = max(max_score, sorted_scores[0].final_score / 100.0)
    return max_score

@customer_risk_score.setter
def customer_risk_score(self, val: float):
    self._risk_score_val = val

@customer_risk_score.expression
def customer_risk_score(cls):
    subq = (
        select(func.max(RiskScore.final_score) / 100.0)
        .join(Account, RiskScore.account_id == Account.id)
        .where(Account.customer_id == cls.id)
        .scalar_subquery()
    )
    return func.coalesce(subq, 0.0)

# Bind descriptors and properties to Customer
Customer.first_name = customer_first_name
Customer.last_name = customer_last_name
Customer.phone = customer_phone
Customer.kyc_status = customer_kyc_status
Customer.risk_score = customer_risk_score

# Default constructor initializer override for safety
_original_init = Customer.__init__
def new_init(self, *args, **kwargs):
    if "first_name" in kwargs and "last_name" in kwargs and "full_name" not in kwargs:
        kwargs["full_name"] = f"{kwargs['first_name']} {kwargs['last_name']}".strip()
    if "phone" in kwargs and "mobile" not in kwargs:
        kwargs["mobile"] = kwargs["phone"]
    if "dob" not in kwargs:
        kwargs["dob"] = datetime.now(timezone.utc)
    _original_init(self, *args, **kwargs)

Customer.__init__ = new_init


# --- KYCRecord compatibility properties ---

@property
def kyc_status_alias(self) -> str:
    return self.kyc_status

@kyc_status_alias.setter
def kyc_status_alias(self, val: str):
    self.kyc_status = val

@property
def kyc_verified_at_alias(self) -> datetime | None:
    return self.kyc_verification_date

@kyc_verified_at_alias.setter
def kyc_verified_at_alias(self, val: datetime | None):
    self.kyc_verification_date = val

@property
def kyc_verifier_notes_alias(self) -> str | None:
    return getattr(self, "_verifier_notes", None)

@kyc_verifier_notes_alias.setter
def kyc_verifier_notes_alias(self, val: str | None):
    self._verifier_notes = val

@property
def kyc_document_type(self) -> str:
    if getattr(self, "_document_type", None):
        return self._document_type
    if self.customer:
        if self.customer.pan_number:
            return "PASSPORT"
        if self.customer.aadhaar_number_masked:
            return "NATIONAL_ID"
    return "PASSPORT"

@kyc_document_type.setter
def kyc_document_type(self, val: str):
    self._document_type = val

@property
def kyc_document_number(self) -> str:
    if getattr(self, "_document_number", None):
        return self._document_number
    if self.customer:
        if self.customer.pan_number:
            return self.customer.pan_number
        if self.customer.aadhaar_number_masked:
            return self.customer.aadhaar_number_masked
    return "N/A"

@kyc_document_number.setter
def kyc_document_number(self, val: str):
    self._document_number = val
    if self.customer:
        doc_type = getattr(self, "document_type", "PASSPORT")
        if doc_type == "NATIONAL_ID":
            self.customer.aadhaar_number_masked = val
        else:
            self.customer.pan_number = val

# Bind properties to KYCRecord
KYCRecord.status = kyc_status_alias
KYCRecord.verified_at = kyc_verified_at_alias
KYCRecord.verifier_notes = kyc_verifier_notes_alias
KYCRecord.document_type = kyc_document_type
KYCRecord.document_number = kyc_document_number

_original_kyc_init = KYCRecord.__init__
def new_kyc_init(self, *args, **kwargs):
    # Extract compatibility properties before passing to SQLAlchemy init
    status_val = kwargs.pop("status", None)
    verified_at_val = kwargs.pop("verified_at", None)
    verifier_notes_val = kwargs.pop("verifier_notes", None)
    doc_type = kwargs.pop("document_type", None)
    doc_num = kwargs.pop("document_number", None)
    
    if status_val is not None:
        kwargs["kyc_status"] = status_val
    if verified_at_val is not None:
        kwargs["kyc_verification_date"] = verified_at_val
    if "account_open_date" not in kwargs:
        kwargs["account_open_date"] = datetime.now(timezone.utc)
        
    _original_kyc_init(self, *args, **kwargs)
    
    if verifier_notes_val is not None:
        self.verifier_notes = verifier_notes_val
    if doc_type is not None:
        self.document_type = doc_type
    if doc_num is not None:
        self.document_number = doc_num

KYCRecord.__init__ = new_kyc_init

__all__ = ["Customer", "KYCRecord"]
