"""
Pydantic v2 schemas for Telemetry data.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TelemetryData(BaseModel):
    """Schema for incoming telemetry data from drones."""

    drone_id: uuid.UUID
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    altitude: Optional[float] = Field(None, ge=0, description="Altitude in meters")
    speed: Optional[float] = Field(None, ge=0, description="Speed in m/s")
    battery_level: Optional[float] = Field(None, ge=0, le=100)
    temperature: Optional[float] = Field(None, description="Temperature in Celsius")
    gps_signal: Optional[float] = Field(None, ge=0, le=100, description="GPS signal strength %")
    connection_status: Optional[str] = Field(
        "connected",
        pattern="^(connected|disconnected|weak)$",
    )
    timestamp: Optional[datetime] = None


TelemetryCreate = TelemetryData


class TelemetryResponse(BaseModel):
    """Schema for telemetry response data."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    drone_id: uuid.UUID
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    altitude: Optional[float] = None
    speed: Optional[float] = None
    battery_level: Optional[float] = None
    temperature: Optional[float] = None
    gps_signal: Optional[float] = None
    connection_status: Optional[str] = None
    timestamp: datetime
