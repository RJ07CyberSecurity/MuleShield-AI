import asyncio
import logging
from shared.database import Base, db_manager
from app.main import settings, seed_default_rbac
from app.models.auth import User, Role
from sqlalchemy import select
from shared.authentication import PasswordHasher

logging.basicConfig(level=logging.INFO)

async def main():
    db_manager.init(
        connection_string=settings.async_postgres_url,
        pool_size=5,
        max_overflow=10
    )
    
    async with db_manager._engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    sessionmaker = db_manager.get_sessionmaker()
    if sessionmaker:
        async with sessionmaker() as session:
            await seed_default_rbac(session)
            
            # Upsert admin user
            res_admin = await session.execute(select(User).where(User.email == "rudrajoshi2586@gmail.com"))
            admin_user = res_admin.scalars().first()
            
            res_role = await session.execute(select(Role).where(Role.name == "administrator"))
            admin_role = res_role.scalars().first()
            
            hashed_pass = PasswordHasher.hash_password("Rudra@#$%1565")
            
            if not admin_user:
                admin_user = User(
                    email="rudrajoshi2586@gmail.com",
                    hashed_password=hashed_pass,
                    first_name="Rudra",
                    last_name="Joshi",
                    is_active=True,
                    is_mfa_enabled=False
                )
                if admin_role:
                    admin_user.roles.append(admin_role)
                session.add(admin_user)
            else:
                admin_user.hashed_password = hashed_pass
                admin_user.is_active = True
                if admin_role and admin_role not in admin_user.roles:
                    admin_user.roles.append(admin_role)
            
            await session.commit()
            print("Successfully updated admin user in PostgreSQL!")

if __name__ == "__main__":
    asyncio.run(main())
