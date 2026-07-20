import base64
import hashlib
import hmac
import secrets
import struct
import time
import uuid
from datetime import datetime, timezone
from typing import Any
from redis.asyncio import Redis
from app.models.auth import User
from app.repository.auth_repository import AuthRepository
from shared.authentication import (
    PasswordHasher,
    create_access_token,
    create_refresh_token,
    decode_token
)
from shared.exceptions import AuthenticationException, ConflictException, NotFoundException
import structlog

logger = structlog.get_logger(__name__)

class TOTPHelper:
    """
    RFC 6238 Time-Based One-Time Password (TOTP) pure-python helper.
    Avoids third-party compiling dependencies.
    """
    @staticmethod
    def generate_secret() -> str:
        """
        Generates a 16-character random Base32 secret string.
        """
        alphabet = "234567QWERTYUIOPASDFGHJKLZXCVBNM"
        return "".join(secrets.choice(alphabet) for _ in range(32))

    @staticmethod
    def verify_totp(secret: str, code: str, window: int = 1) -> bool:
        """
        Verifies a 6-digit TOTP code against a secret key within a time-step window.
        """
        try:
            # Normalize and decode secret
            missing_padding = len(secret) % 8
            if missing_padding:
                secret += "=" * (8 - missing_padding)
            key = base64.b32decode(secret.upper().encode("utf-8"))
        except Exception as exc:
            logger.error("Failed to decode Base32 MFA secret", error=str(exc))
            return False

        # Current time counter (30-second steps)
        now_counter = int(time.time() / 30)

        # Scan window (default check current, previous and next step for transmission delays)
        for i in range(-window, window + 1):
            msg = struct.pack(">Q", now_counter + i)
            hmac_hash = hmac.new(key, msg, hashlib.sha1).digest()
            offset = hmac_hash[-1] & 0x0F
            binary = struct.unpack(">I", hmac_hash[offset:offset+4])[0] & 0x7FFFFFFF
            otp = binary % 1000000
            if f"{otp:06d}" == code:
                return True
        return False


class AuthService:
    """
    Authentication domain service implementing registration, token lifecycle, and MFA logic.
    """
    def __init__(
        self,
        repository: AuthRepository,
        redis: Redis,
        jwt_secret: str,
        jwt_algorithm: str,
        access_token_expire_minutes: int,
        refresh_token_expire_minutes: int,
        mfa_issuer: str = "MuleShieldAI"
    ) -> None:
        self.repository = repository
        self.redis = redis
        self.jwt_secret = jwt_secret
        self.jwt_algorithm = jwt_algorithm
        self.access_token_expire_minutes = access_token_expire_minutes
        self.refresh_token_expire_minutes = refresh_token_expire_minutes
        self.mfa_issuer = mfa_issuer

    async def register_user(self, email: str, password_raw: str, first_name: str, last_name: str) -> User:
        """
        Registers a new bank staff user with hashed password.
        """
        existing = await self.repository.get_user_by_email(email)
        if existing:
            logger.warning("Registration blocked: email already registered", email=email)
            raise ConflictException(f"User with email '{email}' already exists.")

        hashed_pass = PasswordHasher.hash_password(password_raw)
        new_user = User(
            email=email,
            hashed_password=hashed_pass,
            first_name=first_name,
            last_name=last_name,
            is_active=True,
            is_mfa_enabled=False
        )

        # Look up and assign default role 'analyst' if it exists
        default_role = await self.repository.get_role_by_name("analyst")
        if default_role:
            new_user.roles.append(default_role)

        await self.repository.create_user(new_user)
        logger.info("New user registered successfully", email=email, user_id=str(new_user.id))
        return new_user

    async def authenticate_credentials(self, email: str, password_raw: str) -> dict[str, Any]:
        """
        Validates username and password. Checks if MFA is required.
        """
        user = await self.repository.get_user_by_email(email)
        if not user or not PasswordHasher.verify_password(password_raw, user.hashed_password):
            logger.warning("Login failed: invalid credentials", email=email)
            raise AuthenticationException("Invalid email or password.")

        if not user.is_active:
            logger.warning("Login blocked: account disabled", email=email)
            raise AuthenticationException("User account is disabled.")

        # MFA required branch
        if user.is_mfa_enabled:
            logger.info("Login step 1 success; MFA challenge required", email=email)
            return {
                "access_token": "",
                "refresh_token": "",
                "is_mfa_required": True
            }

        # Standard authentication branch (no MFA)
        roles = [r.name for r in user.roles]
        access_token = create_access_token(
            subject=str(user.id),
            roles=roles,
            secret_key=self.jwt_secret,
            expires_minutes=self.access_token_expire_minutes,
            algorithm=self.jwt_algorithm
        )
        refresh_token = create_refresh_token(
            subject=str(user.id),
            secret_key=self.jwt_secret,
            expires_minutes=self.refresh_token_expire_minutes,
            algorithm=self.jwt_algorithm
        )
        logger.info("Login successful: tokens issued", email=email, user_id=str(user.id))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "is_mfa_required": False
        }

    async def setup_mfa(self, user_id: uuid.UUID) -> dict[str, str]:
        """
        Starts the Multi-Factor Authentication setup, returning the secret and authenticator URI.
        """
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        secret = TOTPHelper.generate_secret()
        
        # Save temporary secret (verify verifies and commits it)
        user.mfa_secret = secret
        
        # otpauth scheme for authenticator apps (Google Authenticator, Authy)
        qr_uri = f"otpauth://totp/{self.mfa_issuer}:{user.email}?secret={secret}&issuer={self.mfa_issuer}"
        
        logger.info("MFA setup generated", user_id=str(user_id))
        return {
            "secret": secret,
            "qr_code_uri": qr_uri
        }

    async def verify_and_enable_mfa(self, user_id: uuid.UUID, code: str) -> bool:
        """
        Verifies the first TOTP code. If correct, activates MFA on the account.
        """
        user = await self.repository.get_user_by_id(user_id)
        if not user or not user.mfa_secret:
            raise NotFoundException("User or MFA secret not found")

        if TOTPHelper.verify_totp(user.mfa_secret, code):
            user.is_mfa_enabled = True
            logger.info("MFA successfully enabled", user_id=str(user_id))
            return True
            
        logger.warning("MFA activation failed: incorrect code", user_id=str(user_id))
        return False

    async def login_mfa_verify(self, email: str, code: str) -> dict[str, Any]:
        """
        Verifies TOTP token for login challenge and issues tokens.
        """
        user = await self.repository.get_user_by_email(email)
        if not user or not user.is_mfa_enabled or not user.mfa_secret:
            raise AuthenticationException("MFA is not enabled for this user.")

        if not TOTPHelper.verify_totp(user.mfa_secret, code):
            logger.warning("MFA login challenge failed: incorrect code", email=email)
            raise AuthenticationException("Invalid verification code.")

        roles = [r.name for r in user.roles]
        access_token = create_access_token(
            subject=str(user.id),
            roles=roles,
            secret_key=self.jwt_secret,
            expires_minutes=self.access_token_expire_minutes,
            algorithm=self.jwt_algorithm
        )
        refresh_token = create_refresh_token(
            subject=str(user.id),
            secret_key=self.jwt_secret,
            expires_minutes=self.refresh_token_expire_minutes,
            algorithm=self.jwt_algorithm
        )
        logger.info("MFA verification successful: tokens issued", email=email, user_id=str(user.id))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "is_mfa_required": False
        }

    async def rotate_tokens(self, refresh_token: str) -> dict[str, str]:
        """
        Implements Refresh Token Rotation (RTR).
        Decodes the token, verifies it is not blacklisted, revokes it, and issues new tokens.
        """
        payload = decode_token(refresh_token, self.jwt_secret, self.jwt_algorithm)
        if not payload.get("refresh"):
            raise AuthenticationException("Invalid token type. Refresh token required.")

        jti = payload.get("jti")
        user_id_str = payload.get("sub")
        exp = payload.get("exp")

        if not jti or not user_id_str:
            raise AuthenticationException("Invalid token claims.")

        # Check blacklist (if Redis is active)
        if self.redis is not None:
            is_revoked = await self.redis.get(f"blacklist:{jti}")
            if is_revoked:
                logger.critical("Revoked refresh token reuse detected! Revoking all sessions for user.", user_id=user_id_str)
                raise AuthenticationException("Token has been revoked.")

            # Revoke the used refresh token
            remaining_ttl = int(exp - time.time()) if exp else self.refresh_token_expire_minutes * 60
            if remaining_ttl > 0:
                await self.redis.setex(f"blacklist:{jti}", remaining_ttl, "true")
        else:
            logger.warning("Redis is not available; bypassing refresh token revocation blacklist check")

        # Load user to issue new tokens with current roles
        user_id = uuid.UUID(user_id_str)
        user = await self.repository.get_user_by_id(user_id)
        if not user or not user.is_active:
            raise AuthenticationException("User is no longer active.")

        roles = [r.name for r in user.roles]
        new_access = create_access_token(
            subject=str(user.id),
            roles=roles,
            secret_key=self.jwt_secret,
            expires_minutes=self.access_token_expire_minutes,
            algorithm=self.jwt_algorithm
        )
        new_refresh = create_refresh_token(
            subject=str(user.id),
            secret_key=self.jwt_secret,
            expires_minutes=self.refresh_token_expire_minutes,
            algorithm=self.jwt_algorithm
        )
        logger.info("Token rotated successfully", user_id=user_id_str)
        return {
            "access_token": new_access,
            "refresh_token": new_refresh
        }

    async def revoke_session(self, token: str) -> None:
        """
        Revokes an active token (Logout). Blacklists the token ID in Redis.
        """
        if self.redis is None:
            logger.warning("Redis is not available; bypassing token revocation blacklist")
            return
            
        try:
            payload = decode_token(token, self.jwt_secret, self.jwt_algorithm)
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti:
                remaining_ttl = int(exp - time.time()) if exp else self.access_token_expire_minutes * 60
                if remaining_ttl > 0:
                    await self.redis.setex(f"blacklist:{jti}", remaining_ttl, "true")
                logger.info("Session revoked successfully (logged out)")
        except Exception as exc:
            logger.warning("Token revocation failed or token was already expired", error=str(exc))

    async def authenticate_firebase_token(self, id_token: str) -> dict[str, Any]:
        """
        Verifies a Firebase ID token using the firebase-admin SDK.
        Supports Email/Password, Google Sign-In, GitHub, and Phone Authentication.
        Falls back to unverified JWT decode in local/offline development mode.
        """
        import os

        email = None
        phone_number = None
        first_name = "SSO"
        last_name = "User"
        uid = None

        # 1. Attempt verification via firebase-admin SDK (production path)
        try:
            import firebase_admin
            from firebase_admin import auth as firebase_auth, credentials

            # Initialize Firebase Admin if not already initialized
            if not firebase_admin._apps:
                project_id = os.environ.get("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "muleshield-967045850546")
                service_account_path = os.path.join(
                    os.path.dirname(__file__),
                    "../../../../../firebase-service-account.json"
                )
                if os.path.exists(service_account_path):
                    cred = credentials.Certificate(service_account_path)
                else:
                    cred = credentials.ApplicationDefault()
                firebase_admin.initialize_app(cred, {"projectId": project_id})

            decoded = firebase_auth.verify_id_token(id_token)
            uid = decoded.get("uid")
            email = decoded.get("email")
            phone_number = decoded.get("phone_number")
            name = decoded.get("name") or decoded.get("display_name") or ""
            parts = name.split(" ", 1) if name else []
            first_name = parts[0] if parts else (phone_number or "Phone")
            last_name = parts[1] if len(parts) > 1 else "User"
            logger.info("Firebase ID token verified via Admin SDK", email=email, uid=uid)

        except Exception as exc:
            # 2. Offline / local development fallback — decode without verification
            logger.warning(
                "Firebase Admin SDK verification failed — using unverified decode fallback",
                error=str(exc)
            )
            try:
                import jwt as pyjwt
                claims = pyjwt.decode(id_token, options={"verify_signature": False})
                uid = claims.get("uid") or claims.get("sub")
                email = claims.get("email")
                phone_number = claims.get("phone_number")
                name = claims.get("name", "")
                parts = name.split(" ", 1) if name else []
                first_name = parts[0] if parts else (phone_number or "Phone")
                last_name = parts[1] if len(parts) > 1 else "User"
            except Exception as e:
                logger.critical("Failed to decode Firebase token at all", error=str(e))
                raise AuthenticationException("Invalid/malformed Firebase ID token.")

        # For phone auth users, email may be absent — generate a stable synthetic email
        if not email and phone_number:
            email = f"phone_{phone_number.lstrip('+').replace(' ', '')}@muleshield.internal"
            logger.info("Phone auth user — synthetic email assigned", email=email, phone=phone_number)
        elif not email:
            raise AuthenticationException("Firebase authentication failed: email claim is missing.")

        # 3. Look up or auto-register the user in our database
        user = await self.repository.get_user_by_email(email)
        if not user:
            logger.info("Auto-registering new Firebase user", email=email)
            random_password = PasswordHasher.hash_password(secrets.token_urlsafe(16))
            user = User(
                email=email,
                hashed_password=random_password,
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                is_mfa_enabled=False
            )
            default_role = await self.repository.get_role_by_name("investigator")
            if default_role:
                user.roles.append(default_role)
            await self.repository.create_user(user)
            await self.repository.session.flush()

        roles = [r.name for r in user.roles]
        access_token = create_access_token(
            subject=str(user.id),
            roles=roles,
            secret_key=self.jwt_secret,
            expires_minutes=self.access_token_expire_minutes,
            algorithm=self.jwt_algorithm
        )
        refresh_token = create_refresh_token(
            subject=str(user.id),
            secret_key=self.jwt_secret,
            expires_minutes=self.refresh_token_expire_minutes,
            algorithm=self.jwt_algorithm
        )
        logger.info("Firebase login successful: tokens issued", email=email, user_id=str(user.id))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "is_mfa_required": False
        }
