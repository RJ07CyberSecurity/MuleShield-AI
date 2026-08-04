import io
from datetime import datetime
from decimal import Decimal
import pandas as pd
from .base import BaseStatementParser

def _detect_currency(val: str) -> str | None:
    if not val:
        return None
    val = str(val).upper()
    if "$" in val or "USD" in val: return "USD"
    if "€" in val or "EUR" in val: return "EUR"
    if "£" in val or "GBP" in val: return "GBP"
    if "₹" in val or "INR" in val: return "INR"
    return None

class CSVExcelParser(BaseStatementParser):
    def __init__(self, is_excel: bool = False):
        self.is_excel = is_excel

    def parse(self, file_bytes: bytes) -> tuple[list[dict], list[dict]]:
        valid = []
        invalid = []
        
        try:
            if self.is_excel:
                df = pd.read_excel(io.BytesIO(file_bytes), engine="openpyxl", dtype=str)
            else:
                try:
                    df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8", dtype=str)
                except Exception:
                    df = pd.read_csv(io.BytesIO(file_bytes), encoding="latin-1", dtype=str)
                    
            df.columns = [str(col).strip().lower().replace(" ", "_") for col in df.columns]
            df = df.where(pd.notnull(df), None)
            
            # Verify required fields
            required = ["sender_account", "receiver_account", "amount", "timestamp"]
            missing = [col for col in required if col not in df.columns]
            if missing:
                raise ValueError(f"Missing required columns: {', '.join(missing)}")
                
            for index, row in df.iterrows():
                row_dict = row.to_dict()
                try:
                    s_val = row_dict.get("sender_account")
                    r_val = row_dict.get("receiver_account")
                    
                    sender_raw = "" if s_val is None or pd.isna(s_val) else str(s_val)
                    receiver_raw = "" if r_val is None or pd.isna(r_val) else str(r_val)
                    
                    if not sender_raw or not receiver_raw:
                        raise ValueError("Sender and receiver accounts are required and cannot be empty.")
                    
                    sender = sender_raw
                    receiver = receiver_raw

                    raw_amount_str = str(row_dict.get("amount") or "")
                    amt_cleaned = raw_amount_str.replace("$", "").replace("₹", "").replace(",", "").strip()
                    amount = Decimal(amt_cleaned or "0")
                    if amount <= 0:
                        raise ValueError("Transaction amount must be greater than zero.")
                    
                    ts_str_raw = str(row_dict.get("timestamp") or "")
                    ts_cleaned = ts_str_raw.strip()
                    try:
                        timestamp = pd.to_datetime(ts_cleaned).to_pydatetime()
                    except Exception:
                        timestamp = datetime.fromisoformat(ts_cleaned)
                    
                    # Extract optional fields or mark as Not Found (verbatim without stripping)
                    def get_field(key, default="Not Found"):
                        val = row_dict.get(key)
                        if val is None or pd.isna(val) or str(val) == "" or str(val).lower() == "nan":
                            return default
                        return str(val)
                        
                    balance_str_raw = get_field("balance", None)
                    balance_val = None
                    if balance_str_raw:
                        try:
                            bal_cleaned = balance_str_raw.replace(",", "").replace("$", "").replace("₹", "").strip()
                            balance_val = Decimal(bal_cleaned)
                        except:
                            pass
                    
                    record = {
                        "sender_account": sender,
                        "receiver_account": receiver,
                        "amount": amount,
                        "balance": balance_val,
                        "currency": get_field("currency", _detect_currency(raw_amount_str) or "USD"),
                        "timestamp": timestamp,
                        "transaction_type": get_field("transaction_type", "TRANSFER"),
                        "payment_channel": get_field("payment_channel", "ACH"),
                        "ifsc": get_field("ifsc", "Not Found"),
                        "bank_name": get_field("bank_name", "Not Found"),
                        "branch": get_field("branch", "Not Found"),
                        "beneficiary": get_field("beneficiary", receiver),
                        "purpose": get_field("purpose", "Not Found"),
                        "transaction_id": get_field("transaction_id", "Not Found"),
                        "upi_id": get_field("upi_id", "Not Found"),

                        # Raw verbatim representations
                        "sender_account_raw": sender_raw,
                        "receiver_account_raw": receiver_raw,
                        "amount_raw": raw_amount_str,
                        "balance_raw": balance_str_raw,
                        "timestamp_raw": ts_str_raw,
                        "transaction_id_raw": get_field("transaction_id", None),
                        "upi_id_raw": get_field("upi_id", None),
                        "narration_raw": get_field("narration", get_field("purpose", None)),
                    }
                    valid.append(record)
                except Exception as e:
                    invalid.append({"row": index + 2, "data": row_dict, "reason": str(e)})
                    
        except Exception as e:
            raise ValueError(f"Parse Exception: {str(e)}")
            
        return valid, invalid
