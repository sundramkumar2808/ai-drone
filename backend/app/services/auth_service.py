"""Authentication service module using MongoDB."""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Any

from jose import jwt, JWTError

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
)
from app.models.user import User
from app.schemas.auth import UserCreate, TokenResponse

settings = get_settings()


async def register_user(db: Any, user_data: UserCreate) -> User:
    """Register a new user with email and password in MongoDB."""
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise ValueError("A user with this email already exists")

    hashed_password = get_password_hash(user_data.password)
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "phone": getattr(user_data, "phone", None),
        "hashed_password": hashed_password,
        "role": getattr(user_data, "role", "viewer") or "viewer",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

    await db.users.insert_one(user_doc)
    return User(user_doc)


async def authenticate_user(
    db: Any, email: str, password: str
) -> Optional[User]:
    """Verify user credentials and return the user if valid."""
    user_doc = await db.users.find_one({"email": email})
    if not user_doc:
        return None
    if not verify_password(password, user_doc.get("hashed_password", "")):
        return None
    return User(user_doc)


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


def generate_password_reset_token(email: str) -> str:
    """Create a time-limited JWT reset token for the given email."""
    expires = datetime.now(timezone.utc) + timedelta(hours=1)
    payload = {"sub": email, "exp": expires, "type": "password_reset"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


async def reset_password(db: Any, token: str, new_password: str) -> bool:
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

    user_doc = await db.users.find_one({"email": email})
    if not user_doc:
        raise ValueError("User not found")

    new_hash = get_password_hash(new_password)
    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"email": email},
        {"$set": {"hashed_password": new_hash, "updated_at": now}},
    )
    return True
