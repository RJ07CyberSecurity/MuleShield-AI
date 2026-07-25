import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text

async def main():
    engine = create_async_engine('sqlite+aiosqlite:///e:/MuleShieldAI/muleshield.db')
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        res = await db.execute(text("SELECT owner_id, count(*) FROM transactions GROUP BY owner_id"))
        print("DB State:", res.fetchall())

asyncio.run(main())
