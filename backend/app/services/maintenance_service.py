"""Maintenance service module using MongoDB."""

import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple, Any

from app.models.maintenance import MaintenanceRecord
from app.models.drone import Drone
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate


async def get_maintenance_records(
    db: Any,
    drone_id: Any = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[MaintenanceRecord], int]:
    """List maintenance records with optional filters."""
    filter_dict: dict = {}
    if drone_id:
        filter_dict["drone_id"] = str(drone_id)
    if status:
        filter_dict["status"] = status

    total = await db.maintenance.count_documents(filter_dict)
    cursor = db.maintenance.find(filter_dict).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [MaintenanceRecord(d) for d in docs], total


async def create_maintenance(
    db: Any, data: MaintenanceCreate
) -> MaintenanceRecord:
    """Create a new maintenance record."""
    now = datetime.now(timezone.utc)
    record_doc = {
        "id": str(uuid.uuid4()),
        "drone_id": str(data.drone_id),
        "category": data.category,
        "description": data.description,
        "status": "scheduled",
        "scheduled_date": data.scheduled_date or now,
        "completed_date": None,
        "notes": data.notes,
        "created_at": now,
        "updated_at": now,
    }
    await db.maintenance.insert_one(record_doc)

    # Set drone status to maintenance
    await db.drones.update_one(
        {"id": str(data.drone_id)},
        {"$set": {"status": "maintenance", "updated_at": now}}
    )
    return MaintenanceRecord(record_doc)


async def update_maintenance(
    db: Any, record_id: Any, data: MaintenanceUpdate
) -> Optional[MaintenanceRecord]:
    """Update an existing maintenance record."""
    doc = await db.maintenance.find_one({"id": str(record_id)})
    if not doc:
        return None

    update_dict = data.model_dump(exclude_unset=True)
    now = datetime.now(timezone.utc)
    update_dict["updated_at"] = now

    if data.status == "completed":
        update_dict["completed_date"] = data.completed_date or now
        # Restore drone status to available
        await db.drones.update_one(
            {"id": str(doc.get("drone_id"))},
            {"$set": {"status": "available", "updated_at": now}}
        )

    await db.maintenance.update_one({"id": str(record_id)}, {"$set": update_dict})
    doc.update(update_dict)
    return MaintenanceRecord(doc)


async def get_upcoming_maintenance(
    db: Any, days: int = 7
) -> List[MaintenanceRecord]:
    """Get maintenance records scheduled within the next N days."""
    now = datetime.now(timezone.utc)
    future = now + timedelta(days=days)
    filter_dict = {
        "status": "scheduled",
        "scheduled_date": {"$gte": now, "$lte": future}
    }
    cursor = db.maintenance.find(filter_dict).sort("scheduled_date", 1)
    docs = await cursor.to_list(length=100)
    return [MaintenanceRecord(d) for d in docs]
