"""
FastAPI dependency injection utilities for authentication and authorization.
"""

from typing import List, Any
import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security import verify_token
from app.database.session import get_db
from app.models.user import User

# HTTP Bearer token security scheme
security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security_scheme),
    db: Any = Depends(get_db),
) -> User:
    """
    Dependency that extracts and validates the JWT token from the
    Authorization header, then returns the corresponding User.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please provide a valid access token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check token type
    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type. Access token required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_raw = payload.get("sub")
    if user_id_raw is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing user identifier.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    uid_str = str(user_id_raw)
    user_doc = await db.users.find_one({"$or": [{"id": uid_str}, {"email": uid_str}]})

    if user_doc is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return User(user_doc)


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency that returns the current user only if they are active.

    Raises:
        HTTPException 403: If the user account is deactivated.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )
    return current_user


class RoleChecker:
    """
    Callable dependency class that checks if the current user has
    one of the required roles.

    Usage:
        @router.get("/admin", dependencies=[Depends(RoleChecker(["admin"]))])
        async def admin_endpoint():
            ...
    """

    def __init__(self, allowed_roles: List[str]) -> None:
        self.allowed_roles = allowed_roles

    async def __call__(
        self,
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(self.allowed_roles)}",
            )
        return current_user


def require_role(roles: List[str]):
    """
    Factory function that returns a dependency checking the user's role.

    Args:
        roles: List of allowed role strings.

    Returns:
        A dependency that can be used with Depends().

    Usage:
        @router.get("/manage", dependencies=[Depends(require_role(["admin", "fleet_manager"]))])
        async def manage_endpoint():
            ...
    """
    checker = RoleChecker(roles)
    return Depends(checker)
