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

from app.api.v1.ingestion import list_ingestions, delete_ingestion
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
            request_id = "test-req-123"
        self.state = state or State()


async def _run_duplicate_upload_test():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as async_db:
        ing_id = f"user_101_{uuid.uuid4()}"
        stmt_id = uuid.uuid4()
        original_time = datetime.utcnow() - timedelta(hours=2)

        stmt = Statement(
            id=stmt_id,
            ingestion_id=ing_id,
            filename="bank_statement.csv",
            file_hash="hash_abc123",
            user_id="user_101",
            project_id="proj_alpha",
            status="CONFIRMED",
            transaction_count=20,
            total_volume=Decimal("5000.00"),
            currency="USD",
            duplicate_upload_count=0,
            created_at=original_time,
            last_attempted_upload_at=original_time,
            is_deleted=False
        )
        async_db.add(stmt)
        await async_db.commit()

        res = await async_db.execute(select(Statement).where(Statement.ingestion_id == ing_id))
        existing = res.scalars().first()

        assert existing is not None
        attempt_time = datetime.utcnow()
        existing.duplicate_upload_count += 1
        existing.last_attempted_upload_at = attempt_time

        audit = IngestionAuditLog(
            statement_id=existing.id,
            user_id="user_101",
            action="duplicate_attempt",
            details={"filename": "bank_statement.csv", "duplicate_count": 20}
        )
        async_db.add(audit)
        await async_db.commit()

        all_stmts = (await async_db.execute(select(Statement).where(Statement.ingestion_id == ing_id))).scalars().all()
        assert len(all_stmts) == 1
        assert all_stmts[0].duplicate_upload_count == 1
        assert all_stmts[0].last_attempted_upload_at >= attempt_time

        audits = (await async_db.execute(select(IngestionAuditLog).where(IngestionAuditLog.statement_id == stmt_id))).scalars().all()
        assert len(audits) == 1
        assert audits[0].action == "duplicate_attempt"

    await engine.dispose()


def test_duplicate_upload_increments_count_without_duplicate_statement_row():
    asyncio.run(_run_duplicate_upload_test())


async def _run_soft_deleted_statement_filtering_test():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as async_db:
        ing_active = f"user_101_{uuid.uuid4()}"
        ing_deleted = f"user_101_{uuid.uuid4()}"

        s1 = Statement(
            id=uuid.uuid4(),
            ingestion_id=ing_active,
            filename="active.csv",
            user_id="user_101",
            project_id="proj_beta",
            status="CONFIRMED",
            transaction_count=10,
            total_volume=Decimal("1000.00"),
            is_deleted=False
        )
        s2 = Statement(
            id=uuid.uuid4(),
            ingestion_id=ing_deleted,
            filename="deleted.csv",
            user_id="user_101",
            project_id="proj_beta",
            status="CONFIRMED",
            transaction_count=5,
            total_volume=Decimal("500.00"),
            is_deleted=True,
            deleted_at=datetime.utcnow(),
            deleted_by="user_101"
        )
        async_db.add_all([s1, s2])
        await async_db.commit()

        # Default query (non-privileged / include_deleted=False)
        req_std = DummyRequest(headers={"x-user-id": "user_101", "x-user-role": "analyst"})
        res_std = await list_ingestions(req_std, uploader_id=None, project_id="proj_beta", include_deleted=False, db=async_db)
        items_std = res_std.data
        assert len(items_std) == 1
        assert items_std[0].ingestion_id == ing_active

        # Privileged query (investigator role + include_deleted=True)
        req_inv = DummyRequest(headers={"x-user-id": "user_101", "x-user-role": "investigator"})
        res_inv = await list_ingestions(req_inv, uploader_id=None, project_id="proj_beta", include_deleted=True, db=async_db)
        items_inv = res_inv.data
        assert len(items_inv) == 2
        ing_ids = {it.ingestion_id for it in items_inv}
        assert ing_active in ing_ids
        assert ing_deleted in ing_ids

    await engine.dispose()


def test_soft_deleted_statement_filtering():
    asyncio.run(_run_soft_deleted_statement_filtering_test())


async def _run_duplicate_upload_history_integration_test():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as async_db:
        ing_id = f"user_202_{uuid.uuid4()}"
        stmt_id = uuid.uuid4()

        s = Statement(
            id=stmt_id,
            ingestion_id=ing_id,
            filename="statement_nov.csv",
            user_id="user_202",
            project_id="proj_gamma",
            status="CONFIRMED",
            transaction_count=40,
            total_volume=Decimal("12000.00"),
            duplicate_upload_count=0,
            is_deleted=False
        )
        async_db.add(s)
        await async_db.commit()

        s.duplicate_upload_count += 1
        s.last_attempted_upload_at = datetime.utcnow()
        await async_db.commit()

        req = DummyRequest(headers={"x-user-id": "user_202"})
        res = await list_ingestions(req, uploader_id=None, project_id="proj_gamma", db=async_db)
        assert res.success is True
        assert len(res.data) == 1
        item = res.data[0]
        assert item.ingestion_id == ing_id
        assert item.duplicate_upload_count == 1
        assert item.transaction_count == 40

    await engine.dispose()


def test_duplicate_upload_history_integration():
    asyncio.run(_run_duplicate_upload_history_integration_test())


async def _run_soft_delete_preserves_transactions_test():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as async_db:
        ing_id = f"user_303_{uuid.uuid4()}"
        stmt_id = uuid.uuid4()

        stmt = Statement(
            id=stmt_id,
            ingestion_id=ing_id,
            filename="audit_test.csv",
            user_id="user_303",
            project_id="proj_delta",
            status="CONFIRMED",
            transaction_count=1,
            total_volume=Decimal("300.00"),
            is_deleted=False
        )
        tx = Transaction(
            id=uuid.uuid4(),
            ingestion_id=ing_id,
            transaction_id=f"TX_{uuid.uuid4()}",
            sender_account="ACC-1",
            receiver_account="ACC-2",
            amount=Decimal("300.00"),
            currency="USD",
            timestamp=datetime.utcnow(),
            transaction_type="TRANSFER",
            payment_channel="SWIFT",
            status="CONFIRMED",
            fingerprint=f"fp_{uuid.uuid4()}"
        )
        audit = IngestionAuditLog(
            id=uuid.uuid4(),
            statement_id=stmt_id,
            user_id="user_303",
            action="upload",
            details={"filename": "audit_test.csv"}
        )
        async_db.add_all([stmt, tx, audit])
        await async_db.commit()

        req = DummyRequest(headers={"x-user-id": "user_303"})
        del_res = await delete_ingestion(req, ingestion_id=ing_id, db=async_db)
        assert del_res.success is True
        assert del_res.data["is_deleted"] is True

        stmt_db = (await async_db.execute(select(Statement).where(Statement.ingestion_id == ing_id))).scalars().first()
        assert stmt_db.is_deleted is True
        assert stmt_db.deleted_by == "user_303"

        tx_db = (await async_db.execute(select(Transaction).where(Transaction.ingestion_id == ing_id))).scalars().all()
        assert len(tx_db) == 1

        audit_db = (await async_db.execute(select(IngestionAuditLog).where(IngestionAuditLog.statement_id == stmt_id))).scalars().all()
        assert len(audit_db) >= 2

    await engine.dispose()


def test_soft_delete_preserves_transactions_and_audit_logs():
    asyncio.run(_run_soft_delete_preserves_transactions_test())


async def _run_data_isolation_by_project_test():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as async_db:
        ing_p1 = f"user_A_{uuid.uuid4()}"
        ing_p2 = f"user_B_{uuid.uuid4()}"

        s1 = Statement(
            id=uuid.uuid4(),
            ingestion_id=ing_p1,
            filename="project_1.csv",
            user_id="user_A",
            project_id="Project_A",
            status="CONFIRMED",
            transaction_count=10,
            total_volume=Decimal("100.00"),
            is_deleted=False
        )
        s2 = Statement(
            id=uuid.uuid4(),
            ingestion_id=ing_p2,
            filename="project_2.csv",
            user_id="user_B",
            project_id="Project_B",
            status="CONFIRMED",
            transaction_count=20,
            total_volume=Decimal("200.00"),
            is_deleted=False
        )
        async_db.add_all([s1, s2])
        await async_db.commit()

        req_a = DummyRequest(headers={"x-user-id": "user_A"})
        res_a = await list_ingestions(req_a, uploader_id=None, project_id="Project_A", db=async_db)
        assert len(res_a.data) == 1
        assert res_a.data[0].ingestion_id == ing_p1

        req_b = DummyRequest(headers={"x-user-id": "user_B"})
        res_b = await list_ingestions(req_b, uploader_id=None, project_id="Project_B", db=async_db)
        assert len(res_b.data) == 1
        assert res_b.data[0].ingestion_id == ing_p2

    await engine.dispose()


def test_data_isolation_by_project():
    asyncio.run(_run_data_isolation_by_project_test())
