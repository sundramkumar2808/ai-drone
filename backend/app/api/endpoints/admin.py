"""Admin panel API endpoints."""

from typing import Any, List, Optional
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import RoleChecker
from app.core.security import get_password_hash
from app.database.session import get_db
from app.models.user import User
from app.models.drone import Drone
from app.models.mission import Mission
from app.models.alert import ActivityLog, Alert
from app.schemas.user import UserResponse

router = APIRouter(prefix="/api/admin", tags=["Admin"])
admin_only = RoleChecker(["admin"])


class AdminUserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=8)
    role: str = Field("viewer", pattern="^(admin|fleet_manager|operator|viewer)$")


class AdminUserUpdateRole(BaseModel):
    role: str = Field(..., pattern="^(admin|fleet_manager|operator|viewer)$")


@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> Any:
    """List all registered users (admin only)."""
    result = await db.execute(select(User).offset(skip).limit(limit).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(
    data: AdminUserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> Any:
    """Create a new user with specific role (admin only)."""
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    user = User(
        id=uuid.uuid4(),
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        hashed_password=get_password_hash(data.password),
        role=data.role,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(user)

    log = ActivityLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        action="CREATE_USER",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Created user {user.email} with role {user.role}",
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)

    await db.commit()
    await db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_role(
    user_id: uuid.UUID,
    data: AdminUserUpdateRole,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> Any:
    """Update user role (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = data.role
    user.updated_at = datetime.now(timezone.utc)

    log = ActivityLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        action="UPDATE_USER_ROLE",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Updated user {user.email} role to {data.role}",
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)

    await db.commit()
    await db.refresh(user)
    return user


@router.put("/users/{user_id}/disable", response_model=UserResponse)
async def toggle_user_active(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> Any:
    """Toggle user active status (admin only)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.is_active = not user.is_active
    user.updated_at = datetime.now(timezone.utc)

    log = ActivityLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        action="TOGGLE_USER_ACTIVE",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Set user {user.email} active status to {user.is_active}",
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> None:
    """Hard delete a user account (admin only). Cannot delete own account."""
    if str(current_user.id) == str(user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    log = ActivityLog(
        id=uuid.uuid4(),
        user_id=current_user.id,
        action="DELETE_USER",
        resource_type="USER",
        resource_id=str(user.id),
        details=f"Permanently deleted user {user.email}",
        created_at=datetime.now(timezone.utc),
    )
    db.add(log)
    await db.delete(user)
    await db.commit()


@router.get("/activity-logs")
async def get_activity_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> Any:
    """Get security and activity audit logs (admin only)."""
    query = select(ActivityLog).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "user_id": str(log.user_id),
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


@router.get("/stats")
async def get_system_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> dict:
    """Get platform system health and entity counts (admin only)."""
    users_cnt = (await db.execute(select(func.count(User.id)))).scalar() or 0
    drones_cnt = (await db.execute(select(func.count(Drone.id)))).scalar() or 0
    missions_cnt = (await db.execute(select(func.count(Mission.id)))).scalar() or 0
    alerts_cnt = (await db.execute(select(func.count(Alert.id)))).scalar() or 0

    return {
        "total_users": users_cnt,
        "total_drones": drones_cnt,
        "total_missions": missions_cnt,
        "total_alerts": alerts_cnt,
        "database_status": "healthy",
        "telemetry_stream": "online",
        "server_time": datetime.now(timezone.utc).isoformat(),
    }
