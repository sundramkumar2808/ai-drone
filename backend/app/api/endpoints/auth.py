"""Authentication API endpoints."""

from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.config import get_settings
from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    ForgotPassword,
    ResetPassword,
)
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Register a new user."""
    try:
        user = await auth_service.register_user(db, user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login", response_model=Token)
async def login(
    login_data: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Log in with email and password to receive access & refresh tokens."""
    user = await auth_service.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )
    return auth_service.create_tokens(user)


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user),
) -> dict:
    """Logout current user."""
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get profile of current authenticated user."""
    return current_user


@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPassword,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Initiate password reset flow."""
    token = auth_service.generate_password_reset_token(data.email)
    return {
        "message": "If the email is registered, a password reset link has been generated.",
        "reset_token": token,
    }


@router.post("/reset-password")
async def reset_password(
    data: ResetPassword,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Reset password using token."""
    success = await auth_service.reset_password(db, data.token, data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )
    return {"message": "Password reset successfully"}
