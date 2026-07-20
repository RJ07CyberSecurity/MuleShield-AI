import os
from typing import Any, List
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import httpx
import structlog
from shared.config.settings import BaseAppSettings
settings = BaseAppSettings()
from shared.exceptions import AuthenticationException

logger = structlog.get_logger(__name__)
security = HTTPBearer(auto_error=False)

# Cache Keycloak public keys to avoid fetching on every request
KEYCLOAK_CERTS = None

async def fetch_keycloak_certs() -> dict | None:
    global KEYCLOAK_CERTS
    if KEYCLOAK_CERTS:
        return KEYCLOAK_CERTS
        
    keycloak_url = os.getenv("KEYCLOAK_URL")
    realm = os.getenv("KEYCLOAK_REALM", "muleshield")
    if not keycloak_url:
        return None
        
    url = f"{keycloak_url}/realms/{realm}/protocol/openid-connect/certs"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=5.0)
            if response.status_code == 200:
                KEYCLOAK_CERTS = response.json()
                return KEYCLOAK_CERTS
    except Exception as e:
        logger.warning("Could not fetch Keycloak public keys", error=str(e))
    return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict[str, Any]:
    """
    Decodes and validates bearer token, verifying signature against OIDC (Keycloak)
    or falling back to local JWT secret for offline dev mode.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_412_PRECONDITION_FAILED,
            detail="Authorization header with bearer token is missing."
        )
        
    token = credentials.credentials
    keycloak_certs = await fetch_keycloak_certs()
    
    if keycloak_certs:
        # Decode token via OIDC Keycloak certificates
        try:
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            
            # Find the correct certificate key
            jwk = next((key for key in keycloak_certs.get("keys", []) if key.get("kid") == kid), None)
            if jwk:
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(jwk)
                # Verify keycloak token claims
                realm = os.getenv("KEYCLOAK_REALM", "muleshield")
                audience = os.getenv("KEYCLOAK_CLIENT_ID", "muleshield-client")
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=["RS256"],
                    audience=audience,
                    options={"verify_exp": True}
                )
                
                # Retrieve roles from Keycloak resource access
                roles = []
                resource_access = payload.get("resource_access", {})
                client_access = resource_access.get(audience, {})
                roles.extend(client_access.get("roles", []))
                
                # Check realm roles too
                realm_access = payload.get("realm_access", {})
                roles.extend(realm_access.get("roles", []))
                
                return {
                    "sub": payload.get("sub"),
                    "email": payload.get("email"),
                    "roles": list(set(roles))
                }
        except Exception as e:
            logger.warning("Keycloak OIDC validation failed, attempting local fallback", error=str(e))
            
    # Local Fallback Decoder (Dev / SQLite mode)
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return {
            "sub": payload.get("sub"),
            "email": payload.get("sub"),
            "roles": payload.get("roles", [])
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token signature expired.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token signature.")


class RoleChecker:
    """
    Dependency helper to validate actor permissions.
    """
    def __init__(self, allowed_roles: List[str]) -> None:
        self.allowed_roles = allowed_roles

    def __call__(self, user: dict = Depends(get_current_user)) -> dict:
        user_roles = user.get("roles", [])
        
        # Admin bypass
        if "administrator" in user_roles or "admin" in user_roles:
            return user
            
        # Check matching roles (mapping common keycloak names to spec roles)
        has_permission = False
        for role in self.allowed_roles:
            # Map standard name variations
            variations = [role.lower()]
            if role == "analyst":
                variations.append("investigator")
            if role == "officer":
                variations.append("compliance_officer")
                
            if any(v in [r.lower() for r in user_roles] for v in variations):
                has_permission = True
                break
                
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Action forbidden: insufficient role clearances."
            )
        return user


# Common Dependency Injectors
require_analyst = RoleChecker(["analyst"])
require_officer = RoleChecker(["officer"])
require_admin = RoleChecker(["admin", "administrator"])
