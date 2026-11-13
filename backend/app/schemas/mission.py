"""
Pydantic v2 schemas for Mission CRUD operations.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class MissionCreate(BaseModel):
    """Schema for creating a new mission."""

    mission_name: str = Field(..., min_length=1, max_length=255, examples=["Survey Field A"])
    mission_type: str = Field(
        ...,
        pattern="^(surveillance|agriculture|delivery|mapping|search_rescue|inspection)$",
        examples=["surveillance"],
    )
    start_location: Optional[str] = Field(None, max_length=255, examples=["Base Station Alpha"])
    destination: Optional[str] = Field(None, max_length=255, examples=["Field Zone B"])
    start_lat: Optional[float] = Field(None, ge=-90, le=90)
    start_lng: Optional[float] = Field(None, ge=-180, le=180)
    dest_lat: Optional[float] = Field(None, ge=-90, le=90)
    dest_lng: Optional[float] = Field(None, ge=-180, le=180)
    scheduled_at: Optional[datetime] = None
    drone_id: Optional[uuid.UUID] = None
    operator_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class MissionUpdate(BaseModel):
    """Schema for updating a mission. All fields optional."""

    mission_name: Optional[str] = Field(None, min_length=1, max_length=255)
    mission_type: Optional[str] = Field(
        None,
        pattern="^(surveillance|agriculture|delivery|mapping|search_rescue|inspection)$",
    )
    status: Optional[str] = Field(
        None,
        pattern="^(pending|scheduled|in_progress|completed|failed|cancelled)$",
    )
    start_location: Optional[str] = Field(None, max_length=255)
    destination: Optional[str] = Field(None, max_length=255)
    start_lat: Optional[float] = Field(None, ge=-90, le=90)
    start_lng: Optional[float] = Field(None, ge=-180, le=180)
    dest_lat: Optional[float] = Field(None, ge=-90, le=90)
    dest_lng: Optional[float] = Field(None, ge=-180, le=180)
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    drone_id: Optional[uuid.UUID] = None
    operator_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None


class MissionResponse(BaseModel):
    """Schema for mission response data."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    mission_name: str
    mission_type: str
    status: str
    start_location: Optional[str] = None
    destination: Optional[str] = None
    start_lat: Optional[float] = None
    start_lng: Optional[float] = None
    dest_lat: Optional[float] = None
    dest_lng: Optional[float] = None
    scheduled_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = None
    drone_id: Optional[uuid.UUID] = None
    operator_id: Optional[uuid.UUID] = None
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
