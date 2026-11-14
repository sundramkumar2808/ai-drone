"""Admin panel API endpoints using MongoDB."""

from typing import Any, List, Optional
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, Field

from app.api.deps import RoleChecker
from app.core.security import get_password_hash
from app.database.session import get_db
from app.models.user import User
from app.models.alert import ActivityLog
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
    db: Any = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> Any:
    """List all registered users (admin only)."""
    cursor = db.users.find({}).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [User(d) for d in docs]


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_by_admin(
    data: AdminUserCreate,
    db: Any = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> Any:
    """Create a new user with specific role (admin only)."""
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )

    now = datetime.now(timezone.utc)
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "full_name": data.full_name,
        "email": data.email,
        "phone": data.phone,
        "hashed_password": get_password_hash(data.password),
        "role": data.role,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(user_doc)

    log_doc = {
        "id": str(uuid.uuid4()),
        "user_id": str(current_user.id),
        "action": "CREATE_USER",
        "resource_type": "USER",
        "resource_id": user_id,
        "details": f"Created user {data.email} with role {data.role}",
        "created_at": now,
    }
    await db.activity_logs.insert_one(log_doc)
    return User(user_doc)


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_role(
    user_id: uuid.UUID,
    data: AdminUserUpdateRole,
    db: Any = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> Any:
    """Update user role (admin only)."""
    uid_str = str(user_id)
    user_doc = await db.users.find_one({"id": uid_str})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    now = datetime.now(timezone.utc)
    await db.users.update_one({"id": uid_str}, {"$set": {"role": data.role, "updated_at": now}})
    user_doc["role"] = data.role
    user_doc["updated_at"] = now

    log_doc = {
        "id": str(uuid.uuid4()),
        "user_id": str(current_user.id),
        "action": "UPDATE_USER_ROLE",
        "resource_type": "USER",
        "resource_id": uid_str,
        "details": f"Updated user {user_doc.get('email')} role to {data.role}",
        "created_at": now,
    }
    await db.activity_logs.insert_one(log_doc)
    return User(user_doc)


@router.put("/users/{user_id}/disable", response_model=UserResponse)
async def toggle_user_active(
    user_id: uuid.UUID,
    db: Any = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> Any:
    """Toggle user active status (admin only)."""
    uid_str = str(user_id)
    user_doc = await db.users.find_one({"id": uid_str})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    now = datetime.now(timezone.utc)
    new_active = not user_doc.get("is_active", True)
    await db.users.update_one({"id": uid_str}, {"$set": {"is_active": new_active, "updated_at": now}})
    user_doc["is_active"] = new_active
    user_doc["updated_at"] = now

    log_doc = {
        "id": str(uuid.uuid4()),
        "user_id": str(current_user.id),
        "action": "TOGGLE_USER_ACTIVE",
        "resource_type": "USER",
        "resource_id": uid_str,
        "details": f"Set user {user_doc.get('email')} active status to {new_active}",
        "created_at": now,
    }
    await db.activity_logs.insert_one(log_doc)
    return User(user_doc)


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: uuid.UUID,
    db: Any = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> None:
    """Hard delete a user account (admin only). Cannot delete own account."""
    uid_str = str(user_id)
    if str(current_user.id) == uid_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )
    user_doc = await db.users.find_one({"id": uid_str})
    if not user_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    now = datetime.now(timezone.utc)
    log_doc = {
        "id": str(uuid.uuid4()),
        "user_id": str(current_user.id),
        "action": "DELETE_USER",
        "resource_type": "USER",
        "resource_id": uid_str,
        "details": f"Permanently deleted user {user_doc.get('email')}",
        "created_at": now,
    }
    await db.activity_logs.insert_one(log_doc)
    await db.users.delete_one({"id": uid_str})


@router.get("/activity-logs")
async def get_activity_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Any = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> Any:
    """Get security and activity audit logs (admin only)."""
    cursor = db.activity_logs.find({}).sort("created_at", -1).skip(skip).limit(limit)
    logs = await cursor.to_list(length=limit)
    return [
        {
            "id": str(log.get("id")),
            "user_id": str(log.get("user_id")),
            "action": log.get("action"),
            "resource_type": log.get("resource_type"),
            "resource_id": str(log.get("resource_id")),
            "details": log.get("details"),
            "ip_address": log.get("ip_address"),
            "created_at": log["created_at"].isoformat() if isinstance(log.get("created_at"), datetime) else str(log.get("created_at") or ""),
        }
        for log in logs
    ]


@router.get("/stats")
async def get_system_stats(
    db: Any = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> dict:
    """Get platform system health and entity counts (admin only)."""
    users_cnt = await db.users.count_documents({})
    drones_cnt = await db.drones.count_documents({})
    missions_cnt = await db.missions.count_documents({})
    alerts_cnt = await db.alerts.count_documents({})

    return {
        "total_users": users_cnt,
        "total_drones": drones_cnt,
        "total_missions": missions_cnt,
        "total_alerts": alerts_cnt,
        "database_status": "healthy",
        "telemetry_stream": "online",
        "server_time": datetime.now(timezone.utc).isoformat(),
    }
