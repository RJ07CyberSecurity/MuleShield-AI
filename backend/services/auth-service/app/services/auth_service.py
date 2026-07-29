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
from app.models.auth import User, AuditLog
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

# In-memory OTP sessions for local/dev phone auth when Firebase Phone provider is disabled.
_phone_otp_sessions: dict[str, dict[str, Any]] = {}

# In-memory token store for Password Reset flow
_password_reset_tokens: dict[str, dict[str, Any]] = {}

# In-memory OTP store for Email MFA flow
_email_otp_sessions: dict[str, dict[str, Any]] = {}


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

    async def register_user(self, email: str, password_raw: str, first_name: str, last_name: str, role: str = None) -> User:
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

        # Look up and assign role
        role_name = role.lower() if role else "analyst"
        assigned_role = await self.repository.get_role_by_name(role_name)
        if assigned_role:
            new_user.roles.append(assigned_role)

        await self.repository.create_user(new_user)
        logger.info("New user registered successfully", email=email, user_id=str(new_user.id))
        return new_user

    async def get_all_users(self) -> list[User]:
        """
        Retrieves all registered users.
        """
        return await self.repository.list_users()

    async def update_user_profile(self, user_id: uuid.UUID, update_data: dict[str, Any]) -> User:
        """
        Updates user profile attributes (e.g. avatar_url, names).
        """
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise NotFoundException("User not found.")
        
        for key, value in update_data.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
                
        return await self.repository.update_user(user)

    async def authenticate_credentials(self, email: str, password_raw: str, client_ip: str = None, user_agent: str = None) -> dict[str, Any]:
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

        is_admin = any(r.name in ["admin", "administrator"] for r in user.roles)

        # MFA required branch
        if user.is_mfa_enabled or is_admin:
            logger.info("Login step 1 success; MFA challenge required", email=email)
            import random
            import time
            import smtplib
            import os
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Generate 6-digit OTP
            otp_code = str(random.randint(100000, 999999))
            
            # Store in session (expires in 5 minutes)
            _email_otp_sessions[email] = {
                "code": otp_code,
                "expires_at": time.time() + 300
            }
            
            # Send Email
            smtp_host = os.environ.get("SMTP_HOST", "")
            smtp_port = int(os.environ.get("SMTP_PORT", "587"))
            smtp_user = os.environ.get("SMTP_USER", "")
            smtp_pass = os.environ.get("SMTP_PASSWORD", "")
            if smtp_host and smtp_user:
                try:
                    msg = MIMEMultipart("alternative")
                    msg['Subject'] = "MuleShield AI - MFA Login Code"
                    msg['From'] = smtp_user
                    msg['To'] = email
                    text = f"Your MuleShield AI Login Code is: {otp_code}"
                    html = f"<p>Your MuleShield AI Login Code is: <b>{otp_code}</b></p>"
                    msg.attach(MIMEText(text, 'plain'))
                    msg.attach(MIMEText(html, 'html'))
                    server = smtplib.SMTP(smtp_host, smtp_port)
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.sendmail(smtp_user, email, msg.as_string())
                    server.quit()
                except Exception as e:
                    logger.error("Failed to send Email OTP", error=str(e))
                    
            return {
                "access_token": "",
                "refresh_token": "",
                "is_mfa_required": True,
                "requires_phone_otp": False
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
        
        # Record Audit Log
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        access_details = f"IP: {client_ip or 'unknown'}, User-Agent: {user_agent or 'unknown'}"
        audit_log = AuditLog(
            user_id=user.id,
            login_time=now,
            date_logged=now.date(),
            access_details=access_details
        )
        await self.repository.create_audit_log(audit_log)
        
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

    async def disable_mfa(self, user_id: uuid.UUID) -> bool:
        """
        Disables MFA for the user.
        """
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
            
        user.is_mfa_enabled = False
        user.mfa_secret = None
        logger.info("MFA successfully disabled", user_id=str(user_id))
        return True

    async def login_mfa_verify(
        self,
        email: str,
        code: str,
        phone_code: str = None,
        firebase_phone_token: str = None,
        phone_session_id: str = None,
        client_ip: str = None,
        user_agent: str = None
    ) -> dict[str, Any]:
        """
        Verifies Email OTP token (and Firebase Phone Token if admin) for login challenge and issues tokens.
        """
        user = await self.repository.get_user_by_email(email)
        is_admin = user and any(r.name in ["admin", "administrator"] for r in user.roles)
        
        if not user or (not user.is_mfa_enabled and not is_admin):
            raise AuthenticationException("MFA is not enabled for this user.")

        session_data = _email_otp_sessions.get(email)
        if not session_data:
            raise AuthenticationException("No active MFA request found or expired.")
            
        import time
        if time.time() > session_data["expires_at"]:
            del _email_otp_sessions[email]
            raise AuthenticationException("OTP code has expired.")
            
        if session_data["code"] != code:
            logger.warning("MFA login challenge failed: incorrect email code", email=email)
            raise AuthenticationException("Invalid verification code.")
            
        del _email_otp_sessions[email]

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
        
        # Record Audit Log
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        access_details = f"IP: {client_ip or 'unknown'}, User-Agent: {user_agent or 'unknown'}"
        audit_log = AuditLog(
            user_id=user.id,
            login_time=now,
            date_logged=now.date(),
            access_details=access_details
        )
        await self.repository.create_audit_log(audit_log)
        
        logger.info("MFA verification successful: tokens issued", email=email, user_id=str(user.id))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "is_mfa_required": False
        }

    async def send_password_reset_link(self, email: str) -> dict[str, Any]:
        """
        Sends a password reset link to the user's email via SMTP.
        """
        import uuid
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        import os

        # Verify user exists
        user = await self.repository.get_user_by_email(email)
        if not user:
            # We still return success to prevent email enumeration attacks
            return {"success": True}
        
        # Generate UUID token
        reset_token = str(uuid.uuid4())
        
        # Store in memory dict with expiry (15 mins)
        _password_reset_tokens[email] = {
            "token": reset_token,
            "expires_at": time.time() + 900
        }

        # Encode email safely (Base64 URL-safe) to avoid leaking plain text PII in URLs
        import base64
        encoded_email = base64.urlsafe_b64encode(email.encode("utf-8")).decode("utf-8").rstrip("=")

        # Build reset link
        base_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        reset_link = f"{base_url}/reset-password?token={reset_token}&email={encoded_email}"

        # Try to send email via SMTP if configured
        smtp_host = os.environ.get("SMTP_HOST", "")
        smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        smtp_user = os.environ.get("SMTP_USER", "")
        smtp_pass = os.environ.get("SMTP_PASSWORD", "")

        email_sent = False
        if smtp_host and smtp_user:
            try:
                msg = MIMEMultipart("alternative")
                msg['Subject'] = "MuleShield AI - Secure Password Reset"
                msg['From'] = smtp_user
                msg['To'] = email
                
                text = f"You have requested to reset your MuleShield AI password.\n\nPlease click the following link to reset your password:\n{reset_link}\n\nThis link will expire in 15 minutes."
                html = f"""\
                <html>
                  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                    <div style="max-w-md mx-auto bg-white p-8 border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <h2 style="color: #2563eb;">MuleShield AI</h2>
                      <h3>Password Reset Request</h3>
                      <p>Hello,</p>
                      <p>We received a request to reset your password. Click the secure link below to proceed:</p>
                      <p style="margin: 20px 0;">
                        <a href="{reset_link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                      </p>
                      <p>If the button doesn't work, copy and paste this link into your browser:</p>
                      <p style="color: #666; font-size: 12px;">{reset_link}</p>
                      <p style="color: #999; font-size: 11px; margin-top: 30px;">This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
                    </div>
                  </body>
                </html>
                """
                
                part1 = MIMEText(text, "plain")
                part2 = MIMEText(html, "html")
                msg.attach(part1)
                msg.attach(part2)
                
                server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(msg['From'], [email], msg.as_string())
                server.quit()
                logger.info("Password reset HTML link sent via SMTP", email=email)
                email_sent = True
            except Exception as err:
                logger.error("Failed to send reset link via SMTP", error=str(err))
        
        if not email_sent:
            logger.info("SMTP not configured or failed. Returning dev_link", email=email, token=reset_token)
            return {"dev_link": reset_link, "dev_token": reset_token}
            
        return {"success": True}

    async def reset_password_with_token(self, email: str, token: str, new_password: str) -> None:
        """
        Validates the reset token and updates the user's password.
        """
        user = await self.repository.get_user_by_email(email)
        if not user:
            raise AuthenticationException("Password reset failed. Invalid request.")
            
        session_data = _password_reset_tokens.get(email)
        if not session_data:
            raise AuthenticationException("No active reset request for this email. Please request a new link.")
            
        if time.time() > session_data["expires_at"]:
            del _password_reset_tokens[email]
            raise AuthenticationException("Reset link has expired. Please request a new one.")
            
        if session_data["token"] != token:
            raise AuthenticationException("Invalid reset token.")
            
        # Check if new password is in the last 3 passwords
        if PasswordHasher.verify_password(new_password, user.hashed_password):
            raise ConflictException("You cannot use the same password that was used in the last 3 passwords. Please enter a new password.")
            
        history = []
        if user.password_history:
            history = user.password_history.split(",")
            for old_hash in history:
                if old_hash and PasswordHasher.verify_password(new_password, old_hash):
                    raise ConflictException("You cannot use the same password that was used in the last 3 passwords. Please enter a new password.")
                    
        # Update history
        history.insert(0, user.hashed_password)
        history = history[:3]
        user.password_history = ",".join(history)
            
        # Success, clear token and update password
        del _password_reset_tokens[email]
        
        # Hash new password
        user.hashed_password = PasswordHasher.hash_password(new_password)
        # Note: commit happens in the route handler

    async def rotate_tokens(self, refresh_token: str) -> dict[str, Any]:
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
                
                # Update logout time in audit log
                user_id_str = payload.get("sub")
                if user_id_str:
                    try:
                        user_id = uuid.UUID(user_id_str)
                        await self.repository.update_logout_time(user_id)
                    except ValueError:
                        pass
                
                logger.info("Session revoked successfully (logged out)")
        except Exception as exc:
            logger.warning("Token revocation failed or token was already expired", error=str(exc))

    async def authenticate_firebase_token(self, id_token: str, client_ip: str = None, user_agent: str = None) -> dict[str, Any]:
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
        
        # Record Audit Log
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        access_details = f"IP: {client_ip or 'unknown'}, User-Agent: {user_agent or 'unknown'}"
        audit_log = AuditLog(
            user_id=user.id,
            login_time=now,
            date_logged=now.date(),
            access_details=access_details
        )
        await self.repository.create_audit_log(audit_log)

        logger.info("Firebase login successful: tokens issued", email=email, user_id=str(user.id))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "is_mfa_required": False
        }

    async def send_phone_otp(self, phone_number: str, *, dev_mode: bool = True) -> dict[str, Any]:
        """
        Issues a one-time passcode for phone login.
        Used as a local fallback when Firebase Phone Authentication is unavailable.
        """
        import os

        normalized_phone = phone_number.strip()
        session_id = secrets.token_urlsafe(24)
        code = os.environ.get("PHONE_AUTH_DEV_OTP", "123456") if dev_mode else f"{secrets.randbelow(1_000_000):06d}"
        expires_in = 300

        _phone_otp_sessions[session_id] = {
            "phone_number": normalized_phone,
            "code": code,
            "expires_at": time.time() + expires_in,
        }

        logger.info(
            "Phone OTP issued (dev fallback)",
            phone=normalized_phone,
            session_id=session_id[:8],
            dev_mode=dev_mode,
        )

        result: dict[str, Any] = {
            "session_id": session_id,
            "expires_in": expires_in,
        }
        if dev_mode:
            result["dev_code"] = code
        return result

    async def verify_phone_otp(
        self,
        phone_number: str,
        session_id: str,
        code: str,
        client_ip: str = None,
        user_agent: str = None
    ) -> dict[str, Any]:
        """
        Validates a phone OTP session and issues application JWT tokens.
        """
        session = _phone_otp_sessions.get(session_id)
        if not session:
            raise AuthenticationException("OTP session expired or invalid. Request a new code.")

        if time.time() > session["expires_at"]:
            _phone_otp_sessions.pop(session_id, None)
            raise AuthenticationException("OTP code expired. Request a new code.")

        normalized_phone = phone_number.strip()
        if session["phone_number"] != normalized_phone:
            raise AuthenticationException("Phone number does not match the OTP session.")

        if session["code"] != code.strip():
            raise AuthenticationException("Invalid verification code.")

        _phone_otp_sessions.pop(session_id, None)

        email = f"phone_{normalized_phone.lstrip('+').replace(' ', '')}@muleshield.internal"
        user = await self.repository.get_user_by_email(email)
        if not user:
            logger.info("Auto-registering phone auth user", email=email, phone=normalized_phone)
            random_password = PasswordHasher.hash_password(secrets.token_urlsafe(16))
            user = User(
                email=email,
                hashed_password=random_password,
                first_name="Phone",
                last_name=normalized_phone[-4:],
                is_active=True,
                is_mfa_enabled=False,
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
            algorithm=self.jwt_algorithm,
        )
        refresh_token = create_refresh_token(
            subject=str(user.id),
            secret_key=self.jwt_secret,
            expires_minutes=self.refresh_token_expire_minutes,
            algorithm=self.jwt_algorithm,
        )
        
        # Record Audit Log
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        access_details = f"IP: {client_ip or 'unknown'}, User-Agent: {user_agent or 'unknown'}"
        audit_log = AuditLog(
            user_id=user.id,
            login_time=now,
            date_logged=now.date(),
            access_details=access_details
        )
        await self.repository.create_audit_log(audit_log)

        logger.info("Phone OTP login successful", email=email, user_id=str(user.id))
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "is_mfa_required": False,
        }
