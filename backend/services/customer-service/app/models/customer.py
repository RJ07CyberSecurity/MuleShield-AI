from datetime import datetime
from shared.database.models import Customer, KYCRecord

# Dynamically add compatibility properties to Customer class
# Maps legacy properties (first_name, last_name, phone) to modern schema columns (full_name, mobile)

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

# Bind descriptors
Customer.first_name = customer_first_name
Customer.last_name = customer_last_name
Customer.phone = customer_phone

# Default constructor initializer override for safety
_original_init = Customer.__init__
def new_init(self, *args, **kwargs):
    if "first_name" in kwargs and "last_name" in kwargs and "full_name" not in kwargs:
        kwargs["full_name"] = f"{kwargs['first_name']} {kwargs['last_name']}".strip()
    if "phone" in kwargs and "mobile" not in kwargs:
        kwargs["mobile"] = kwargs["phone"]
    if "dob" not in kwargs:
        kwargs["dob"] = datetime.utcnow()
    _original_init(self, *args, **kwargs)

Customer.__init__ = new_init

__all__ = ["Customer", "KYCRecord"]
