"""Mission management service module using MongoDB."""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Any

from app.models.mission import Mission
from app.models.drone import Drone
from app.schemas.mission import MissionCreate, MissionUpdate


async def get_missions(
    db: Any,
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    mission_type: Optional[str] = None,
    drone_id: Any = None,
) -> Tuple[List[Mission], int]:
    """List missions with filtering and pagination."""
    filter_dict: dict = {}
    if status:
        filter_dict["status"] = status
    if mission_type:
        filter_dict["mission_type"] = mission_type
    if drone_id:
        filter_dict["drone_id"] = str(drone_id)

    total = await db.missions.count_documents(filter_dict)
    cursor = db.missions.find(filter_dict).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [Mission(d) for d in docs], total


async def get_mission(db: Any, mission_id: Any) -> Optional[Mission]:
    """Get a single mission by ID."""
    doc = await db.missions.find_one({"id": str(mission_id)})
    if not doc:
        doc = await db.missions.find_one({"_id": str(mission_id)})
    return Mission(doc) if doc else None


async def create_mission(
    db: Any, mission_data: MissionCreate, user_id: Any
) -> Mission:
    """Create a new mission."""
    if mission_data.drone_id:
        drone_doc = await db.drones.find_one({"id": str(mission_data.drone_id)})
        if not drone_doc:
            raise ValueError("Drone not found")
        if drone_doc.get("status") not in ("available", "active"):
            raise ValueError(f"Drone is not available (current status: {drone_doc.get('status')})")

    now = datetime.now(timezone.utc)
    mission_doc = {
        "id": str(uuid.uuid4()),
        "mission_name": mission_data.mission_name,
        "mission_type": mission_data.mission_type,
        "status": "scheduled" if mission_data.scheduled_at else "pending",
        "start_location": mission_data.start_location,
        "destination": mission_data.destination,
        "start_lat": mission_data.start_lat,
        "start_lng": mission_data.start_lng,
        "dest_lat": mission_data.dest_lat,
        "dest_lng": mission_data.dest_lng,
        "scheduled_at": mission_data.scheduled_at,
        "started_at": None,
        "completed_at": None,
        "notes": mission_data.notes,
        "drone_id": str(mission_data.drone_id) if mission_data.drone_id else None,
        "operator_id": str(mission_data.operator_id or user_id),
        "created_by": str(user_id) if user_id else None,
        "created_at": now,
        "updated_at": now,
    }
    await db.missions.insert_one(mission_doc)
    return Mission(mission_doc)


async def update_mission(
    db: Any, mission_id: Any, mission_data: MissionUpdate
) -> Optional[Mission]:
    """Update an existing mission."""
    mission = await get_mission(db, mission_id)
    if not mission:
        return None

    update_dict = mission_data.model_dump(exclude_unset=True)
    now = datetime.now(timezone.utc)

    # Status transitions and drone synchronization
    if "status" in update_dict and update_dict["status"] != mission.status:
        new_status = update_dict["status"]
        if new_status == "in_progress" and not mission.started_at:
            update_dict["started_at"] = now
            if mission.drone_id:
                await db.drones.update_one({"id": str(mission.drone_id)}, {"$set": {"status": "in_flight"}})
        elif new_status in ("completed", "failed", "cancelled"):
            update_dict["completed_at"] = now
            if mission.drone_id:
                drone_doc = await db.drones.find_one({"id": str(mission.drone_id)})
                hours_add = 1.5 if new_status == "completed" else 0.0
                curr_hours = drone_doc.get("total_flight_hours", 0.0) if drone_doc else 0.0
                await db.drones.update_one(
                    {"id": str(mission.drone_id)},
                    {"$set": {
                        "status": "available",
                        "last_flight_date": now,
                        "total_flight_hours": curr_hours + hours_add
                    }}
                )

    update_dict["updated_at"] = now
    await db.missions.update_one({"id": str(mission.id)}, {"$set": update_dict})
    mission.update(update_dict)
    return mission


async def cancel_mission(db: Any, mission_id: Any) -> Optional[Mission]:
    """Cancel a mission."""
    mission = await get_mission(db, mission_id)
    if not mission:
        return None

    now = datetime.now(timezone.utc)
    update_dict = {
        "status": "cancelled",
        "completed_at": now,
        "updated_at": now,
    }
    await db.missions.update_one({"id": str(mission.id)}, {"$set": update_dict})
    if mission.drone_id:
        await db.drones.update_one({"id": str(mission.drone_id)}, {"$set": {"status": "available"}})

    mission.update(update_dict)
    return mission
