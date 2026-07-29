import asyncio
import os
import sys

# Ensure backend root is in PYTHONPATH so absolute imports like 'app.models.auth' and 'shared' work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.models.auth import AuditLog
import shared.database.encryption

async def main():
    # Use the same database URL as your app/test scripts. Adjust if needed.
    engine = create_async_engine('sqlite+aiosqlite:///e:/MuleShieldAI/muleshield.db')
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        result = await db.execute(select(AuditLog).order_by(AuditLog.login_time.desc()))
        logs = result.scalars().all()
        
        print(f"Found {len(logs)} Audit Logs:\n")
        
        for log in logs:
            print(f"Log ID: {log.id}")
            print(f"User ID: {log.user_id}")
            print(f"Login Time: {log.login_time}")
            print(f"Logout Time: {log.logout_time}")
            print(f"Duration: {log.duration_seconds} seconds")
            print(f"Date: {log.date_logged}")
            # SQLAlchemy EncryptedString automatically decrypts this field when querying
            print(f"Access Details (Decrypted): {log.access_details}")
            print("-" * 40)

if __name__ == "__main__":
    asyncio.run(main())
