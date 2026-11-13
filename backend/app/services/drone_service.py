"""Drone management service module."""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.drone import Drone
from app.schemas.drone import DroneCreate, DroneUpdate


async def get_drones(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> Tuple[List[Drone], int]:
    """List drones with filtering, pagination, and search."""
    query = select(Drone)
    count_query = select(func.count(Drone.id))

    if status:
        query = query.where(Drone.status == status)
        count_query = count_query.where(Drone.status == status)

    if search:
        search_filter = or_(
            Drone.drone_name.ilike(f"%{search}%"),
            Drone.serial_number.ilike(f"%{search}%"),
            Drone.model.ilike(f"%{search}%"),
            Drone.manufacturer.ilike(f"%{search}%"),
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.offset(skip).limit(limit).order_by(Drone.created_at.desc())
    result = await db.execute(query)
    drones = result.scalars().all()

    return list(drones), total


async def get_drone(db: AsyncSession, drone_id: uuid.UUID) -> Optional[Drone]:
    """Get a single drone by ID."""
    result = await db.execute(select(Drone).where(Drone.id == drone_id))
    return result.scalar_one_or_none()


async def create_drone(
    db: AsyncSession, drone_data: DroneCreate, user_id: uuid.UUID
) -> Drone:
    """Create a new drone."""
    result = await db.execute(
        select(Drone).where(Drone.serial_number == drone_data.serial_number)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise ValueError("A drone with this serial number already exists")

    drone = Drone(
        id=uuid.uuid4(),
        drone_name=drone_data.drone_name,
        model=drone_data.model,
        manufacturer=drone_data.manufacturer,
        serial_number=drone_data.serial_number,
        battery_percentage=drone_data.battery_percentage if drone_data.battery_percentage is not None else 100.0,
        status=drone_data.status if drone_data.status else "available",
        location=drone_data.location,
        latitude=drone_data.latitude,
        longitude=drone_data.longitude,
        total_flight_hours=0.0,
        max_flight_time=drone_data.max_flight_time,
        max_payload=drone_data.max_payload,
        created_by=user_id,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(drone)
    await db.commit()
    await db.refresh(drone)
    return drone


async def update_drone(
    db: AsyncSession, drone_id: uuid.UUID, drone_data: DroneUpdate
) -> Optional[Drone]:
    """Update an existing drone."""
    result = await db.execute(select(Drone).where(Drone.id == drone_id))
    drone = result.scalar_one_or_none()
    if not drone:
        return None

    update_dict = drone_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(drone, field, value)

    drone.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(drone)
    return drone


async def delete_drone(db: AsyncSession, drone_id: uuid.UUID) -> bool:
    """Delete a drone by ID."""
    result = await db.execute(select(Drone).where(Drone.id == drone_id))
    drone = result.scalar_one_or_none()
    if not drone:
        return False

    await db.delete(drone)
    await db.commit()
    return True
