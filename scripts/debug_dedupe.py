import sys, os, asyncio
sys.path.insert(0, 'E:/MuleShieldAI/backend/shared')
sys.path.insert(0, 'E:/MuleShieldAI/backend/services/ingestion-service')

from app.api.v1.ingestion import parse_pdf
import hashlib

async def main():
    from shared.database.database import get_db_session
    from sqlalchemy.future import select
    from shared.database.models import Transaction

    with open('E:/MuleShieldAI/fixtures/last_uploaded.pdf', 'rb') as f:
        pdf_bytes = f.read()

    valid, invalid = parse_pdf(pdf_bytes)
    fingerprints = []
    for row in valid:
        fp_raw = f"{row['sender_account']}:{row['receiver_account']}:{float(row['amount'])}:{row['currency']}:{row['timestamp'].isoformat()}"
        fp = hashlib.sha256(fp_raw.encode()).hexdigest()
        fingerprints.append(fp)
    
    print(f"Total parsed: {len(valid)}")
    print(f"Unique fingerprints in batch: {len(set(fingerprints))}")

    async for db in get_db_session():
        stmt = select(Transaction.fingerprint).where(Transaction.fingerprint.in_(fingerprints))
        res = await db.execute(stmt)
        matches = res.scalars().all()
        print(f"Matches in DB: {len(matches)}")
        break

asyncio.run(main())
