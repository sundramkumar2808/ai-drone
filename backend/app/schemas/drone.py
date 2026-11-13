"""
Pydantic v2 schemas for Drone CRUD operations.
"""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class DroneCreate(BaseModel):
    """Schema for creating a new drone."""

    drone_name: str = Field(..., min_length=1, max_length=100, examples=["Falcon X1"])
    model: str = Field(..., min_length=1, max_length=100, examples=["DJI Mavic 3"])
    manufacturer: str = Field(..., min_length=1, max_length=100, examples=["DJI"])
    serial_number: str = Field(..., min_length=1, max_length=100, examples=["SN-2024-001"])
    battery_percentage: float = Field(100.0, ge=0, le=100)
    status: str = Field(
        "available",
        pattern="^(active|available|in_flight|charging|maintenance|offline)$",
    )
    location: Optional[str] = Field(None, max_length=255, examples=["Warehouse A"])
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    max_flight_time: float = Field(..., gt=0, examples=[30.0], description="Maximum flight time in minutes")
    max_payload: float = Field(..., gt=0, examples=[5.0], description="Maximum payload in kg")


class DroneUpdate(BaseModel):
    """Schema for updating a drone. All fields are optional."""

    drone_name: Optional[str] = Field(None, min_length=1, max_length=100)
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    manufacturer: Optional[str] = Field(None, min_length=1, max_length=100)
    serial_number: Optional[str] = Field(None, min_length=1, max_length=100)
    battery_percentage: Optional[float] = Field(None, ge=0, le=100)
    status: Optional[str] = Field(
        None,
        pattern="^(active|available|in_flight|charging|maintenance|offline)$",
    )
    location: Optional[str] = Field(None, max_length=255)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    max_flight_time: Optional[float] = Field(None, gt=0)
    max_payload: Optional[float] = Field(None, gt=0)


class DroneResponse(BaseModel):
    """Schema for drone response data."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    drone_name: str
    model: str
    manufacturer: str
    serial_number: str
    battery_percentage: float
    status: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    last_flight_date: Optional[datetime] = None
    total_flight_hours: float
    max_flight_time: float
    max_payload: float
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class DroneListResponse(BaseModel):
    """Schema for paginated drone list response."""

    drones: List[DroneResponse]
    total: int
