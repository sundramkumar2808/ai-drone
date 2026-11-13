"""
Pydantic v2 schemas for MaintenanceRecord CRUD operations.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MaintenanceCreate(BaseModel):
    """Schema for creating a maintenance record."""

    drone_id: uuid.UUID
    category: str = Field(
        ...,
        pattern="^(battery_replacement|motor_inspection|propeller_replacement|camera_repair|sensor_calibration|general_servicing)$",
        examples=["general_servicing"],
    )
    description: str = Field(..., min_length=1, examples=["Routine quarterly inspection"])
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = None


class MaintenanceUpdate(BaseModel):
    """Schema for updating a maintenance record."""

    status: Optional[str] = Field(
        None,
        pattern="^(scheduled|in_progress|completed|cancelled)$",
    )
    completed_date: Optional[datetime] = None
    cost: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None
    performed_by: Optional[uuid.UUID] = None


class MaintenanceResponse(BaseModel):
    """Schema for maintenance record response data."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    drone_id: uuid.UUID
    category: str
    description: str
    status: str
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    performed_by: Optional[uuid.UUID] = None
    cost: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
