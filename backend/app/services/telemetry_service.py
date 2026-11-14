"""Telemetry service module with MongoDB persistence and live simulation."""

import asyncio
import json
import math
import random
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Any

from app.models.telemetry import Telemetry
from app.models.drone import Drone
from app.schemas.telemetry import TelemetryData

# Global list of connected WebSocket clients
ws_connections: List = []


async def get_telemetry(
    db: Any, drone_id: Any, limit: int = 100
) -> List[Telemetry]:
    """Get telemetry records for a specific drone from MongoDB."""
    cursor = db.telemetry.find({"drone_id": str(drone_id)}).sort("timestamp", -1).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [Telemetry(d) for d in docs]


async def get_latest_telemetry(
    db: Any, drone_id: Any
) -> Optional[Telemetry]:
    """Get the latest telemetry entry for a drone."""
    cursor = db.telemetry.find({"drone_id": str(drone_id)}).sort("timestamp", -1).limit(1)
    docs = await cursor.to_list(length=1)
    return Telemetry(docs[0]) if docs else None


async def get_all_latest_telemetry(db: Any) -> List[dict]:
    """Get the latest telemetry for every drone."""
    cursor = db.drones.find({})
    drones = await cursor.to_list(length=500)

    latest_list = []
    for d in drones:
        drone_id = str(d.get("id"))
        latest = await get_latest_telemetry(db, drone_id)
        if latest:
            latest_list.append({
                "drone_id": drone_id,
                "drone_name": d.get("drone_name", "Drone"),
                "model": d.get("model", ""),
                "status": d.get("status", "available"),
                "latitude": latest.latitude or d.get("latitude") or 37.7749,
                "longitude": latest.longitude or d.get("longitude") or -122.4194,
                "altitude": latest.altitude or 100.0,
                "speed": latest.speed or 12.5,
                "battery_level": latest.battery_level or d.get("battery_percentage", 100.0),
                "temperature": latest.temperature or 24.5,
                "gps_signal": latest.gps_signal or 95.0,
                "connection_status": latest.connection_status or "connected",
                "timestamp": latest.timestamp.isoformat() if hasattr(latest.timestamp, "isoformat") else str(latest.timestamp),
            })
        else:
            latest_list.append({
                "drone_id": drone_id,
                "drone_name": d.get("drone_name", "Drone"),
                "model": d.get("model", ""),
                "status": d.get("status", "available"),
                "latitude": d.get("latitude") or 37.7749,
                "longitude": d.get("longitude") or -122.4194,
                "altitude": 0.0,
                "speed": 0.0,
                "battery_level": d.get("battery_percentage", 100.0),
                "temperature": 22.0,
                "gps_signal": 98.0,
                "connection_status": "connected" if d.get("status") != "offline" else "disconnected",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
    return latest_list


async def create_telemetry(
    db: Any, data: TelemetryData
) -> Telemetry:
    """Create a new telemetry data point."""
    now = data.timestamp or datetime.now(timezone.utc)
    record_doc = {
        "id": str(uuid.uuid4()),
        "drone_id": str(data.drone_id),
        "latitude": data.latitude,
        "longitude": data.longitude,
        "altitude": data.altitude,
        "speed": data.speed,
        "battery_level": data.battery_level,
        "temperature": data.temperature,
        "gps_signal": data.gps_signal,
        "connection_status": data.connection_status or "connected",
        "timestamp": now,
    }
    await db.telemetry.insert_one(record_doc)

    # Update drone state
    drone_update: dict = {"updated_at": now}
    if data.latitude is not None:
        drone_update["latitude"] = data.latitude
    if data.longitude is not None:
        drone_update["longitude"] = data.longitude
    if data.battery_level is not None:
        drone_update["battery_percentage"] = data.battery_level

    await db.drones.update_one({"id": str(data.drone_id)}, {"$set": drone_update})
    return Telemetry(record_doc)


class TelemetrySimulator:
    """Background simulator generating realistic live telemetry in MongoDB."""

    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._db_getter = None
        self._drone_states = {}

    def start(self, db_getter):
        """Start the telemetry background loop."""
        if not self._running:
            self._running = True
            self._db_getter = db_getter
            self._task = asyncio.create_task(self._run_loop())

    async def stop(self):
        """Stop the simulation loop."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

    async def _run_loop(self):
        """Main simulation loop – updates every 2.5 seconds."""
        while self._running:
            try:
                if self._db_getter:
                    db = self._db_getter() if callable(self._db_getter) else self._db_getter
                    if asyncio.iscoroutine(db):
                        db = await db

                    cursor = db.drones.find({"status": {"$in": ["in_flight", "active", "available"]}})
                    drones = await cursor.to_list(length=100)

                    telemetry_batch = []
                    for drone in drones:
                        data = self._generate_telemetry(drone)
                        telemetry_batch.append(data)

                        if drone.get("status") == "in_flight":
                            await db.drones.update_one(
                                {"id": str(drone.get("id"))},
                                {"$set": {
                                    "latitude": data["latitude"],
                                    "longitude": data["longitude"],
                                    "battery_percentage": data["battery_level"]
                                }}
                            )

                    # Broadcast to connected WebSocket clients
                    if telemetry_batch and ws_connections:
                        message = json.dumps({"type": "telemetry", "data": telemetry_batch})
                        disconnected = []
                        for ws in ws_connections:
                            try:
                                await ws.send_text(message)
                            except Exception:
                                disconnected.append(ws)
                        for ws in disconnected:
                            if ws in ws_connections:
                                ws_connections.remove(ws)

            except Exception:
                pass

            await asyncio.sleep(2.5)

    def _generate_telemetry(self, drone: dict) -> dict:
        """Generate realistic telemetry for a single drone."""
        drone_key = str(drone.get("id"))
        state = self._drone_states.get(drone_key)
        status = drone.get("status", "available")

        if state is None:
            state = {
                "latitude": float(drone.get("latitude") or 37.7749),
                "longitude": float(drone.get("longitude") or -122.4194),
                "altitude": 120.0 if status == "in_flight" else 0.0,
                "speed": random.uniform(10, 18) if status == "in_flight" else 0.0,
                "heading": random.uniform(0, 360),
                "battery_level": float(drone.get("battery_percentage") or 100.0),
                "temperature": random.uniform(22, 34),
                "gps_signal": random.uniform(88, 100),
            }
            self._drone_states[drone_key] = state

        if status == "in_flight":
            state["heading"] = (state["heading"] + random.uniform(-10, 10)) % 360
            heading_rad = math.radians(state["heading"])
            speed_ms = state["speed"]
            dt = 2.5
            distance_m = speed_ms * dt

            delta_lat = (distance_m * math.cos(heading_rad)) / 111320.0
            delta_lon = (distance_m * math.sin(heading_rad)) / (
                111320.0 * math.cos(math.radians(state["latitude"]))
            )
            state["latitude"] += delta_lat
            state["longitude"] += delta_lon

            state["altitude"] = max(20, min(300, state["altitude"] + random.uniform(-2, 2)))
            state["speed"] = max(5, min(25, state["speed"] + random.uniform(-1, 1)))
            state["battery_level"] = max(5, state["battery_level"] - random.uniform(0.01, 0.05))

        state["temperature"] = max(18, min(42, state["temperature"] + random.uniform(-0.3, 0.3)))
        state["gps_signal"] = max(75, min(100, state["gps_signal"] + random.uniform(-1, 1)))

        return {
            "drone_id": drone_key,
            "drone_name": drone.get("drone_name", "Drone"),
            "latitude": round(state["latitude"], 6),
            "longitude": round(state["longitude"], 6),
            "altitude": round(state["altitude"], 1),
            "speed": round(state["speed"], 1),
            "battery_level": round(state["battery_level"], 1),
            "temperature": round(state["temperature"], 1),
            "gps_signal": round(state["gps_signal"], 1),
            "connection_status": "connected" if status != "offline" else "disconnected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


# Global singleton instance
telemetry_simulator = TelemetrySimulator()
