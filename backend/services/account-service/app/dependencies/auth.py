from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from shared.config import BaseAppSettings
from shared.authentication import decode_token
from shared.exceptions import AuthenticationException, AuthorizationException
import structlog

logger = structlog.get_logger(__name__)

class DependencySettings(BaseAppSettings):
    pass

settings = DependencySettings()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False
)


async def get_token_claims(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependency that decodes the bearer JWT token statelessly, returning user claims.
    """
    if not token:
        raise AuthenticationException("Missing authentication token.")

    payload = decode_token(
        token=token,
        secret_key=settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return payload


class RoleChecker:
    """
    Stateless RBAC role verification.
    """
    def __init__(self, allowed_roles: list[str]) -> None:
        self.allowed_roles = set(allowed_roles)

    async def __call__(self, payload: dict = Depends(get_token_claims)) -> bool:
        roles = payload.get("roles", [])
        
        if "administrator" in roles:
            return True

        if not set(roles).intersection(self.allowed_roles):
            logger.warning(
                "Access denied downstream: insufficient roles",
                user_id=payload.get("sub"),
                roles=roles,
                required_roles=list(self.allowed_roles)
            )
            raise AuthorizationException("Access denied: insufficient role privileges.")
            
        return True
