from fastapi import APIRouter, Depends, Request, status
from app.models.auth import User
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    UserResponse,
    TokenResponse,
    RefreshTokenRequest,
    MFAVerifyRequest,
    MFASetupResponse,
    FirebaseLoginRequest
)
from app.dependencies.auth import get_auth_service, get_current_user, oauth2_scheme
from app.services.auth_service import AuthService
from shared.schemas import ResponseEnvelope
from shared.exceptions import AuthenticationException
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=ResponseEnvelope[UserResponse], status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    payload: UserRegisterRequest,
    service: AuthService = Depends(get_auth_service)
) -> ResponseEnvelope[UserResponse]:
    """
    Registers a new staff member. (Defaults to 'analyst' role).
    """
    user = await service.register_user(
        email=payload.email,
        password_raw=payload.password,
        first_name=payload.first_name,
        last_name=payload.last_name
    )
    # Commit changes (flush occurred inside repo, commit makes it permanent in transactional database)
    await service.repository.session.commit()
    
    return ResponseEnvelope(
        success=True,
        message="User registered successfully.",
        data=UserResponse.model_validate(user),
        request_id=request.state.request_id
    )


@router.post("/login", response_model=ResponseEnvelope[TokenResponse])
async def login(
    request: Request,
    payload: UserLoginRequest,
    service: AuthService = Depends(get_auth_service)
) -> ResponseEnvelope[TokenResponse]:
    """
    Authenticates username and password credentials. 
    If MFA is active, returns is_mfa_required=True and empty tokens.
    """
    auth_result = await service.authenticate_credentials(
        email=payload.email,
        password_raw=payload.password
    )
    # We commit in case password verify tracking writes audit records in future sprints
    await service.repository.session.commit()
    
    return ResponseEnvelope(
        success=True,
        message="MFA challenge required." if auth_result["is_mfa_required"] else "Login successful.",
        data=TokenResponse(**auth_result),
        request_id=request.state.request_id
    )


@router.post("/mfa/setup", response_model=ResponseEnvelope[MFASetupResponse])
async def setup_mfa(
    request: Request,
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service)
) -> ResponseEnvelope[MFASetupResponse]:
    """
    Initializes MFA activation, generating a secret TOTP key and provisioning URI.
    """
    mfa_data = await service.setup_mfa(current_user.id)
    await service.repository.session.commit()
    
    return ResponseEnvelope(
        success=True,
        message="MFA configuration secret generated.",
        data=MFASetupResponse(**mfa_data),
        request_id=request.state.request_id
    )


@router.post("/mfa/verify", response_model=ResponseEnvelope[dict])
async def verify_mfa(
    request: Request,
    payload: MFAVerifyRequest,  # Using standard VerifyRequest which requires email/code
    service: AuthService = Depends(get_auth_service)
) -> ResponseEnvelope[dict]:
    """
    Verifies the setup TOTP token. If successful, enables MFA for the user.
    """
    user = await service.repository.get_user_by_email(payload.email)
    if not user:
        raise AuthenticationException("Verification failed: user not found.")
        
    activated = await service.verify_and_enable_mfa(user.id, payload.code)
    if not activated:
        raise AuthenticationException("Verification failed: incorrect TOTP code.")
        
    await service.repository.session.commit()
    return ResponseEnvelope(
        success=True,
        message="MFA has been successfully activated on your account.",
        data={"is_mfa_enabled": True},
        request_id=request.state.request_id
    )


@router.post("/mfa/login-verify", response_model=ResponseEnvelope[TokenResponse])
async def login_mfa_verify(
    request: Request,
    payload: MFAVerifyRequest,
    service: AuthService = Depends(get_auth_service)
) -> ResponseEnvelope[TokenResponse]:
    """
    Verifies the TOTP code for active MFA users during login challenge.
    """
    auth_result = await service.login_mfa_verify(
        email=payload.email,
        code=payload.code
    )
    await service.repository.session.commit()
    
    return ResponseEnvelope(
        success=True,
        message="MFA challenge passed. Sessions started.",
        data=TokenResponse(**auth_result),
        request_id=request.state.request_id
    )


@router.post("/firebase-login", response_model=ResponseEnvelope[TokenResponse])
async def firebase_login(
    request: Request,
    payload: FirebaseLoginRequest,
    service: AuthService = Depends(get_auth_service)
) -> ResponseEnvelope[TokenResponse]:
    """
    Authenticates a user via Firebase SSO token (Google or GitHub).
    Creates a new user profile on the fly if one does not exist.
    """
    auth_result = await service.authenticate_firebase_token(payload.id_token)
    await service.repository.session.commit()
    
    return ResponseEnvelope(
        success=True,
        message="SSO Login successful.",
        data=TokenResponse(**auth_result),
        request_id=request.state.request_id
    )


@router.post("/refresh", response_model=ResponseEnvelope[TokenResponse])
async def refresh_tokens(
    request: Request,
    payload: RefreshTokenRequest,
    service: AuthService = Depends(get_auth_service)
) -> ResponseEnvelope[TokenResponse]:
    """
    Rotates access and refresh tokens (Refresh Token Rotation).
    """
    tokens = await service.rotate_tokens(payload.refresh_token)
    await service.repository.session.commit()
    
    return ResponseEnvelope(
        success=True,
        message="Tokens successfully rotated.",
        data=TokenResponse(**tokens),
        request_id=request.state.request_id
    )


@router.post("/logout", response_model=ResponseEnvelope[dict])
async def logout(
    request: Request,
    token: str = Depends(oauth2_scheme),
    service: AuthService = Depends(get_auth_service)
) -> ResponseEnvelope[dict]:
    """
    Invalidates the active session by blacklisting the active token ID in cache.
    """
    if token:
        await service.revoke_session(token)
    return ResponseEnvelope(
        success=True,
        message="Logout successful.",
        data={},
        request_id=request.state.request_id
    )


@router.get("/me", response_model=ResponseEnvelope[UserResponse])
async def get_me(
    request: Request,
    current_user: User = Depends(get_current_user)
) -> ResponseEnvelope[UserResponse]:
    """
    Returns profile information of the currently authenticated user.
    """
    return ResponseEnvelope(
        success=True,
        message="User details retrieved.",
        data=UserResponse.model_validate(current_user),
        request_id=request.state.request_id
    )
