import asyncio
import uuid
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from shared.database.models import Transaction
from datetime import datetime

async def main():
    engine = create_async_engine('sqlite+aiosqlite:///e:/MuleShieldAI/muleshield.db')
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        actual_owner_id = '6ee51a49-a02c-478f-8533-c4d57e555831'
        row_data = {
            "id": uuid.uuid4(),
            "ingestion_id": "test",
            "transaction_id": "6ee51a49-a02c-478f-8533-c4d57e555831_12345",
            "sender_account": "abc",
            "receiver_account": "def",
            "amount": 10.0,
            "currency": "USD",
            "timestamp": datetime.now(),
            "transaction_type": "TRANSFER",
            "payment_channel": "SWIFT",
            "status": "STAGED",
            "fingerprint": "hash123",
            "owner_id": actual_owner_id,
        }
        try:
            async with db.begin_nested():
                tx = Transaction(**row_data)
                db.add(tx)
            await db.commit()
            print("Inserted!")
        except Exception as e:
            print("Exception:", type(e), e)

asyncio.run(main())
