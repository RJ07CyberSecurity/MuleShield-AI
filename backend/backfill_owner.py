import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update
from shared.database.models import Transaction

async def main():
    engine = create_async_engine('sqlite+aiosqlite:///e:/MuleShieldAI/muleshield.db')
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        res = await db.execute(select(Transaction.ingestion_id).where(Transaction.owner_id.is_(None)))
        ingestion_ids = set(r[0] for r in res.all() if r[0])
        
        for ing_id in ingestion_ids:
            # ingestion_id is in format uploader_id_uuid
            parts = ing_id.split('_')
            if len(parts) == 2:
                owner_id = parts[0]
                await db.execute(
                    update(Transaction)
                    .where(Transaction.ingestion_id == ing_id)
                    .values(owner_id=owner_id)
                )
                print(f"Updated owner_id for {ing_id} to {owner_id}")
                
        await db.commit()
        print("Database backfill complete.")

asyncio.run(main())
