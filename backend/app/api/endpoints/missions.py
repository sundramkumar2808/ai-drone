"""Mission management API endpoints."""

from typing import Any, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, RoleChecker
from app.database.session import get_db
from app.models.user import User
from app.schemas.mission import (
    MissionCreate,
    MissionUpdate,
    MissionResponse,
)
from app.services import mission_service

router = APIRouter(prefix="/api/missions", tags=["Missions"])

# Allowed operators and managers
planner_roles = RoleChecker(["admin", "fleet_manager", "operator"])


@router.get("", response_model=dict)
async def list_missions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    mission_type: Optional[str] = Query(None),
    drone_id: Optional[uuid.UUID] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """List missions with optional filtering."""
    missions, total = await mission_service.get_missions(
        db,
        skip=skip,
        limit=limit,
        status=status,
        mission_type=mission_type,
        drone_id=drone_id,
    )
    return {
        "missions": [MissionResponse.model_validate(m) for m in missions],
        "total": total,
    }


@router.post("", response_model=MissionResponse, status_code=status.HTTP_201_CREATED)
async def create_mission(
    mission_data: MissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(planner_roles),
) -> Any:
    """Create and schedule a new drone mission."""
    try:
        mission = await mission_service.create_mission(db, mission_data, current_user.id)
        return mission
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{mission_id}", response_model=MissionResponse)
async def get_mission(
    mission_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get mission details."""
    mission = await mission_service.get_mission(db, mission_id)
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found",
        )
    return mission


@router.put("/{mission_id}", response_model=MissionResponse)
async def update_mission(
    mission_id: uuid.UUID,
    mission_data: MissionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(planner_roles),
) -> Any:
    """Update mission details or change mission status."""
    mission = await mission_service.update_mission(db, mission_id, mission_data)
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found",
        )
    return mission


@router.delete("/{mission_id}")
async def cancel_mission(
    mission_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(planner_roles),
) -> Any:
    """Cancel a mission."""
    mission = await mission_service.cancel_mission(db, mission_id)
    if not mission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mission not found",
        )
    return {"message": "Mission cancelled successfully", "id": str(mission_id)}
