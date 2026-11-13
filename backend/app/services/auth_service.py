"""Authentication service module."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
)
from app.models.user import User
from app.models.alert import OAuthAccount
from app.schemas.auth import UserCreate, TokenResponse


settings = get_settings()


async def register_user(db: AsyncSession, user_data: UserCreate) -> User:
    """Register a new user with email and password."""
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise ValueError("A user with this email already exists")

    hashed_password = get_password_hash(user_data.password)
    user = User(
        id=uuid.uuid4(),
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        role=user_data.role if hasattr(user_data, "role") and user_data.role else "viewer",
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(
    db: AsyncSession, email: str, password: str
) -> Optional[User]:
    """Verify user credentials and return the user if valid."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def create_tokens(user: User) -> TokenResponse:
    """Create access and refresh tokens for a user."""
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


async def get_or_create_oauth_user(
    db: AsyncSession,
    provider: str,
    provider_account_id: str,
    email: str,
    full_name: Optional[str] = None,
) -> User:
    """Handle OAuth login/signup. Links OAuth account to existing user or creates a new one."""
    # Check if OAuth account already linked
    result = await db.execute(
        select(OAuthAccount).where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_account_id == provider_account_id,
        )
    )
    oauth_account = result.scalar_one_or_none()

    if oauth_account:
        user_result = await db.execute(
            select(User).where(User.id == oauth_account.user_id)
        )
        user = user_result.scalar_one_or_none()
        if user:
            return user

    # Check if a user with this email exists
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            id=uuid.uuid4(),
            email=email,
            full_name=full_name or email.split("@")[0],
            hashed_password="",  # OAuth users don't have a password
            role="viewer",
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(user)
        await db.flush()

    # Link OAuth account
    new_oauth = OAuthAccount(
        id=uuid.uuid4(),
        user_id=user.id,
        provider=provider,
        provider_account_id=provider_account_id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_oauth)
    await db.commit()
    await db.refresh(user)
    return user


def generate_password_reset_token(email: str) -> str:
    """Create a time-limited JWT reset token for the given email."""
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    payload = {"sub": email, "exp": expires, "type": "password_reset"}
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token


async def reset_password(
    db: AsyncSession, token: str, new_password: str
) -> bool:
    """Reset the user's password using a valid reset token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "password_reset":
            raise ValueError("Invalid token type")
        email: str = payload.get("sub")
        if email is None:
            raise ValueError("Invalid token payload")
    except JWTError as exc:
        raise ValueError(f"Invalid or expired reset token: {exc}")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError("User not found")

    user.hashed_password = get_password_hash(new_password)
    user.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return True
