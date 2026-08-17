import os
import sys
import uuid
import pytest
import asyncio
from datetime import datetime, timedelta
from decimal import Decimal

# Setup path so test can resolve shared package imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "shared")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "services", "ingestion-service")))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from app.api.v1.ingestion import list_ingestions, get_ingestion_summary, delete_ingestion
from app.migration_fix_statements import run_statement_migration
from sqlalchemy import select
from shared.database.models import (
    Base, Statement, IngestionAuditLog, Transaction, Customer, Account,
    RiskScore, Alert, Case, ExternalIntel, DeviceSession, KYCRecord,
    ModelFeedback, ProfileAccessLog
)

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

class DummyRequest:
    def __init__(self, headers=None, state=None):
        self.headers = headers or {}
        class State:
            request_id = "test-req-reg-123"
        self.state = state or State()


async def _run_full_ingestion_dashboard_flow_test():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        ing_id = f"user_reg_{uuid.uuid4()}"
        stmt_id = uuid.uuid4()

        # Create statement & transaction records simulating normal upload
        stmt = Statement(
            id=stmt_id,
            ingestion_id=ing_id,
            filename="full_ledger.csv",
            file_hash="hash_9988",
            user_id="user_reg",
            project_id="default",
            status="CONFIRMED",
            transaction_count=15,
            total_volume=Decimal("25000.50"),
            currency="USD",
            duplicate_upload_count=0,
            is_deleted=False
        )
        tx = Transaction(
            id=uuid.uuid4(),
            ingestion_id=ing_id,
            transaction_id=f"TX_{uuid.uuid4()}",
            sender_account="ACC-REG-1",
            receiver_account="ACC-REG-2",
            amount=Decimal("25000.50"),
            currency="USD",
            timestamp=datetime.utcnow(),
            transaction_type="TRANSFER",
            payment_channel="SWIFT",
            status="CONFIRMED",
            fingerprint=f"fp_{uuid.uuid4()}"
        )
        db.add_all([stmt, tx])
        await db.commit()

        # 1. Assert statement appears in dashboard list API
        req = DummyRequest(headers={"x-user-id": "user_reg"})
        list_res = await list_ingestions(req, uploader_id=None, project_id="default", db=db)
        assert list_res.success is True
        assert len(list_res.data) >= 1
        found_item = next((it for it in list_res.data if it.ingestion_id == ing_id), None)
        assert found_item is not None
        assert found_item.transaction_count == 15
        assert found_item.total_volume == 25000.50

        # 2. Assert summary aggregate card endpoint returns non-zero metrics
        summary_res = await get_ingestion_summary(req, ingestion_id=ing_id, db=db)
        assert summary_res.success is True
        s_data = summary_res.data
        assert s_data.total_transactions == 1
        assert s_data.total_volume == 25000.50
        assert s_data.total_accounts == 2

    await engine.dispose()


def test_full_ingestion_dashboard_flow():
    asyncio.run(_run_full_ingestion_dashboard_flow_test())


async def _run_migration_backfill_sanity_test():
    """
    Smoke test / Migration sanity check:
    Simulates database with un-migrated Transaction batches.
    Verifies that running run_statement_migration creates Statement records
    so count of visible statements does not drop to 0.
    """
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as db:
        legacy_ing_id = f"legacy_user_{uuid.uuid4()}"
        tx1 = Transaction(
            id=uuid.uuid4(),
            ingestion_id=legacy_ing_id,
            transaction_id=f"TX_LEGACY_1",
            sender_account="ACC-LEGACY-1",
            receiver_account="ACC-LEGACY-2",
            amount=Decimal("1500.00"),
            currency="USD",
            timestamp=datetime.utcnow(),
            transaction_type="TRANSFER",
            payment_channel="ACH",
            status="CONFIRMED",
            fingerprint=f"fp_leg_1"
        )
        db.add(tx1)
        await db.commit()

        # Run corrective migration
        res = await run_statement_migration(db)
        assert res["backfilled_statements"] == 1

        # Query statements list
        req = DummyRequest(headers={"x-user-id": "legacy_user"})
        list_res = await list_ingestions(req, uploader_id=None, project_id="default", db=db)
        assert len(list_res.data) >= 1
        item = list_res.data[0]
        assert item.ingestion_id == legacy_ing_id
        assert item.transaction_count == 1
        assert item.total_volume == 1500.00

    await engine.dispose()


def test_migration_backfill_sanity():
    asyncio.run(_run_migration_backfill_sanity_test())
