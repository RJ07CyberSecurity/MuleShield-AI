import asyncio
import os
import sys

# Ensure backend imports work
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "shared")))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, insert
from app.models.auth import User, Role, user_roles

async def make_admin(email: str):
    db_url = "sqlite+aiosqlite:///e:/MuleShieldAI/muleshield.db"
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Find user
        user_stmt = select(User).where(User.email == email)
        user_res = await session.execute(user_stmt)
        user = user_res.scalars().first()
        
        if not user:
            print(f"User {email} not found.")
            return

        # Find role
        role_stmt = select(Role).where(Role.name.in_(["admin", "administrator"]))
        role_res = await session.execute(role_stmt)
        roles = role_res.scalars().all()
        
        if not roles:
            print("No admin role found in the database. Creating one...")
            admin_role = Role(name="administrator", description="System Administrator")
            session.add(admin_role)
            await session.commit()
            roles = [admin_role]
            
        admin_role = roles[0]
        
        # Check if already has role
        stmt = select(user_roles).where(user_roles.c.user_id == user.id, user_roles.c.role_id == admin_role.id)
        res = await session.execute(stmt)
        if res.first():
            print(f"User {email} is already an admin.")
            return
            
        # Insert role mapping
        ins_stmt = insert(user_roles).values(user_id=user.id, role_id=admin_role.id)
        await session.execute(ins_stmt)
        await session.commit()
        print(f"User {email} successfully upgraded to admin.")

if __name__ == "__main__":
    asyncio.run(make_admin("rudrajoshi2586@gmail.com"))
