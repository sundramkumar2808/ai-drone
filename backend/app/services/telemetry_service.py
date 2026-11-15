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
        status = d.get("status", "available")
        is_flying = status in ["in_flight", "active"]

        # Check live simulated state
        sim_data = telemetry_simulator.get_drone_state(drone_id, d)
        if sim_data:
            latest_list.append(sim_data)
            continue

        latest = await get_latest_telemetry(db, drone_id)
        if latest:
            alt = latest.altitude
            spd = latest.speed
            if is_flying:
                if alt is None or alt <= 0.0:
                    alt = round(random.uniform(110.0, 145.0), 1)
                if spd is None or spd <= 0.0:
                    spd = round(random.uniform(12.0, 16.5), 1)
            else:
                alt = 0.0
                spd = 0.0

            latest_list.append({
                "drone_id": drone_id,
                "drone_name": d.get("drone_name", "Drone"),
                "model": d.get("model", ""),
                "status": status,
                "latitude": latest.latitude or d.get("latitude") or 37.7749,
                "longitude": latest.longitude or d.get("longitude") or -122.4194,
                "altitude": alt,
                "speed": spd,
                "battery_level": latest.battery_level or d.get("battery_percentage", 100.0),
                "temperature": latest.temperature or (28.5 if is_flying else 22.0),
                "gps_signal": latest.gps_signal or 98.0,
                "connection_status": latest.connection_status or ("connected" if status != "offline" else "disconnected"),
                "timestamp": latest.timestamp.isoformat() if hasattr(latest.timestamp, "isoformat") else str(latest.timestamp),
            })
        else:
            alt = round(random.uniform(110.0, 145.0), 1) if is_flying else 0.0
            spd = round(random.uniform(12.0, 16.5), 1) if is_flying else 0.0
            latest_list.append({
                "drone_id": drone_id,
                "drone_name": d.get("drone_name", "Drone"),
                "model": d.get("model", ""),
                "status": status,
                "latitude": d.get("latitude") or 37.7749,
                "longitude": d.get("longitude") or -122.4194,
                "altitude": alt,
                "speed": spd,
                "battery_level": d.get("battery_percentage", 100.0),
                "temperature": 28.5 if is_flying else 22.0,
                "gps_signal": 98.0,
                "connection_status": "connected" if status != "offline" else "disconnected",
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

    def get_drone_state(self, drone_id: str, drone: Optional[dict] = None) -> Optional[dict]:
        """Get live simulated state for a drone."""
        key = str(drone_id)
        if key in self._drone_states:
            if drone and drone.get("status") and self._drone_states[key].get("status") != drone.get("status"):
                self.notify_drone_status_change(key, drone.get("status"))
            return self._drone_states[key]
        if drone:
            return self._generate_telemetry(drone)
        return None

    def notify_drone_status_change(self, drone_id: str, new_status: str):
        """Immediately update simulated state when a drone's status changes."""
        key = str(drone_id)
        is_flying = new_status in ["in_flight", "active"]
        if key in self._drone_states:
            state = self._drone_states[key]
            state["status"] = new_status
            if is_flying:
                if state.get("altitude", 0.0) <= 0.0:
                    state["altitude"] = round(random.uniform(105.0, 145.0), 1)
                if state.get("speed", 0.0) <= 0.0:
                    state["speed"] = round(random.uniform(12.0, 17.5), 1)
            else:
                state["altitude"] = 0.0
                state["speed"] = 0.0

    def notify_drone_battery_change(self, drone_id: str, new_battery: float):
        """Immediately update simulated battery level when drone battery is modified."""
        key = str(drone_id)
        if key in self._drone_states:
            self._drone_states[key]["battery_level"] = round(float(new_battery), 1)

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

                    cursor = db.drones.find({})
                    drones = await cursor.to_list(length=200)

                    telemetry_batch = []
                    for drone in drones:
                        data = self._generate_telemetry(drone)
                        telemetry_batch.append(data)

                        drone_id = str(drone.get("id"))
                        status = drone.get("status", "available")
                        is_flying = status in ["in_flight", "active"]

                        drone_update = {
                            "battery_percentage": data["battery_level"]
                        }
                        if is_flying:
                            drone_update["latitude"] = data["latitude"]
                            drone_update["longitude"] = data["longitude"]

                        await db.drones.update_one(
                            {"$or": [{"id": drone_id}, {"_id": drone_id}]},
                            {"$set": drone_update}
                        )

                        # Upsert telemetry record in DB
                        await db.telemetry.update_one(
                            {"drone_id": drone_id},
                            {"$set": {
                                "drone_id": drone_id,
                                "latitude": data["latitude"],
                                "longitude": data["longitude"],
                                "altitude": data["altitude"],
                                "speed": data["speed"],
                                "battery_level": data["battery_level"],
                                "temperature": data["temperature"],
                                "gps_signal": data["gps_signal"],
                                "connection_status": data["connection_status"],
                                "timestamp": datetime.now(timezone.utc),
                            }},
                            upsert=True,
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
        is_flying = status in ["in_flight", "active"]

        if state is None or not isinstance(state, dict):
            initial_alt = round(random.uniform(95.0, 145.0), 1) if is_flying else 0.0
            initial_speed = round(random.uniform(11.0, 17.5), 1) if is_flying else 0.0
            state = {
                "latitude": float(drone.get("latitude") or 37.7749),
                "longitude": float(drone.get("longitude") or -122.4194),
                "altitude": initial_alt,
                "speed": initial_speed,
                "heading": random.uniform(0, 360),
                "battery_level": float(drone.get("battery_percentage") or 90.0),
                "temperature": round(random.uniform(25.0, 32.0), 1) if is_flying else 22.0,
                "gps_signal": round(random.uniform(92.0, 99.0), 1),
                "status": status,
            }
            self._drone_states[drone_key] = state

        # If DB status differs from cached status, update immediately
        if state.get("status") != status:
            state["status"] = status
            if is_flying:
                state["altitude"] = round(random.uniform(105.0, 145.0), 1)
                state["speed"] = round(random.uniform(12.0, 17.5), 1)
            else:
                state["altitude"] = 0.0
                state["speed"] = 0.0

        # Sync battery level if changed in DB (e.g. via Fleet Management or API)
        db_battery = drone.get("battery_percentage")
        if db_battery is not None:
            db_bat_flt = round(float(db_battery), 1)
            if abs(db_bat_flt - float(state.get("battery_level", 0.0))) > 1.0:
                state["battery_level"] = db_bat_flt

        if is_flying:
            # Ensure in-flight drone always has realistic cruising altitude & ground speed
            if state.get("altitude", 0.0) <= 0.0:
                state["altitude"] = round(random.uniform(105.0, 145.0), 1)
            if state.get("speed", 0.0) <= 0.0:
                state["speed"] = round(random.uniform(11.5, 17.0), 1)

            state["heading"] = (state.get("heading", 0.0) + random.uniform(-8, 8)) % 360
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

            state["altitude"] = max(40.0, min(300.0, round(state["altitude"] + random.uniform(-1.5, 1.5), 1)))
            state["speed"] = max(8.0, min(25.0, round(state["speed"] + random.uniform(-0.8, 0.8), 1)))
            state["battery_level"] = max(5.0, round(state["battery_level"] - random.uniform(0.01, 0.03), 1))
        else:
            # Grounded in hangar / maintenance pad
            state["altitude"] = 0.0
            state["speed"] = 0.0

        state["temperature"] = max(18.0, min(42.0, round(state.get("temperature", 22.0) + random.uniform(-0.2, 0.2), 1)))
        state["gps_signal"] = max(80.0, min(100.0, round(state.get("gps_signal", 98.0) + random.uniform(-0.5, 0.5), 1)))

        data_dict = {
            "drone_id": drone_key,
            "drone_name": drone.get("drone_name", "Drone"),
            "model": drone.get("model", ""),
            "status": status,
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
        self._drone_states[drone_key] = data_dict
        return data_dict


# Global singleton instance
telemetry_simulator = TelemetrySimulator()
