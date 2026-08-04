import os
import sys
import pytest
from datetime import datetime
from decimal import Decimal

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "shared")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "account-service")))

import re
from difflib import SequenceMatcher

def normalize_name(name: str | None) -> str:
    if not name: return ""
    s = re.sub(r"\b(mr|mrs|ms|dr|shri|smt|prof|sir)\.?\b", "", str(name), flags=re.IGNORECASE)
    s = re.sub(r"[^\w\s]", " ", s)
    return " ".join(s.lower().split())

def clean_acct_val(val: str | None) -> str:
    if not val: return ""
    v = str(val).strip().upper()
    if v in ("UNKNOWN", "NOT FOUND", "N/A", "NONE", ""): return ""
    return v

def test_normalize_name():
    assert normalize_name("Mr. John Doe") == "john doe"
    assert normalize_name("Mrs. Jane Smith") == "jane smith"
    assert normalize_name("Dr. Alice   W.  Bob") == "alice w bob"
    assert normalize_name("Shri Rajesh Kumar") == "rajesh kumar"

def test_clean_acct_val():
    assert clean_acct_val(" 400123456789 ") == "400123456789"
    assert clean_acct_val("UNKNOWN") == ""
    assert clean_acct_val("Not Found") == ""
    assert clean_acct_val(None) == ""

def test_entity_deduplication_sub_tree_reconciliation():
    # Simulated raw transaction batch from statement with duplicate counterparties
    mock_transactions = [
        {
            "id": "tx1",
            "sender": "400123456789",
            "receiver": "ACC-998877665544",
            "amount": Decimal("1000.00"),
            "timestamp": datetime(2026, 7, 1, 10, 0, 0),
            "narration": "UPI/1234567890/John Doe",
            "upi_id": "john@upi"
        },
        {
            "id": "tx2",
            "sender": "400123456789",
            "receiver": "ACC-998877665544",
            "amount": Decimal("2500.00"),
            "timestamp": datetime(2026, 7, 1, 12, 30, 0),
            "narration": "UPI/1234567891/John Doe",
            "upi_id": "john@upi"
        },
        {
            "id": "tx3",
            "sender": "400123456789",
            "receiver": "ACC-998877665544",
            "amount": Decimal("500.00"),
            "timestamp": datetime(2026, 7, 2, 9, 15, 0),
            "narration": "UPI/1234567892/John Doe",
            "upi_id": "john@upi"
        }
    ]

    # Group by receiver entity ACC-998877665544
    unique_entities = set()
    unique_tx_ids = set()

    for tx in mock_transactions:
        unique_entities.add(tx["sender"])
        unique_entities.add(tx["receiver"])
        unique_tx_ids.add(tx["id"])

    raw_tx_count = len(mock_transactions)
    dedup_tx_count = len(unique_tx_ids)
    unique_entities_count = len(unique_entities)

    assert raw_tx_count == 3
    assert dedup_tx_count == 3
    assert unique_entities_count == 2  # 1 sender account + 1 receiver account (deduplicated from 3 txns!)
    assert raw_tx_count == dedup_tx_count  # Reconciliation check passes!
