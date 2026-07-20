import os
import sys
import pytest
from datetime import datetime, timedelta
from decimal import Decimal
import io

# Setup path so test can resolve shared package imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "shared")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "ingestion-service")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "detection-engine")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "reporting-service")))

# Mock dependencies / structures for testing
from app.api.v1.ingestion import parse_csv
from app.api.v1.reports import generate_mock_report


def test_csv_parser_valid_rows():
    """
    Checks that the CSV parser correctly resolves valid banking records.
    """
    csv_content = (
        "sender_account,receiver_account,amount,currency,timestamp,transaction_type,payment_channel,transaction_id\n"
        "ACC-001,ACC-002,150.75,USD,2026-07-17T10:00:00Z,TRANSFER,ACH,TX-001\n"
        "ACC-002,ACC-003,200.00,USD,2026-07-17T11:00:00Z,TRANSFER,SWIFT,TX-002\n"
    )
    
    valid, invalid = parse_csv(csv_content.encode("utf-8"))
    
    assert len(valid) == 2
    assert len(invalid) == 0
    assert valid[0]["sender_account"] == "ACC-001"
    assert valid[0]["amount"] == Decimal("150.75")
    assert valid[1]["transaction_id"] == "TX-002"


def test_csv_parser_invalid_rows():
    """
    Checks that the CSV parser quarantines malformed transactions.
    """
    csv_content = (
        "sender_account,receiver_account,amount,currency,timestamp,transaction_type,payment_channel,transaction_id\n"
        ",ACC-002,150.75,USD,2026-07-17T10:00:00Z,TRANSFER,ACH,TX-001\n"  # missing sender
        "ACC-002,ACC-003,-5.00,USD,2026-07-17T11:00:00Z,TRANSFER,SWIFT,TX-002\n" # negative amount
    )
    
    valid, invalid = parse_csv(csv_content.encode("utf-8"))
    
    assert len(valid) == 0
    assert len(invalid) == 2
    assert "required and cannot be empty" in invalid[0]["reason"]
    assert "must be greater than zero" in invalid[1]["reason"]


def test_csv_parser_missing_headers():
    """
    Checks that parsing fails if critical headers are missing.
    """
    csv_content = "sender_account,amount\nACC-001,50.00\n"
    with pytest.raises(ValueError) as exc:
        parse_csv(csv_content.encode("utf-8"))
    assert "Missing required columns" in str(exc.value)


def test_mock_report_compilation():
    """
    Validates report narrative compiler behaves deterministically.
    """
    from collections import namedtuple
    MockTx = namedtuple('MockTx', ['timestamp', 'sender_account', 'receiver_account', 'amount', 'currency', 'payment_channel', 'purpose'])
    
    txs = [
        MockTx(datetime(2026, 7, 17, 10, 0), "ACC-MULE-R1", "ACC-002", Decimal("15000.00"), "USD", "SWIFT", "Wire"),
        MockTx(datetime(2026, 7, 17, 11, 0), "ACC-MULE-R1", "ACC-003", Decimal("18000.00"), "USD", "SWIFT", "Wire")
    ]
    
    rules = [
        {"rule": "R1_NEW_ACCOUNT_HIGH_VOLUME", "reason": "High activity for new account."}
    ]
    
    report = generate_mock_report(
        account_number="ACC-MULE-R1",
        balance=33000.00,
        currency="USD",
        alert_score=85.0,
        rules_hit=rules,
        txs=txs
    )
    
    assert "ACC-MULE-R1" in report["executive_summary"]
    assert "33,000.00 USD" in report["executive_summary"]
    assert len(report["evidence_table"]) == 2
    assert report["risk_factors"][0]["factor"] == "R1_NEW_ACCOUNT_HIGH_VOLUME"
    assert "RESTRICT FUNDS" in report["recommendations"]
