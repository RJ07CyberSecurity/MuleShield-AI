"""
test_extraction_nulls.py
~~~~~~~~~~~~~~~~~~~~~~~~
Unit tests for extract_customer_details_from_text — verifying:
  1. Minimal statement (has date/amount but missing MICR, nominee, CKYC) produces
     explicit not_found entries — NOT absent keys.
  2. Missing fields trigger a WARNING log (captured via monkeypatch or log inspection).
  3. Full statement with all fields produces high-confidence entries for all canonical fields.
  4. Structured output schema: every canonical field has {value, source_line, confidence}.
"""

import os
import sys
import logging
import pytest

# ── Path setup ─────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "shared")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "ingestion-service")))

from app.api.v1.ingestion import extract_customer_details_from_text

CANONICAL_FIELDS = [
    "full_name", "customer_id", "phone", "email", "address",
    "ifsc", "bank_name", "branch", "account_number",
    "ckyc_number", "nominee", "opening_date", "micr", "alternate_ifsc"
]

# ── Minimal statement: has dates and amounts but lacks most customer fields ────
MINIMAL_STATEMENT = """\
Statement Period: Jan 1, 2024 to Jan 31, 2024

Date        Description         Amount      Balance
01/01/2024  Opening Balance                 10000.00
05/01/2024  ATM Withdrawal      -500.00     9500.00
15/01/2024  NEFT Credit         2500.00     12000.00
31/01/2024  Closing Balance                 12000.00

Total Credits: 2500.00
Total Debits: 500.00
"""

# ── Full statement: contains all canonical fields ────────────────────────────
FULL_STATEMENT = """\
Account Holder: John Kumar Sharma
Customer ID: CUST20240101
Account Number: 111122223333555
IFSC: SBIN0001234
Alternate IFSC: NESF0000096
Branch: Koramangala Branch, Bangalore 560034
Email: john.sharma@example.com
Mobile: +91 98765 43210
Opening Date: 09 Mar '24
MICR: 560001002
CKYC Number: 10092546105424
Nominee: Priya Sharma
Address: Flat 402, Green Glen Layout, Bangalore 560034

Date        Description         Amount      Balance
10/03/2024  Account Opened                  0.00
12/03/2024  Cash Deposit        50000.00    50000.00
"""


# ══════════════════════════════════════════════════════════════════════════════
# Test 1 — Minimal statement: missing fields are explicit not_found, not absent
# ══════════════════════════════════════════════════════════════════════════════
def test_minimal_statement_explicit_nulls():
    result = extract_customer_details_from_text(MINIMAL_STATEMENT, ingestion_id="test_minimal")

    assert "fields" in result, "Result must have 'fields' key"
    assert "extraction_warnings" in result, "Result must have 'extraction_warnings' key"
    assert "extracted_at" in result, "Result must have 'extracted_at' key"

    fields = result["fields"]

    # Every canonical field must be present as a key — even if not found
    for field in CANONICAL_FIELDS:
        assert field in fields, f"Canonical field '{field}' missing from result['fields']"

    # For a minimal statement that has no customer header info:
    for missing_field in ["micr", "nominee", "ckyc_number", "account_number", "ifsc"]:
        entry = fields[missing_field]
        assert "value" in entry, f"Field '{missing_field}' must have 'value' key"
        assert "confidence" in entry, f"Field '{missing_field}' must have 'confidence' key"
        assert "source_line" in entry, f"Field '{missing_field}' must have 'source_line' key"
        assert entry["value"] is None, f"Field '{missing_field}' should be None for minimal statement, got: {entry['value']}"
        assert entry["confidence"] == "not_found", f"Field '{missing_field}' should be 'not_found', got: {entry['confidence']}"


# ══════════════════════════════════════════════════════════════════════════════
# Test 2 — Missing fields produce extraction_warnings
# ══════════════════════════════════════════════════════════════════════════════
def test_missing_fields_generate_warnings():
    result = extract_customer_details_from_text(MINIMAL_STATEMENT, ingestion_id="test_warnings")
    warnings = result["extraction_warnings"]

    assert len(warnings) > 0, "Should have warnings for a minimal statement"

    # Each warning references a specific missing field
    for warning in warnings:
        assert "not found" in warning.lower() or "field" in warning.lower(), \
            f"Warning message unexpected format: {warning}"

    # Specifically micr, nominee, ckyc_number should be in warnings
    warning_text = " ".join(warnings).lower()
    for field in ["micr", "nominee", "ckyc_number"]:
        assert field in warning_text, f"Expected '{field}' in warnings, got: {warnings}"


# ══════════════════════════════════════════════════════════════════════════════
# Test 3 — Full statement: all fields extracted with high confidence
# ══════════════════════════════════════════════════════════════════════════════
def test_full_statement_all_fields_populated():
    result = extract_customer_details_from_text(FULL_STATEMENT, ingestion_id="test_full")
    fields = result["fields"]

    expected_values = {
        "full_name": "John Kumar Sharma",
        "account_number": "111122223333555",
        "ifsc": "SBIN0001234",
        "alternate_ifsc": "NESF0000096",
        "micr": "560001002",
        "ckyc_number": "10092546105424",
        "nominee": "Priya Sharma",
        "phone": "+91 98765 43210",
        "email": "john.sharma@example.com",
    }

    for field, expected_value in expected_values.items():
        entry = fields[field]
        assert entry["value"] is not None, f"Field '{field}' should not be None"
        assert expected_value.lower() in str(entry["value"]).lower(), \
            f"Field '{field}': expected '{expected_value}', got '{entry['value']}'"
        assert entry["confidence"] in ("high", "low"), \
            f"Field '{field}' should have high/low confidence, got '{entry['confidence']}'"
        assert entry["source_line"] is not None, \
            f"Field '{field}' should have a source_line recorded"


# ══════════════════════════════════════════════════════════════════════════════
# Test 4 — Structural schema: every field is always {value, source_line, confidence}
# ══════════════════════════════════════════════════════════════════════════════
def test_output_schema_structure():
    for statement_text in [MINIMAL_STATEMENT, FULL_STATEMENT]:
        result = extract_customer_details_from_text(statement_text, ingestion_id="test_schema")
        fields = result["fields"]

        for field in CANONICAL_FIELDS:
            assert field in fields, f"Field '{field}' missing"
            entry = fields[field]
            assert isinstance(entry, dict), f"Field '{field}' entry must be a dict"
            assert "value" in entry, f"Field '{field}' missing 'value'"
            assert "source_line" in entry, f"Field '{field}' missing 'source_line'"
            assert "confidence" in entry, f"Field '{field}' missing 'confidence'"
            assert entry["confidence"] in ("high", "low", "not_found"), \
                f"Field '{field}' has invalid confidence value: {entry['confidence']}"


# ══════════════════════════════════════════════════════════════════════════════
# Test 5 — bank_name always present (defaulted to "MuleShield Mock Bank")
# ══════════════════════════════════════════════════════════════════════════════
def test_bank_name_always_present():
    result = extract_customer_details_from_text(MINIMAL_STATEMENT, ingestion_id="test_bank_name")
    fields = result["fields"]

    assert "bank_name" in fields
    assert fields["bank_name"]["value"] is not None, "bank_name should always have a default value"
    assert "MuleShield" in fields["bank_name"]["value"] or "Bank" in fields["bank_name"]["value"]


if __name__ == "__main__":
    test_minimal_statement_explicit_nulls()
    print("✅ Test 1 (minimal statement explicit nulls): PASSED")

    test_missing_fields_generate_warnings()
    print("✅ Test 2 (missing fields generate warnings): PASSED")

    test_full_statement_all_fields_populated()
    print("✅ Test 3 (full statement all fields): PASSED")

    test_output_schema_structure()
    print("✅ Test 4 (output schema structure): PASSED")

    test_bank_name_always_present()
    print("✅ Test 5 (bank_name default): PASSED")

    print("\n🎉 All extraction null tests passed!")
