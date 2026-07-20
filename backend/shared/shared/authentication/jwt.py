from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Any
import uuid
import bcrypt
import jwt
import structlog
from shared.exceptions import AuthenticationException

logger = structlog.get_logger(__name__)

class UserRole(str, Enum):
    """
    Standard bank staff roles for Role Based Access Control (RBAC).
    """
    ANALYST = "analyst"                       # Standard investigator reviewing low-risk cases
    INVESTIGATOR = "investigator"             # High-level investigator initiating SARs
    COMPLIANCE_OFFICER = "compliance_officer" # Approving SARs and closing cases
    ADMINISTRATOR = "administrator"           # Managing roles, settings, configurations
    SYSTEM = "system"                         # Service-to-service communication authorization


class PasswordHasher:
    """
    Direct bcrypt wrapper for secure password hashing and verification.
    """
    @staticmethod
    def hash_password(password: str) -> str:
        """
        Hashes a plain-text password using bcrypt with a work factor of 12.
        """
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
        return hashed.decode("utf-8")

    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        """
        Verify password hash. Catches all errors safely.
        """
        try:
            return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception as exc:
            logger.error("Password verification threw an error", error=str(exc))
            return False


def create_access_token(
    subject: str,
    roles: list[str],
    secret_key: str,
    expires_minutes: int,
    algorithm: str = "HS256",
    token_id: str | None = None
) -> str:
    """
    Generates a cryptographically signed access JWT.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "roles": roles,
        "iat": now,
        "exp": now + timedelta(minutes=expires_minutes),
        "jti": token_id or str(uuid.uuid4()),
        "nbf": now,
    }
    return jwt.encode(payload, secret_key, algorithm=algorithm)


def create_refresh_token(
    subject: str,
    secret_key: str,
    expires_minutes: int,
    algorithm: str = "HS256",
    token_id: str | None = None
) -> str:
    """
    Generates a cryptographically signed refresh JWT.
    """
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "iat": now,
        "exp": now + timedelta(minutes=expires_minutes),
        "jti": token_id or str(uuid.uuid4()),
        "nbf": now,
        "refresh": True,
    }
    return jwt.encode(payload, secret_key, algorithm=algorithm)


def decode_token(token: str, secret_key: str, algorithm: str = "HS256") -> dict[str, Any]:
    """
    Decodes and validates a JWT. Raises AuthenticationException on expiration or invalidity.
    """
    try:
        return jwt.decode(token, secret_key, algorithms=[algorithm])
    except jwt.ExpiredSignatureError as exc:
        logger.warning("Token verification failed: expired token")
        raise AuthenticationException("Access token has expired") from exc
    except jwt.InvalidTokenError as exc:
        logger.warning("Token verification failed: invalid signature or payload", error=str(exc))
        raise AuthenticationException("Invalid authentication token") from exc
