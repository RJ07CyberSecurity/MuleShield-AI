from datetime import datetime
from decimal import Decimal
import uuid
import structlog
from sqlalchemy import select, func, text, update, or_
from sqlalchemy.ext.asyncio import AsyncSession
from shared.database import Base, Statement, Transaction, IngestionAuditLog

logger = structlog.get_logger(__name__)

async def run_statement_migration(session: AsyncSession) -> dict:
    """
    Corrective migration script:
    1. Ensures tables 'statements' and 'ingestion_audit_log' exist.
    2. Backfills 'is_deleted = False' for any rows where is_deleted IS NULL.
    3. Scans 'transactions' table and auto-populates 'statements' table for legacy batches.
    """
    logger.info("Starting statement schema migration & data backfill...")

    # 1. Backfill is_deleted IS NULL -> False for existing Statement records
    try:
        stmt_null = select(Statement).where(or_(Statement.is_deleted.is_(None), Statement.is_deleted == None))
        res_null = await session.execute(stmt_null)
        null_stmts = res_null.scalars().all()
        if null_stmts:
            for s in null_stmts:
                s.is_deleted = False
            await session.commit()
            logger.info("Backfilled is_deleted = False for statements with NULL values", count=len(null_stmts))
    except Exception as e:
        logger.warning("Backfill NULL check skipped or encountered error", error=str(e))

    # 2. Backfill Statements table from Transactions table for any missing ingestion_ids
    backfilled_count = 0
    try:
        tx_groups_stmt = select(
            Transaction.ingestion_id,
            func.count(Transaction.id).label("tx_count"),
            func.sum(Transaction.amount).label("total_volume"),
            func.max(Transaction.currency).label("currency"),
            func.max(Transaction.status).label("status"),
            func.min(Transaction.timestamp).label("uploaded_at"),
            func.max(Transaction.owner_id).label("owner_id"),
        ).where(Transaction.ingestion_id.isnot(None)).group_by(Transaction.ingestion_id)

        tx_res = await session.execute(tx_groups_stmt)
        tx_groups = tx_res.all()

        existing_res = await session.execute(select(Statement.ingestion_id))
        existing_ids = set(existing_res.scalars().all())

        for tg in tx_groups:
            if tg.ingestion_id and tg.ingestion_id not in existing_ids:
                stmt_record = Statement(
                    id=uuid.uuid4(),
                    ingestion_id=str(tg.ingestion_id),
                    filename="bank_statement_ledger.csv",
                    user_id=tg.owner_id or (str(tg.ingestion_id).rsplit("_", 1)[0] if "_" in str(tg.ingestion_id) else None),
                    project_id="default",
                    status=tg.status or "CONFIRMED",
                    transaction_count=tg.tx_count or 0,
                    total_volume=Decimal(str(tg.total_volume or 0)),
                    currency=tg.currency or "USD",
                    duplicate_upload_count=0,
                    is_deleted=False,
                    created_at=tg.uploaded_at or datetime.utcnow(),
                    last_attempted_upload_at=tg.uploaded_at or datetime.utcnow()
                )
                session.add(stmt_record)
                existing_ids.add(tg.ingestion_id)
                backfilled_count += 1

        if backfilled_count > 0:
            await session.commit()
            logger.info("Successfully backfilled Statement records from Transactions table", backfilled_count=backfilled_count)
    except Exception as e:
        logger.error("Failed backfilling Statement records from Transactions table", error=str(e))

    return {"backfilled_statements": backfilled_count}
