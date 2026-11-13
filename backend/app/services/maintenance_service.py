"""Maintenance service module."""

import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.maintenance import MaintenanceRecord
from app.models.drone import Drone
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate


async def get_maintenance_records(
    db: AsyncSession,
    drone_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[MaintenanceRecord], int]:
    """List maintenance records with optional filters."""
    query = select(MaintenanceRecord)
    count_query = select(func.count(MaintenanceRecord.id))

    if drone_id:
        query = query.where(MaintenanceRecord.drone_id == drone_id)
        count_query = count_query.where(MaintenanceRecord.drone_id == drone_id)

    if status:
        query = query.where(MaintenanceRecord.status == status)
        count_query = count_query.where(MaintenanceRecord.status == status)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = (
        query.offset(skip)
        .limit(limit)
        .order_by(MaintenanceRecord.created_at.desc())
    )
    result = await db.execute(query)
    records = result.scalars().all()

    return list(records), total


async def create_maintenance(
    db: AsyncSession, data: MaintenanceCreate
) -> MaintenanceRecord:
    """Create a new maintenance record."""
    record = MaintenanceRecord(
        id=uuid.uuid4(),
        drone_id=data.drone_id,
        category=data.category,
        description=data.description,
        status="scheduled",
        scheduled_date=data.scheduled_date or datetime.now(timezone.utc),
        notes=data.notes,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(record)

    # Set drone status to maintenance
    drone_res = await db.execute(select(Drone).where(Drone.id == data.drone_id))
    drone = drone_res.scalar_one_or_none()
    if drone:
        drone.status = "maintenance"
        drone.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(record)
    return record


async def update_maintenance(
    db: AsyncSession, record_id: uuid.UUID, data: MaintenanceUpdate
) -> Optional[MaintenanceRecord]:
    """Update an existing maintenance record."""
    result = await db.execute(
        select(MaintenanceRecord).where(MaintenanceRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(record, field, value)

    if data.status == "completed":
        record.completed_date = data.completed_date or datetime.now(timezone.utc)
        # Restore drone status to available
        drone_res = await db.execute(select(Drone).where(Drone.id == record.drone_id))
        drone = drone_res.scalar_one_or_none()
        if drone and drone.status == "maintenance":
            drone.status = "available"
            drone.updated_at = datetime.now(timezone.utc)

    record.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(record)
    return record


async def get_upcoming_maintenance(
    db: AsyncSession, days: int = 7
) -> List[MaintenanceRecord]:
    """Get maintenance records scheduled within the next N days."""
    now = datetime.now(timezone.utc)
    future = now + timedelta(days=days)

    query = (
        select(MaintenanceRecord)
        .where(
            MaintenanceRecord.status == "scheduled",
            MaintenanceRecord.scheduled_date >= now,
            MaintenanceRecord.scheduled_date <= future,
        )
        .order_by(MaintenanceRecord.scheduled_date.asc())
    )
    result = await db.execute(query)
    return list(result.scalars().all())
