import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, and_, or_
from shared.database.models import Transaction

async def main():
    engine = create_async_engine('sqlite+aiosqlite:///e:/MuleShieldAI/muleshield.db')
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        actual_owner_id = '6ee51a49-a02c-478f-8533-c4d57e555831'
        fingerprints = ['test1', 'test2']
        tx_ids = []
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
        print("Matches:", res.all())

asyncio.run(main())
