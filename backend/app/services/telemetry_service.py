"""Telemetry service module with realistic simulation."""

import asyncio
import json
import math
import random
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.telemetry import Telemetry
from app.models.drone import Drone
from app.schemas.telemetry import TelemetryData


# Global list of connected WebSocket clients
ws_connections: List = []


async def get_telemetry(
    db: AsyncSession, drone_id: uuid.UUID, limit: int = 100
) -> List[Telemetry]:
    """Get telemetry records for a specific drone."""
    query = (
        select(Telemetry)
        .where(Telemetry.drone_id == drone_id)
        .order_by(Telemetry.timestamp.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_latest_telemetry(
    db: AsyncSession, drone_id: uuid.UUID
) -> Optional[Telemetry]:
    """Get the latest telemetry entry for a drone."""
    query = (
        select(Telemetry)
        .where(Telemetry.drone_id == drone_id)
        .order_by(Telemetry.timestamp.desc())
        .limit(1)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_all_latest_telemetry(db: AsyncSession) -> List[dict]:
    """Get the latest telemetry for every drone."""
    drones_result = await db.execute(select(Drone))
    drones = drones_result.scalars().all()

    latest_list = []
    for d in drones:
        latest = await get_latest_telemetry(db, d.id)
        if latest:
            latest_list.append({
                "drone_id": str(d.id),
                "drone_name": d.drone_name,
                "model": d.model,
                "status": d.status,
                "latitude": latest.latitude or d.latitude or 37.7749,
                "longitude": latest.longitude or d.longitude or -122.4194,
                "altitude": latest.altitude or 100.0,
                "speed": latest.speed or 12.5,
                "battery_level": latest.battery_level or d.battery_percentage,
                "temperature": latest.temperature or 24.5,
                "gps_signal": latest.gps_signal or 95.0,
                "connection_status": latest.connection_status or "connected",
                "timestamp": latest.timestamp.isoformat(),
            })
        else:
            latest_list.append({
                "drone_id": str(d.id),
                "drone_name": d.drone_name,
                "model": d.model,
                "status": d.status,
                "latitude": d.latitude or 37.7749,
                "longitude": d.longitude or -122.4194,
                "altitude": 0.0,
                "speed": 0.0,
                "battery_level": d.battery_percentage,
                "temperature": 22.0,
                "gps_signal": 98.0,
                "connection_status": "connected" if d.status != "offline" else "disconnected",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
    return latest_list


async def create_telemetry(
    db: AsyncSession, data: TelemetryData
) -> Telemetry:
    """Create a new telemetry data point."""
    record = Telemetry(
        id=uuid.uuid4(),
        drone_id=data.drone_id,
        latitude=data.latitude,
        longitude=data.longitude,
        altitude=data.altitude,
        speed=data.speed,
        battery_level=data.battery_level,
        temperature=data.temperature,
        gps_signal=data.gps_signal,
        connection_status=data.connection_status or "connected",
        timestamp=data.timestamp or datetime.now(timezone.utc),
    )
    db.add(record)

    # Update drone location and battery
    drone_result = await db.execute(select(Drone).where(Drone.id == data.drone_id))
    drone = drone_result.scalar_one_or_none()
    if drone:
        if data.latitude is not None:
            drone.latitude = data.latitude
        if data.longitude is not None:
            drone.longitude = data.longitude
        if data.battery_level is not None:
            drone.battery_percentage = data.battery_level
        drone.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(record)
    return record


class TelemetrySimulator:
    """Background simulator generating realistic live telemetry."""

    def __init__(self):
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._db_session_factory = None
        self._drone_states = {}

    def start(self, session_factory):
        """Start the telemetry background loop."""
        if not self._running:
            self._running = True
            self._db_session_factory = session_factory
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
        """Main simulation loop – updates every 2 seconds."""
        while self._running:
            try:
                if self._db_session_factory:
                    async with self._db_session_factory() as db:
                        result = await db.execute(
                            select(Drone).where(
                                Drone.status.in_(["in_flight", "active", "available"])
                            )
                        )
                        drones = result.scalars().all()

                        telemetry_batch = []
                        for drone in drones:
                            data = self._generate_telemetry(drone)
                            telemetry_batch.append(data)

                            if drone.status == "in_flight":
                                record = Telemetry(
                                    id=uuid.uuid4(),
                                    drone_id=drone.id,
                                    latitude=data["latitude"],
                                    longitude=data["longitude"],
                                    altitude=data["altitude"],
                                    speed=data["speed"],
                                    battery_level=data["battery_level"],
                                    temperature=data["temperature"],
                                    gps_signal=data["gps_signal"],
                                    connection_status=data["connection_status"],
                                    timestamp=datetime.now(timezone.utc),
                                )
                                db.add(record)
                                drone.latitude = data["latitude"]
                                drone.longitude = data["longitude"]
                                drone.battery_percentage = data["battery_level"]

                        if drones:
                            await db.commit()

                        # Broadcast to connected WebSocket clients
                        if telemetry_batch and ws_connections:
                            message = json.dumps(
                                {"type": "telemetry", "data": telemetry_batch}
                            )
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

            await asyncio.sleep(2)

    def _generate_telemetry(self, drone: Drone) -> dict:
        """Generate realistic telemetry for a single drone."""
        drone_key = str(drone.id)
        state = self._drone_states.get(drone_key)

        if state is None:
            state = {
                "latitude": float(drone.latitude or 37.7749),
                "longitude": float(drone.longitude or -122.4194),
                "altitude": 120.0 if drone.status == "in_flight" else 0.0,
                "speed": random.uniform(10, 18) if drone.status == "in_flight" else 0.0,
                "heading": random.uniform(0, 360),
                "battery_level": float(drone.battery_percentage or 100.0),
                "temperature": random.uniform(22, 34),
                "gps_signal": random.uniform(88, 100),
            }
            self._drone_states[drone_key] = state

        if drone.status == "in_flight":
            state["heading"] = (state["heading"] + random.uniform(-10, 10)) % 360
            heading_rad = math.radians(state["heading"])
            speed_ms = state["speed"]
            dt = 2.0
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
            "drone_name": drone.drone_name,
            "latitude": round(state["latitude"], 6),
            "longitude": round(state["longitude"], 6),
            "altitude": round(state["altitude"], 1),
            "speed": round(state["speed"], 1),
            "battery_level": round(state["battery_level"], 1),
            "temperature": round(state["temperature"], 1),
            "gps_signal": round(state["gps_signal"], 1),
            "connection_status": "connected" if drone.status != "offline" else "disconnected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


# Global singleton instance
telemetry_simulator = TelemetrySimulator()
