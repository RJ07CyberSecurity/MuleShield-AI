"""
test_profile_rbac.py
~~~~~~~~~~~~~~~~~~~~
RBAC enforcement tests for GET /ingestion/{id}/customer-profile.

Tests:
  1. User A uploads + confirms a statement. User B (analyst) calls customer-profile → HTTP 403,
     response body MUST NOT contain any profile field data.
  2. User A calls their own statement → HTTP 200, profile data present.
  3. Investigator role accesses User A's statement → HTTP 200, audit log written with
     result="allowed" and role_at_time="investigator".
  4. Verify all 3 access attempts above produced ProfileAccessLog rows.
"""

import os
import sys
import uuid
import pytest
import asyncio
from datetime import datetime
from decimal import Decimal

# ── Path setup ─────────────────────────────────────────────────────────────────
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "shared")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "ingestion-service")))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# These imports also trigger model registration so Base.metadata knows all tables
from app.api.v1.ingestion import get_statement_customer_profile, extract_customer_details_from_text
from shared.database.models import (
    Base, Statement, Transaction, ProfileAccessLog, Customer, Account,
    IngestionAuditLog
)

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

FAKE_STATEMENT_TEXT = """\
Account Holder: Test User Alpha
Customer ID: CUST001
Account Number: 111199998888777
IFSC: TEST0001234
Branch: Main Test Branch
Email: alpha@test.com
Mobile: +91 98765 43210
Opening Date: 01 Jan '24
MICR: 560773001
CKYC Number: 10091234567890
Address: Flat 1, Test Street, Bangalore
"""


class DummyState:
    request_id = "rbac-test-req"


class DummyClient:
    host = "127.0.0.1"


class DummyRequest:
    def __init__(self, user_id: str, role: str = "analyst"):
        self.headers = {
            "x-user-id": user_id,
            "x-user-role": role,
        }
        self.state = DummyState()
        self.client = DummyClient()


async def _setup_db():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    session_factory = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    return engine, session_factory


async def _seed_statement(db: AsyncSession, ingestion_id: str, user_id: str) -> Statement:
    """Create a confirmed Statement with customer_profile_data already populated."""
    profile_data = extract_customer_details_from_text(FAKE_STATEMENT_TEXT, ingestion_id=ingestion_id)
    stmt = Statement(
        id=uuid.uuid4(),
        ingestion_id=ingestion_id,
        filename="test_statement.pdf",
        user_id=user_id,
        project_id="test_project",
        status="CONFIRMED",
        transaction_count=0,
        total_volume=Decimal("0.00"),
        currency="INR",
        duplicate_upload_count=0,
        created_at=datetime.utcnow(),
        last_attempted_upload_at=datetime.utcnow(),
        is_deleted=False,
        customer_profile_data=profile_data,
    )
    db.add(stmt)
    await db.commit()
    return stmt


# ══════════════════════════════════════════════════════════════════════════════
# Test 1 — Cross-user access denied (User B cannot see User A's statement)
# ══════════════════════════════════════════════════════════════════════════════
async def _test_cross_user_403():
    engine, factory = await _setup_db()
    ing_id = f"stmt_rbac_{uuid.uuid4().hex[:8]}"
    user_a = "user_alpha"
    user_b = "user_beta"

    async with factory() as db:
        await _seed_statement(db, ing_id, user_a)

    async with factory() as db:
        req = DummyRequest(user_id=user_b, role="analyst")
        try:
            await get_statement_customer_profile(req, ing_id, db)
            assert False, "Expected HTTP 403 but no exception raised"
        except Exception as exc:
            assert "403" in str(exc.status_code) or getattr(exc, "status_code", 0) == 403, \
                f"Expected 403, got: {exc}"
            # Verify response body has NO field data (HTTPException detail is a plain string)
            assert "account_number" not in str(exc.detail)
            assert "ckyc" not in str(exc.detail).lower()

    # Verify audit log row was written with result="denied"
    async with factory() as db:
        res = await db.execute(
            select(ProfileAccessLog).where(
                ProfileAccessLog.ingestion_id == ing_id,
                ProfileAccessLog.result == "denied",
            )
        )
        denied_row = res.scalars().first()
        assert denied_row is not None, "ProfileAccessLog denied row not found"
        assert denied_row.user_id == user_b
        assert denied_row.role_at_time == "analyst"

    await engine.dispose()
    print("✅ Test 1 (cross-user 403): PASSED")


# ══════════════════════════════════════════════════════════════════════════════
# Test 2 — Owner can access their own statement
# ══════════════════════════════════════════════════════════════════════════════
async def _test_owner_200():
    engine, factory = await _setup_db()
    ing_id = f"stmt_rbac_{uuid.uuid4().hex[:8]}"
    user_a = "user_alpha"

    async with factory() as db:
        await _seed_statement(db, ing_id, user_a)

    async with factory() as db:
        req = DummyRequest(user_id=user_a, role="analyst")
        response = await get_statement_customer_profile(req, ing_id, db)

    assert response.success is True, f"Expected success=True, got: {response}"
    profile = response.data
    assert isinstance(profile, dict), "Expected dict data"
    # At least the account_number field should be present since our seed text has it
    assert profile.get("account_number") == "111199998888777", \
        f"account_number mismatch: {profile.get('account_number')}"
    assert profile.get("ifsc") == "TEST0001234", f"ifsc mismatch: {profile.get('ifsc')}"

    await engine.dispose()
    print("✅ Test 2 (owner 200 + profile data): PASSED")


# ══════════════════════════════════════════════════════════════════════════════
# Test 3 — Investigator elevation: allowed + audit logged
# ══════════════════════════════════════════════════════════════════════════════
async def _test_investigator_elevation():
    engine, factory = await _setup_db()
    ing_id = f"stmt_rbac_{uuid.uuid4().hex[:8]}"
    user_a = "user_alpha"
    investigator = "investigator_007"

    async with factory() as db:
        await _seed_statement(db, ing_id, user_a)

    async with factory() as db:
        req = DummyRequest(user_id=investigator, role="investigator")
        response = await get_statement_customer_profile(req, ing_id, db)

    assert response.success is True
    profile = response.data
    # Privileged users get _field_confidence metadata
    assert "_field_confidence" in profile, "Expected _field_confidence for investigator"

    # Verify audit log shows allowed
    async with factory() as db:
        res = await db.execute(
            select(ProfileAccessLog).where(
                ProfileAccessLog.ingestion_id == ing_id,
                ProfileAccessLog.result == "allowed",
            )
        )
        allowed_row = res.scalars().first()
        assert allowed_row is not None, "ProfileAccessLog allowed row not found for investigator"
        assert allowed_row.role_at_time == "investigator"

    await engine.dispose()
    print("✅ Test 3 (investigator elevation + audit): PASSED")


# ══════════════════════════════════════════════════════════════════════════════
# Test 4 — Total audit rows = 3 (1 denied User B + 1 allowed User A + 1 allowed investigator)
# ══════════════════════════════════════════════════════════════════════════════
async def _test_audit_row_count():
    """
    Run all 3 access patterns against the SAME ingestion_id and verify 3 audit rows.
    """
    engine, factory = await _setup_db()
    ing_id = f"stmt_rbac_combined_{uuid.uuid4().hex[:8]}"
    user_a = "user_alpha"
    user_b = "user_beta"
    investigator = "investigator_007"

    async with factory() as db:
        await _seed_statement(db, ing_id, user_a)

    # Access 1: User B denied
    async with factory() as db:
        req = DummyRequest(user_id=user_b, role="analyst")
        try:
            await get_statement_customer_profile(req, ing_id, db)
        except Exception:
            pass  # Expected 403

    # Access 2: User A allowed
    async with factory() as db:
        req = DummyRequest(user_id=user_a, role="analyst")
        await get_statement_customer_profile(req, ing_id, db)

    # Access 3: Investigator allowed
    async with factory() as db:
        req = DummyRequest(user_id=investigator, role="investigator")
        await get_statement_customer_profile(req, ing_id, db)

    # Count audit rows
    async with factory() as db:
        res = await db.execute(
            select(ProfileAccessLog).where(ProfileAccessLog.ingestion_id == ing_id)
        )
        rows = res.scalars().all()
        assert len(rows) == 3, f"Expected 3 ProfileAccessLog rows, found {len(rows)}"

        results = {r.result for r in rows}
        assert "denied" in results, "Missing denied audit row"
        assert "allowed" in results, "Missing allowed audit row"

    await engine.dispose()
    print("✅ Test 4 (3 audit rows total): PASSED")


# ── pytest entry points ────────────────────────────────────────────────────────

def test_cross_user_403():
    asyncio.run(_test_cross_user_403())


def test_owner_200():
    asyncio.run(_test_owner_200())


def test_investigator_elevation():
    asyncio.run(_test_investigator_elevation())


def test_audit_row_count():
    asyncio.run(_test_audit_row_count())


if __name__ == "__main__":
    asyncio.run(_test_cross_user_403())
    asyncio.run(_test_owner_200())
    asyncio.run(_test_investigator_elevation())
    asyncio.run(_test_audit_row_count())
    print("\n🎉 All RBAC profile access tests passed!")
