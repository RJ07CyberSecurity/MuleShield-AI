import uuid
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth import User, Role, Permission

class AuthRepository:
    """
    SQLAlchemy async repository for managing User, Role, and Permission persistence.
    """
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        """
        Retrieves a user by UUID, eager-loading roles and nested permissions.
        """
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(User.id == user_id)
        )
        return result.scalars().first()

    async def get_user_by_email(self, email: str) -> User | None:
        """
        Retrieves a user by email, eager-loading roles and nested permissions.
        """
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .where(User.email == email)
        )
        return result.scalars().first()

    async def create_user(self, user: User) -> User:
        """
        Adds a new user to the session. Commits are handled at service layer boundary.
        """
        self.session.add(user)
        await self.session.flush()  # Populates user.id and timestamps
        return user

    async def get_role_by_name(self, name: str) -> Role | None:
        """
        Retrieves a role by its unique name, eager-loading its permissions.
        """
        result = await self.session.execute(
            select(Role)
            .options(selectinload(Role.permissions))
            .where(Role.name == name)
        )
        return result.scalars().first()

    async def create_role(self, role: Role) -> Role:
        """
        Saves a new Role record.
        """
        self.session.add(role)
        await self.session.flush()
        return role

    async def get_permission_by_name(self, name: str) -> Permission | None:
        """
        Retrieves a permission by name.
        """
        result = await self.session.execute(
            select(Permission)
            .where(Permission.name == name)
        )
        return result.scalars().first()

    async def create_permission(self, permission: Permission) -> Permission:
        """
        Saves a new Permission record.
        """
        self.session.add(permission)
        await self.session.flush()
        return permission

    async def list_users(self) -> list[User]:
        """
        Returns all registered users with pre-loaded roles.
        """
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(Role.permissions))
            .order_index(User.created_at.desc()) if hasattr(User, "created_at") else select(User)
        )
        # Fallback without ordering if created_at check fails
        if not hasattr(User, "created_at"):
            result = await self.session.execute(
                select(User).options(selectinload(User.roles).selectinload(Role.permissions))
            )
        return list(result.scalars().all())

    async def list_roles(self) -> list[Role]:
        """
        Returns all roles and their associated permissions.
        """
        result = await self.session.execute(
            select(Role).options(selectinload(Role.permissions))
        )
        return list(result.scalars().all())
