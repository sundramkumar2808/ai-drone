"""Drone management API endpoints."""

from typing import Any, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, RoleChecker
from app.database.session import get_db
from app.models.user import User
from app.schemas.drone import (
    DroneCreate,
    DroneUpdate,
    DroneResponse,
    DroneListResponse,
)
from app.services import drone_service

router = APIRouter(prefix="/api/drones", tags=["Drones"])

# Role guards
admin_or_manager = RoleChecker(["admin", "fleet_manager"])
admin_only = RoleChecker(["admin"])


@router.get("", response_model=DroneListResponse)
async def list_drones(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """List all drones with optional filtering, search, and pagination."""
    drones, total = await drone_service.get_drones(
        db, skip=skip, limit=limit, status=status, search=search
    )
    return {"drones": drones, "total": total}


@router.post("", response_model=DroneResponse, status_code=status.HTTP_201_CREATED)
async def create_drone(
    drone_data: DroneCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_or_manager),
) -> Any:
    """Register a new drone into the fleet (admin or fleet manager only)."""
    try:
        drone = await drone_service.create_drone(db, drone_data, current_user.id)
        return drone
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{drone_id}", response_model=DroneResponse)
async def get_drone(
    drone_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get detailed information for a specific drone."""
    drone = await drone_service.get_drone(db, drone_id)
    if not drone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drone not found",
        )
    return drone


@router.put("/{drone_id}", response_model=DroneResponse)
async def update_drone(
    drone_id: uuid.UUID,
    drone_data: DroneUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_or_manager),
) -> Any:
    """Update drone properties and status (admin or fleet manager only)."""
    drone = await drone_service.update_drone(db, drone_id, drone_data)
    if not drone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drone not found",
        )
    return drone


@router.delete("/{drone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_drone(
    drone_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(admin_only),
) -> None:
    """Delete a drone from the fleet (admin only)."""
    success = await drone_service.delete_drone(db, drone_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Drone not found",
        )
