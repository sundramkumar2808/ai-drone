"""Drone management service module using MongoDB."""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Any

from app.models.drone import Drone
from app.schemas.drone import DroneCreate, DroneUpdate


async def get_drones(
    db: Any,
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> Tuple[List[Drone], int]:
    """List drones with filtering, pagination, and search."""
    filter_dict: dict = {}
    if status:
        filter_dict["status"] = status
    if search:
        filter_dict["$or"] = [
            {"drone_name": {"$regex": search}},
            {"serial_number": {"$regex": search}},
            {"model": {"$regex": search}},
            {"manufacturer": {"$regex": search}},
        ]

    total = await db.drones.count_documents(filter_dict)
    cursor = db.drones.find(filter_dict).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [Drone(d) for d in docs], total


async def get_drone(db: Any, drone_id: Any) -> Optional[Drone]:
    """Get a single drone by ID."""
    sid = str(drone_id)
    doc = await db.drones.find_one({"$or": [{"id": sid}, {"_id": sid}]})
    if not doc:
        try:
            from bson import ObjectId
            doc = await db.drones.find_one({"_id": ObjectId(sid)})
        except Exception:
            pass
    return Drone(doc) if doc else None


async def create_drone(
    db: Any, drone_data: DroneCreate, user_id: Any
) -> Drone:
    """Create a new drone."""
    existing = await db.drones.find_one({"serial_number": drone_data.serial_number})
    if existing:
        raise ValueError("A drone with this serial number already exists")

    now = datetime.now(timezone.utc)
    drone_doc = {
        "id": str(uuid.uuid4()),
        "drone_name": drone_data.drone_name,
        "model": drone_data.model,
        "manufacturer": drone_data.manufacturer,
        "serial_number": drone_data.serial_number,
        "battery_percentage": drone_data.battery_percentage if drone_data.battery_percentage is not None else 100.0,
        "status": drone_data.status or "available",
        "location": drone_data.location,
        "latitude": drone_data.latitude,
        "longitude": drone_data.longitude,
        "total_flight_hours": 0.0,
        "max_flight_time": drone_data.max_flight_time or 30.0,
        "max_payload": drone_data.max_payload or 5.0,
        "created_by": str(user_id) if user_id else None,
        "created_at": now,
        "updated_at": now,
    }
    await db.drones.insert_one(drone_doc)
    return Drone(drone_doc)


async def update_drone(
    db: Any, drone_id: Any, drone_data: DroneUpdate
) -> Optional[Drone]:
    """Update an existing drone and synchronize live telemetry."""
    target = await get_drone(db, drone_id)
    if not target:
        return None

    update_dict = drone_data.model_dump(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(timezone.utc)

    drone_str_id = str(target.id)
    sid = str(drone_id)
    query_or = [{"id": drone_str_id}, {"_id": drone_str_id}, {"id": sid}, {"_id": sid}]
    try:
        from bson import ObjectId
        query_or.append({"_id": ObjectId(drone_str_id)})
        query_or.append({"_id": ObjectId(sid)})
    except Exception:
        pass

    await db.drones.update_one({"$or": query_or}, {"$set": update_dict})
    target.update(update_dict)

    # Immediately synchronize with telemetry simulator and db.telemetry
    try:
        from app.services.telemetry_service import telemetry_simulator

        # Update simulator's live state directly from the updated target
        telemetry_simulator.sync_from_drone_update(drone_str_id, target, sid)

        # Update db.telemetry
        new_status = update_dict.get("status") or target.get("status", "available")
        new_battery = update_dict.get("battery_percentage") if update_dict.get("battery_percentage") is not None else target.get("battery_percentage", 100.0)
        is_flying = new_status in ["in_flight", "active"]
        alt = 125.0 if is_flying else 0.0
        spd = 14.5 if is_flying else 0.0

        await db.telemetry.update_one(
            {"$or": [{"drone_id": drone_str_id}, {"drone_id": sid}]},
            {"$set": {
                "drone_id": drone_str_id,
                "status": new_status,
                "battery_level": float(new_battery),
                "altitude": alt,
                "speed": spd,
                "timestamp": datetime.now(timezone.utc),
            }},
            upsert=True
        )
    except Exception:
        pass

    return target


async def delete_drone(db: Any, drone_id: Any) -> bool:
    """Delete a drone by ID."""
    res = await db.drones.delete_one({"id": str(drone_id)})
    return getattr(res, "deleted_count", 0) > 0
