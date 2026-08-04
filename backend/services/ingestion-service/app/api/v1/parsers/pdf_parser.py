import io
import re
from datetime import datetime
from decimal import Decimal
import pandas as pd
import pdfplumber

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

def _extract_counterparty(narration: str) -> str:
    if not narration:
        return "Not Found"
    m = re.search(r"UPI[/-](?:Credit|Debit)[/-]([\w@.]+)[/-]", narration, re.IGNORECASE)
    if m: return m.group(1)
    m = re.search(r"([\w.\-]+@[\w]+)", narration)
    if m: return m.group(1)
    m = re.search(r"(?:NEFT|IMPS|RTGS)[/-]?.*?([A-Z0-9]{10,20})", narration, re.IGNORECASE)
    if m: return m.group(1)
    m = re.search(r"\b(\d{9,18})\b", narration)
    if m: return m.group(1)
    
    skip = {
        "credit", "debit", "neft", "imps", "rtgs", "upi", "nach", "atm", "by", "to", "from", "for",
        "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec",
        "page", "statement", "balance", "opening", "closing", "total", "dr", "cr"
    }
    tokens = [w for w in re.split(r"[\s/\-]+", narration) if w.lower() not in skip and len(w) > 2 and not re.match(r"^\d{1,4}$", w) and not re.match(r"^'?\d{2,4}$", w)]
    if tokens:
        return " ".join(tokens)
    return "Not Found"

def _extract_ref_id(narration: str) -> str:
    if not narration:
        return "Not Found"
    m = re.search(r"\b(?:UTR|REF|TXN|CHQ|CHEQUE|ID)[:/\-]?\s*([A-Za-z0-9]{8,22})\b", narration, re.IGNORECASE)
    if m: return m.group(1)
    m = re.search(r"\b(\d{10,18})\b", narration)
    if m: return m.group(1)
    return "Not Found"

def _detect_channel(narration: str) -> str:
    n = narration.upper()
    if "UPI" in n:    return "UPI"
    if "NEFT" in n:   return "NEFT"
    if "IMPS" in n:   return "IMPS"
    if "RTGS" in n:   return "RTGS"
    if "NACH" in n:   return "NACH"
    if "ATM" in n:    return "ATM"
    if "POS" in n:    return "POS"
    if "CHQ" in n or "CHEQUE" in n: return "CHEQUE"
    return "TRANSFER"

def _extract_upi(narration: str) -> str:
    m = re.search(r"([\w.\-]+@[\w]+)", narration)
    if m:
        return m.group(1)
    return "Not Found"

class PDFParser(BaseStatementParser):
    def parse(self, file_bytes: bytes) -> tuple[list[dict], list[dict]]:
        valid = []
        invalid = []

        try:
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                all_text = ""
                all_tables = []

                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        all_text += text + "\n"
                    tables = page.extract_tables()
                    if tables:
                        all_tables.extend(tables)

                owner_account = "UNKNOWN"
                ac_patterns = [
                    r"A[/]?C\s*(?:No|Number|Num)[^:\n]*[:\-]?\s*([A-Za-z0-9-]{6,35})",
                    r"Account\s*(?:No|Number|Num)[^:\n]*[:\-]?\s*([A-Za-z0-9-]{6,35})",
                    r"Savings\s+A[/]?C[^:\n]*[:\-]?\s*([A-Za-z0-9-]{6,35})",
                    r"Current\s+A[/]?C[^:\n]*[:\-]?\s*([A-Za-z0-9-]{6,35})",
                    r"Account\s+Number[^:\n]*[:\-]?\s*([A-Za-z0-9Xx*-]{6,35})",
                    r"Account\s+ID[^:\n]*[:\-]?\s*([A-Za-z0-9-]{6,35})",
                    r"Statement\s+for\s+Account[^:\n]*[:\-]?\s*([A-Za-z0-9-]{6,35})",
                ]
                for pat in ac_patterns:
                    m = re.search(pat, all_text, re.IGNORECASE)
                    if m:
                        owner_account = m.group(1)
                        break

                for table in all_tables:
                    if not table or len(table) < 2:
                        continue

                    header = [str(cell or "").lower() for cell in table[0]]

                    date_idx    = next((i for i, h in enumerate(header) if "date" in h or "value dt" in h), -1)
                    narr_idx    = next((i for i, h in enumerate(header) if "narration" in h or "description" in h or "particulars" in h or "remark" in h or "purpose" in h), -1)
                    debit_idx   = next((i for i, h in enumerate(header) if h in ("debit", "dr", "withdrawal", "debit amount", "debit (dr.)")), -1)
                    credit_idx  = next((i for i, h in enumerate(header) if h in ("credit", "cr", "deposit", "credit amount", "credit (cr.)")), -1)
                    amount_idx  = next((i for i, h in enumerate(header) if "amount" in h and debit_idx == -1), -1)
                    type_idx    = next((i for i, h in enumerate(header) if h in ("type", "transaction type", "dr/cr", "cr/dr", "txn type")), -1)
                    balance_idx = next((i for i, h in enumerate(header) if "balance" in h), -1)
                    ref_idx     = next((i for i, h in enumerate(header) if "ref" in h or "chq" in h or "cheque" in h or "txn id" in h), -1)
                    sender_idx   = next((i for i, h in enumerate(header) if "sender" == h), -1)
                    receiver_idx = next((i for i, h in enumerate(header) if "receiver" == h), -1)

                    is_indian_format = debit_idx != -1 or credit_idx != -1

                    for r_idx, row in enumerate(table[1:]):
                        if not row or all(c is None or str(c) == "" for c in row):
                            continue
                        try:
                            ts_str = str(row[date_idx] or "") if date_idx != -1 else ""
                            try:
                                timestamp = pd.to_datetime(ts_str, dayfirst=True).to_pydatetime()
                            except Exception:
                                timestamp = datetime.utcnow()

                            debit_val  = 0.0
                            credit_val = 0.0
                            raw_debit = str(row[debit_idx] or "") if debit_idx != -1 else ""
                            raw_credit = str(row[credit_idx] or "") if credit_idx != -1 else ""
                            raw_amount = str(row[amount_idx] or "") if amount_idx != -1 else ""

                            if is_indian_format:
                                if debit_idx != -1:
                                    cleaned = raw_debit.replace(",", "").replace("₹", "").strip()
                                    debit_val = float(cleaned) if cleaned and cleaned not in ("-", "") else 0.0
                                if credit_idx != -1:
                                    cleaned = raw_credit.replace(",", "").replace("₹", "").strip()
                                    credit_val = float(cleaned) if cleaned and cleaned not in ("-", "") else 0.0
                            elif amount_idx != -1:
                                cleaned = raw_amount.replace(",", "").replace("₹", "").replace("$", "").strip()
                                try:
                                    val = float(cleaned)
                                    if type_idx != -1:
                                        txn_type_str = str(row[type_idx] or "").lower()
                                        if "dr" in txn_type_str or "debit" in txn_type_str or "withdrawal" in txn_type_str:
                                            debit_val = abs(val)
                                        else:
                                            credit_val = abs(val)
                                    else:
                                        if val < 0:
                                            debit_val = abs(val)
                                        else:
                                            credit_val = val
                                except ValueError:
                                    continue

                            amount = debit_val if debit_val > 0 else credit_val
                            if amount <= 0:
                                continue

                            narration = str(row[narr_idx] or "") if narr_idx != -1 else "Not Found"
                            ref_id = str(row[ref_idx] or "") if ref_idx != -1 else _extract_ref_id(narration)
                            
                            balance = None
                            bal_raw = str(row[balance_idx] or "") if balance_idx != -1 else ""
                            if balance_idx != -1:
                                bal_cleaned = bal_raw.replace(",", "").replace("₹", "").replace("$", "").strip()
                                try:
                                    balance = Decimal(bal_cleaned)
                                except:
                                    pass

                            upi_id = _extract_upi(narration)

                            if debit_val > 0:
                                txn_type = "DEBIT"
                            else:
                                txn_type = "CREDIT"
                                
                            if sender_idx != -1 and receiver_idx != -1:
                                sender_account = str(row[sender_idx] or "") or "Not Found"
                                receiver_account = str(row[receiver_idx] or "") or "Not Found"
                            else:
                                counterparty = _extract_counterparty(narration)
                                if counterparty == "Not Found" and narration != "Not Found":
                                    counterparty = narration
                                if txn_type == "DEBIT":
                                    sender_account   = owner_account
                                    receiver_account = counterparty
                                else:
                                    sender_account   = counterparty
                                    receiver_account = owner_account

                            valid.append({
                                "sender_account":   sender_account,
                                "receiver_account": receiver_account,
                                "amount":           Decimal(str(amount)),
                                "balance":          balance,
                                "currency":         _detect_currency(" ".join(str(c) for c in row if c)) or "INR",
                                "timestamp":        timestamp,
                                "transaction_type": txn_type,
                                "payment_channel":  _detect_channel(narration),
                                "ifsc":             "Not Found",
                                "bank_name":        "Not Found",
                                "branch":           "Not Found",
                                "beneficiary":      receiver_account,
                                "purpose":          narration if narration != "Not Found" else "Not Found",
                                "transaction_id":   ref_id,
                                "upi_id":           upi_id,

                                # Raw verbatim fields
                                "sender_account_raw": sender_account,
                                "receiver_account_raw": receiver_account,
                                "amount_raw": raw_debit or raw_credit or raw_amount,
                                "balance_raw": bal_raw,
                                "timestamp_raw": ts_str,
                                "transaction_id_raw": ref_id if ref_id != "Not Found" else None,
                                "upi_id_raw": upi_id if upi_id != "Not Found" else None,
                                "narration_raw": narration,
                            })

                        except Exception as e:
                            invalid.append({"row": r_idx + 2, "data": row, "reason": str(e)})

                if not valid:
                    v_fallback, i_fallback = self._parse_pdf_text_fallback(all_text, owner_account)
                    valid.extend(v_fallback)
                    invalid.extend(i_fallback)

        except Exception as e:
            raise ValueError(f"PDF Parse Exception: {str(e)}")

        return valid, invalid

    def _parse_pdf_text_fallback(self, all_text: str, owner_account: str) -> tuple[list[dict], list[dict]]:
        valid, invalid = [], []
        lines = all_text.split("\n")

        for line_idx, line in enumerate(lines):
            line_lower = line.lower()
            if not line or any(k in line_lower for k in ("page ", "statement period", "opening balance", "closing balance", "total", "summary", "page 1")):
                continue

            date_match = re.search(
                r"(\d{2}[/-]\d{2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2}|\d{2}\s+[a-zA-Z]{3}\s+'?\d{2,4})", line
            )
            if not date_match:
                continue

            amounts = re.findall(r"(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)", line)
            if not amounts:
                continue

            try:
                amount = Decimal(amounts[0].replace(",", ""))
                if amount <= 0:
                    continue

                date_str = date_match.group(1).replace("'", "20")
                try:
                    timestamp = pd.to_datetime(date_str, dayfirst=True).to_pydatetime()
                except Exception:
                    timestamp = datetime.utcnow()

                is_debit = bool(re.search(r"\b(dr|debit|withdrawal|paid|transfer out)\b", line, re.IGNORECASE))

                rem_line = line.replace(date_match.group(1), "").replace(amounts[0], "")
                counterparty = _extract_counterparty(rem_line)
                if counterparty == "Not Found":
                    counterparty = "UNKNOWN"

                if is_debit:
                    sender_account, receiver_account, txn_type = owner_account, counterparty, "DEBIT"
                else:
                    sender_account, receiver_account, txn_type = counterparty, owner_account, "CREDIT"
                    
                upi_id = _extract_upi(rem_line)
                ref_id = _extract_ref_id(rem_line)

                valid.append({
                    "sender_account":   sender_account,
                    "receiver_account": receiver_account,
                    "amount":           amount,
                    "balance":          None,
                    "currency":         _detect_currency(line) or "INR",
                    "timestamp":        timestamp,
                    "transaction_type": txn_type,
                    "payment_channel":  _detect_channel(line),
                    "ifsc":             "Not Found",
                    "bank_name":        "Not Found",
                    "branch":           "Not Found",
                    "beneficiary":      receiver_account,
                    "purpose":          rem_line or "Not Found",
                    "transaction_id":   ref_id,
                    "upi_id":           upi_id,

                    # Raw verbatim fields
                    "sender_account_raw": sender_account,
                    "receiver_account_raw": receiver_account,
                    "amount_raw": amounts[0],
                    "balance_raw": None,
                    "timestamp_raw": date_match.group(1),
                    "transaction_id_raw": ref_id if ref_id != "Not Found" else None,
                    "upi_id_raw": upi_id if upi_id != "Not Found" else None,
                    "narration_raw": rem_line,
                })
            except Exception as e:
                invalid.append({"row": line_idx + 1, "data": line, "reason": str(e)})

        return valid, invalid
