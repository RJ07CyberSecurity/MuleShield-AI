import uuid
from datetime import datetime
from pydantic import BaseModel, Field, field_validator

class PermissionResponse(BaseModel):
    """Schema for returning permission details."""
    id: uuid.UUID
    name: str
    description: str | None = None

    class Config:
        from_attributes = True


class RoleResponse(BaseModel):
    """Schema for returning role details."""
    id: uuid.UUID
    name: str
    description: str | None = None
    permissions: list[PermissionResponse] = []

    class Config:
        from_attributes = True


class UserRegisterRequest(BaseModel):
    """Schema for registering a new user."""
    email: str = Field(
        ...,
        pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$",
        description="Valid work email address"
    )
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)


class UserLoginRequest(BaseModel):
    """Schema for logging in."""
    email: str = Field(..., pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    password: str = Field(...)


class UserResponse(BaseModel):
    """Schema for returning user profiles."""
    id: uuid.UUID
    email: str
    first_name: str
    last_name: str
    is_active: bool
    is_mfa_enabled: bool
    roles: list[RoleResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Successful authentication token envelope."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="Bearer")
    is_mfa_required: bool = Field(default=False, description="True if login requires TOTP verification step")


class RefreshTokenRequest(BaseModel):
    """Schema to request token rotation."""
    refresh_token: str = Field(...)


class MFASetupResponse(BaseModel):
    """Schema returned when initializing MFA setup."""
    secret: str = Field(..., description="TOTP secret key")
    qr_code_uri: str = Field(..., description="TOTP provisioning URI (otpauth://...) for QR generation")


class MFAVerifyRequest(BaseModel):
    """Schema to verify TOTP code."""
    email: str = Field(..., pattern=r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$", description="6-digit TOTP code")


class FirebaseLoginRequest(BaseModel):
    id_token: str = Field(..., description="Firebase ID token")
