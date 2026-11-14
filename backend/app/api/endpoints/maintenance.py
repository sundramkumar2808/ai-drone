"""Maintenance management API endpoints."""

from typing import Any, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_active_user, RoleChecker
from app.database.session import get_db
from app.models.user import User
from app.schemas.maintenance import (
    MaintenanceCreate,
    MaintenanceUpdate,
    MaintenanceResponse,
)
from app.services import maintenance_service

router = APIRouter(prefix="/api/maintenance", tags=["Maintenance"])

# Technicians and managers
maintenance_roles = RoleChecker(["admin", "fleet_manager", "operator"])


@router.get("", response_model=dict)
async def list_maintenance_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    drone_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """List maintenance records with filtering and pagination."""
    records, total = await maintenance_service.get_maintenance_records(
        db, drone_id=drone_id, status=status, skip=skip, limit=limit
    )
    return {
        "records": [MaintenanceResponse.model_validate(r) for r in records],
        "total": total,
    }


@router.get("/upcoming", response_model=List[MaintenanceResponse])
async def get_upcoming_maintenance(
    days: int = Query(14, ge=1, le=90),
    db: Any = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get scheduled maintenance events due in the next N days."""
    return await maintenance_service.get_upcoming_maintenance(db, days=days)


@router.post("", response_model=MaintenanceResponse, status_code=status.HTTP_201_CREATED)
async def create_maintenance_record(
    data: MaintenanceCreate,
    db: Any = Depends(get_db),
    current_user: User = Depends(maintenance_roles),
) -> Any:
    """Schedule a new maintenance or inspection task."""
    return await maintenance_service.create_maintenance(db, data)


@router.put("/{record_id}", response_model=MaintenanceResponse)
async def update_maintenance_record(
    record_id: uuid.UUID,
    data: MaintenanceUpdate,
    db: Any = Depends(get_db),
    current_user: User = Depends(maintenance_roles),
) -> Any:
    """Update maintenance status, completed date, or cost."""
    record = await maintenance_service.update_maintenance(db, record_id, data)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Maintenance record not found",
        )
    return record
