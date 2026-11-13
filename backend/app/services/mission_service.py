"""Mission management service module."""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.mission import Mission
from app.models.drone import Drone
from app.schemas.mission import MissionCreate, MissionUpdate


async def get_missions(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    mission_type: Optional[str] = None,
    drone_id: Optional[uuid.UUID] = None,
) -> Tuple[List[Mission], int]:
    """List missions with filtering and pagination."""
    query = select(Mission)
    count_query = select(func.count(Mission.id))

    if status:
        query = query.where(Mission.status == status)
        count_query = count_query.where(Mission.status == status)

    if mission_type:
        query = query.where(Mission.mission_type == mission_type)
        count_query = count_query.where(Mission.mission_type == mission_type)

    if drone_id:
        query = query.where(Mission.drone_id == drone_id)
        count_query = count_query.where(Mission.drone_id == drone_id)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset(skip).limit(limit).order_by(Mission.created_at.desc())
    result = await db.execute(query)
    missions = result.scalars().all()

    return list(missions), total


async def get_mission(db: AsyncSession, mission_id: uuid.UUID) -> Optional[Mission]:
    """Get a single mission by ID."""
    result = await db.execute(select(Mission).where(Mission.id == mission_id))
    return result.scalar_one_or_none()


async def create_mission(
    db: AsyncSession, mission_data: MissionCreate, user_id: uuid.UUID
) -> Mission:
    """Create a new mission."""
    if mission_data.drone_id:
        drone_result = await db.execute(
            select(Drone).where(Drone.id == mission_data.drone_id)
        )
        drone = drone_result.scalar_one_or_none()
        if not drone:
            raise ValueError("Drone not found")
        if drone.status not in ("available", "active"):
            raise ValueError(f"Drone is not available (current status: {drone.status})")

    mission = Mission(
        id=uuid.uuid4(),
        mission_name=mission_data.mission_name,
        mission_type=mission_data.mission_type,
        status="scheduled" if mission_data.scheduled_at else "pending",
        start_location=mission_data.start_location,
        destination=mission_data.destination,
        start_lat=mission_data.start_lat,
        start_lng=mission_data.start_lng,
        dest_lat=mission_data.dest_lat,
        dest_lng=mission_data.dest_lng,
        scheduled_at=mission_data.scheduled_at,
        notes=mission_data.notes,
        drone_id=mission_data.drone_id,
        operator_id=mission_data.operator_id or user_id,
        created_by=user_id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(mission)
    await db.commit()
    await db.refresh(mission)
    return mission


async def update_mission(
    db: AsyncSession, mission_id: uuid.UUID, mission_data: MissionUpdate
) -> Optional[Mission]:
    """Update an existing mission."""
    result = await db.execute(select(Mission).where(Mission.id == mission_id))
    mission = result.scalar_one_or_none()
    if not mission:
        return None

    update_dict = mission_data.model_dump(exclude_unset=True)

    # Status transitions and drone synchronization
    if "status" in update_dict and update_dict["status"] != mission.status:
        new_status = update_dict["status"]
        if new_status == "in_progress" and not mission.started_at:
            mission.started_at = datetime.now(timezone.utc)
            if mission.drone_id:
                drone_res = await db.execute(select(Drone).where(Drone.id == mission.drone_id))
                drone = drone_res.scalar_one_or_none()
                if drone:
                    drone.status = "in_flight"
        elif new_status in ("completed", "failed", "cancelled"):
            mission.completed_at = datetime.now(timezone.utc)
            if mission.drone_id:
                drone_res = await db.execute(select(Drone).where(Drone.id == mission.drone_id))
                drone = drone_res.scalar_one_or_none()
                if drone:
                    drone.status = "available"
                    drone.last_flight_date = datetime.now(timezone.utc)
                    # Add flight hours if completed
                    if new_status == "completed":
                        drone.total_flight_hours += 1.5

    for field, value in update_dict.items():
        setattr(mission, field, value)

    mission.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(mission)
    return mission


async def cancel_mission(db: AsyncSession, mission_id: uuid.UUID) -> Optional[Mission]:
    """Cancel a mission."""
    result = await db.execute(select(Mission).where(Mission.id == mission_id))
    mission = result.scalar_one_or_none()
    if not mission:
        return None

    mission.status = "cancelled"
    mission.completed_at = datetime.now(timezone.utc)
    mission.updated_at = datetime.now(timezone.utc)

    if mission.drone_id:
        drone_res = await db.execute(select(Drone).where(Drone.id == mission.drone_id))
        drone = drone_res.scalar_one_or_none()
        if drone and drone.status == "in_flight":
            drone.status = "available"

    await db.commit()
    await db.refresh(mission)
    return mission
