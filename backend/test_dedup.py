import asyncio
import hashlib
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, and_, or_
from shared.database.models import Transaction
from datetime import datetime

async def main():
    engine = create_async_engine('sqlite+aiosqlite:///e:/MuleShieldAI/muleshield.db')
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        # Get one row from be97
        res = await db.execute(select(Transaction).where(Transaction.owner_id == 'be9719d6-8714-479b-b3c0-605972a8d074').limit(2))
        rows = res.scalars().all()
        
        valid_rows = []
        for r in rows:
            valid_rows.append({
                "transaction_id": r.transaction_id,
                "sender_account": r.sender_account,
                "receiver_account": r.receiver_account,
                "amount": float(r.amount),
                "currency": r.currency,
                "timestamp": r.timestamp,
                "transaction_type": r.transaction_type,
                "payment_channel": r.payment_channel,
                "ifsc": r.ifsc,
                "bank_name": r.bank_name,
                "branch": r.branch,
                "beneficiary": r.beneficiary,
                "purpose": r.purpose,
            })
            
        actual_owner_id = '6ee51a49-a02c-478f-8533-c4d57e555831'
        print("actual_owner_id:", actual_owner_id)
        
        # Deduplication check logic
        for row in valid_rows:
            fp_raw = f"{actual_owner_id}:{row['sender_account']}:{row['receiver_account']}:{float(row['amount'])}:{row['currency']}:{row['timestamp'].isoformat()}"
            row["fingerprint"] = hashlib.sha256(fp_raw.encode()).hexdigest()
            print("Generated Fingerprint:", row["fingerprint"])
            if row.get("transaction_id"):
                row["transaction_id"] = f"{actual_owner_id}_{row['transaction_id']}"

        tx_ids = [r["transaction_id"] for r in valid_rows if r["transaction_id"]]
        fingerprints = [r["fingerprint"] for r in valid_rows]
        
        stmt = select(Transaction.transaction_id, Transaction.fingerprint).where(
            and_(
                or_(
                    Transaction.transaction_id.in_(tx_ids) if tx_ids else False,
                    Transaction.fingerprint.in_(fingerprints)
                ),
                Transaction.owner_id == actual_owner_id
            )
        )
        res = await db.execute(stmt)
        matches = res.all()
        print("Matches returned from DB:", matches)
        
        matched_ids = {m[0] for m in matches if m[0]}
        matched_fps = {m[1] for m in matches if m[1]}
        
        duplicate_count = 0
        seen_tx_ids = set()
        seen_fingerprints = set()
        
        for i, row in enumerate(valid_rows):
            print(f"Row {i} - TX: {row.get('transaction_id')}, FP: {row['fingerprint']}")
            if (row["transaction_id"] and row["transaction_id"] in matched_ids) or (row["fingerprint"] in matched_fps):
                print(f"Row {i} skipped by DB match")
                duplicate_count += 1
                continue
                
            if row["fingerprint"] in seen_fingerprints:
                print(f"Row {i} skipped by seen_fingerprints")
                duplicate_count += 1
                continue
            seen_fingerprints.add(row["fingerprint"])
            
            if row["transaction_id"]:
                if row["transaction_id"] in seen_tx_ids:
                    row["transaction_id"] = None
                else:
                    seen_tx_ids.add(row["transaction_id"])
                    
            print(f"Row {i} successfully staged!")
            
        print("Final duplicate_count:", duplicate_count)

asyncio.run(main())
