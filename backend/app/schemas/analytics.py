"""
Pydantic v2 schemas for analytics and dashboard statistics.
"""

from typing import Any, Dict, List

from pydantic import BaseModel, Field


class OverviewStats(BaseModel):
    """Schema for dashboard overview statistics."""

    total_drones: int = Field(0, ge=0)
    active_drones: int = Field(0, ge=0)
    available_drones: int = Field(0, ge=0)
    maintenance_drones: int = Field(0, ge=0)
    active_missions: int = Field(0, ge=0)
    completed_missions: int = Field(0, ge=0)
    total_flight_hours: float = Field(0.0, ge=0)
    mission_success_rate: float = Field(0.0, ge=0, le=100)


class MissionAnalytics(BaseModel):
    """Schema for mission analytics data."""

    monthly_missions: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="List of monthly mission counts with month label",
    )
    mission_type_distribution: Dict[str, int] = Field(
        default_factory=dict,
        description="Count of missions per mission type",
    )
    status_distribution: Dict[str, int] = Field(
        default_factory=dict,
        description="Count of missions per status",
    )


class DroneAnalytics(BaseModel):
    """Schema for drone analytics data."""

    utilization: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Drone utilization rates",
    )
    battery_health: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Battery health data per drone",
    )
    performance: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Drone performance metrics",
    )
