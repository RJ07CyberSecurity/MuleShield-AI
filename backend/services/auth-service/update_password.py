import asyncio
import os
import sys
import bcrypt

# Ensure backend imports work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "shared")))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update
from app.models.auth import User

async def update_password(email: str, raw_password: str):
    db_url = "sqlite+aiosqlite:///e:/MuleShieldAI/muleshield.db"
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    hashed = bcrypt.hashpw(raw_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    async with async_session() as session:
        # Find user
        user_stmt = select(User).where(User.email == email)
        user_res = await session.execute(user_stmt)
        user = user_res.scalars().first()
        
        if not user:
            print(f"User {email} not found.")
            return

        user.hashed_password = hashed
        await session.commit()
        print(f"Password for {email} successfully updated.")

if __name__ == "__main__":
    asyncio.run(update_password("rudrajoshi2586@gmail.com", "Rudra@#$%1565"))
