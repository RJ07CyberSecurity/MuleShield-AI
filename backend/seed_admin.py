import asyncio
import sys
import os
sys.path.append(os.path.abspath('e:\\MuleShieldAI\\backend\\services\\auth-service'))
sys.path.append(os.path.abspath('e:\\MuleShieldAI\\backend\\shared\\src'))
from shared.database import get_db_session, db_manager
from shared.config import settings
from app.repository.auth_repository import AuthRepository
from shared.authentication.jwt import PasswordHasher
from app.models.auth import User, Role
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def main():
    db_manager.init('sqlite+aiosqlite:///e:/MuleShieldAI/muleshield.db')
    async for session in get_db_session():
        repo = AuthRepository(session)
        admin_role = await repo.get_role_by_name('administrator')
        user = await repo.get_user_by_email('rudrajoshi2586@gmail.com')
        if not user:
            user = User(email='rudrajoshi2586@gmail.com', first_name='Rudra', last_name='Joshi', hashed_password=PasswordHasher.hash_password('Rudra@#$%1565'), is_active=True, is_mfa_enabled=True)
            user.roles.append(admin_role)
            repo.session.add(user)
            print('Admin user created.')
        else:
            user.hashed_password = PasswordHasher.hash_password('Rudra@#$%1565')
            user.is_mfa_enabled = True
            if admin_role not in user.roles:
                user.roles.append(admin_role)
            print('Admin user updated.')
        await session.commit()
        break
    await db_manager.close()

if __name__ == "__main__":
    asyncio.run(main())
