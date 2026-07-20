import uuid
import time
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.auth import User
from app.repository.auth_repository import AuthRepository
from app.services.auth_service import AuthService
from shared.config import BaseAppSettings
from shared.database import get_db_session, get_redis
from shared.exceptions import AuthenticationException, AuthorizationException
from shared.authentication import decode_token
import structlog

logger = structlog.get_logger(__name__)

class DependencySettings(BaseAppSettings):
    pass

settings = DependencySettings()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False
)


async def get_auth_repository(session: AsyncSession = Depends(get_db_session)) -> AuthRepository:
    """
    Dependency yielding the AuthRepository instance.
    """
    return AuthRepository(session)


async def get_auth_service(
    repository: AuthRepository = Depends(get_auth_repository),
    redis: Redis = Depends(get_redis)
) -> AuthService:
    """
    Dependency yielding the AuthService instance.
    """
    return AuthService(
        repository=repository,
        redis=redis,
        jwt_secret=settings.JWT_SECRET_KEY,
        jwt_algorithm=settings.JWT_ALGORITHM,
        access_token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_token_expire_minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES,
        mfa_issuer=settings.MFA_ISSUER
    )


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    redis: Redis = Depends(get_redis),
    repository: AuthRepository = Depends(get_auth_repository)
) -> User:
    """
    FastAPI dependency that extracts the active user session from JWT.
    Throws 401 AuthenticationException if token is missing, expired, or blacklisted.
    """
    if not token:
        raise AuthenticationException("Missing authentication token.")

    # 1. Decode token
    payload = decode_token(
        token=token,
        secret_key=settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    jti = payload.get("jti")
    user_id_str = payload.get("sub")
    
    if not jti or not user_id_str:
        raise AuthenticationException("Invalid token claims.")

    # 2. Check Redis revocation blacklist (skip if Redis is unavailable - SQLite local dev)
    if redis is not None:
        try:
            is_revoked = await redis.get(f"blacklist:{jti}")
            if is_revoked:
                logger.warning("Revoked access token usage blocked", token_id=jti, user_id=user_id_str)
                raise AuthenticationException("Session token has been revoked.")
        except AuthenticationException:
            raise
        except Exception as redis_err:
            logger.warning("Redis check failed, skipping blacklist validation", error=str(redis_err))

    # 3. Retrieve user record
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError as exc:
        raise AuthenticationException("Invalid user identity format.") from exc

    user = await repository.get_user_by_id(user_id)
    if not user:
        raise AuthenticationException("User record not found.")

    if not user.is_active:
        raise AuthenticationException("User account is disabled.")

    return user


class RoleChecker:
    """
    RBAC dependency factory checking if the logged-in user belongs to allowed roles.
    Bypasses validation if user has the 'administrator' role.
    """
    def __init__(self, allowed_roles: list[str]) -> None:
        self.allowed_roles = set(allowed_roles)

    async def __call__(self, current_user: User = Depends(get_current_user)) -> bool:
        user_roles = {role.name for role in current_user.roles}
        
        # Super-user bypass
        if "administrator" in user_roles:
            return True

        if not user_roles.intersection(self.allowed_roles):
            logger.warning(
                "Access denied: insufficient roles",
                user_id=str(current_user.id),
                user_roles=list(user_roles),
                required_roles=list(self.allowed_roles)
            )
            raise AuthorizationException("Access denied: insufficient role privileges.")
            
        return True


class PermissionChecker:
    """
    RBAC dependency factory checking if the logged-in user possesses required permissions.
    """
    def __init__(self, required_permissions: list[str]) -> None:
        self.required_permissions = set(required_permissions)

    async def __call__(self, current_user: User = Depends(get_current_user)) -> bool:
        user_permissions = set()
        for role in current_user.roles:
            for perm in role.permissions:
                user_permissions.add(perm.name)

        # Super-user bypass
        user_roles = {role.name for role in current_user.roles}
        if "administrator" in user_roles:
            return True

        missing_perms = self.required_permissions - user_permissions
        if missing_perms:
            logger.warning(
                "Access denied: missing permissions",
                user_id=str(current_user.id),
                missing_permissions=list(missing_perms)
            )
            raise AuthorizationException("Access denied: missing required permissions.")

        return True
