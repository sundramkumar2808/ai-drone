"""Database seeder with realistic drone fleet initial data for MongoDB."""

import asyncio
from datetime import datetime, timezone, timedelta
import uuid

from app.core.security import get_password_hash
from app.database.mongodb import get_database


async def seed():
    """Seed MongoDB with enterprise-ready drone fleet data."""
    db = get_database()

    # Check if already seeded
    existing_admin = await db.users.find_one({"email": "admin@dronefleet.ai"})
    if existing_admin:
        return

    print("[MongoDB Seed] Seeding demo users...")
    now = datetime.now(timezone.utc)

    users_data = [
        {
            "id": str(uuid.uuid4()),
            "full_name": "Chief Administrator",
            "email": "admin@dronefleet.ai",
            "phone": "+1-555-0199",
            "hashed_password": get_password_hash("AdminPassword123!"),
            "role": "admin",
            "is_active": True,
            "created_at": now - timedelta(days=90),
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "full_name": "Sarah Connor (Fleet Manager)",
            "email": "manager@dronefleet.ai",
            "phone": "+1-555-0142",
            "hashed_password": get_password_hash("ManagerPassword123!"),
            "role": "fleet_manager",
            "is_active": True,
            "created_at": now - timedelta(days=60),
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "full_name": "Marcus Vance (Drone Pilot)",
            "email": "operator@dronefleet.ai",
            "phone": "+1-555-0177",
            "hashed_password": get_password_hash("OperatorPassword123!"),
            "role": "operator",
            "is_active": True,
            "created_at": now - timedelta(days=45),
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "full_name": "Elena Rostova (Flight Analyst)",
            "email": "viewer@dronefleet.ai",
            "phone": "+1-555-0123",
            "hashed_password": get_password_hash("ViewerPassword123!"),
            "role": "viewer",
            "is_active": True,
            "created_at": now - timedelta(days=30),
            "updated_at": now,
        },
    ]

    for u in users_data:
        await db.users.insert_one(u)

    admin_id = users_data[0]["id"]
    operator_id = users_data[2]["id"]

    print("[MongoDB Seed] Seeding airframes...")
    drones_data = [
        {
            "id": str(uuid.uuid4()),
            "drone_name": "Falcon-X1",
            "model": "Matrice 300 RTK",
            "manufacturer": "DJI Enterprise",
            "serial_number": "DJI-M300-8841",
            "battery_percentage": 94.0,
            "status": "in_flight",
            "location": "San Francisco Sector 4",
            "latitude": 37.7749,
            "longitude": -122.4194,
            "total_flight_hours": 142.5,
            "max_flight_time": 55.0,
            "max_payload": 2.7,
            "created_by": admin_id,
            "created_at": now - timedelta(days=120),
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "drone_name": "Guardian-Alpha",
            "model": "Skydio X2D",
            "manufacturer": "Skydio Defense",
            "serial_number": "SKY-X2D-1092",
            "battery_percentage": 87.0,
            "status": "in_flight",
            "location": "Oakland Industrial Port",
            "latitude": 37.8044,
            "longitude": -122.2712,
            "total_flight_hours": 98.2,
            "max_flight_time": 35.0,
            "max_payload": 1.2,
            "created_by": admin_id,
            "created_at": now - timedelta(days=100),
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "drone_name": "SkySurveyor-4K",
            "model": "WingtraOne GEN II",
            "manufacturer": "Wingtra",
            "serial_number": "WNG-GEN2-5501",
            "battery_percentage": 100.0,
            "status": "available",
            "location": "Palo Alto Hangar A",
            "latitude": 37.4419,
            "longitude": -122.1430,
            "total_flight_hours": 64.0,
            "max_flight_time": 59.0,
            "max_payload": 0.8,
            "created_by": admin_id,
            "created_at": now - timedelta(days=80),
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "drone_name": "AgriScout-V2",
            "model": "eBee X",
            "manufacturer": "senseFly",
            "serial_number": "SFY-EBX-3319",
            "battery_percentage": 100.0,
            "status": "available",
            "location": "Napa Valley Base",
            "latitude": 38.2975,
            "longitude": -122.2869,
            "total_flight_hours": 112.8,
            "max_flight_time": 90.0,
            "max_payload": 3.0,
            "created_by": admin_id,
            "created_at": now - timedelta(days=75),
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "drone_name": "HeavyLift-H8",
            "model": "Alta X",
            "manufacturer": "Freefly Systems",
            "serial_number": "FFY-ALTX-7720",
            "battery_percentage": 42.0,
            "status": "maintenance",
            "location": "San Jose Tech Hangar 2",
            "latitude": 37.3382,
            "longitude": -121.8863,
            "total_flight_hours": 215.3,
            "max_flight_time": 50.0,
            "max_payload": 15.9,
            "created_by": admin_id,
            "created_at": now - timedelta(days=150),
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "drone_name": "ThermalHawk-IR",
            "model": "EVO II Dual 640T",
            "manufacturer": "Autel Robotics",
            "serial_number": "AUT-EVO2-9014",
            "battery_percentage": 98.0,
            "status": "available",
            "location": "Fremont Charging Dock 1",
            "latitude": 37.5485,
            "longitude": -121.9886,
            "total_flight_hours": 45.1,
            "max_flight_time": 38.0,
            "max_payload": 0.9,
            "created_by": admin_id,
            "created_at": now - timedelta(days=40),
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "drone_name": "StealthEye-S1",
            "model": "Teledyne FLIR Siras",
            "manufacturer": "Teledyne FLIR",
            "serial_number": "FLR-SRS-4412",
            "battery_percentage": 0.0,
            "status": "offline",
            "location": "Redwood City Staging Yard",
            "latitude": 37.4852,
            "longitude": -122.2364,
            "total_flight_hours": 18.0,
            "max_flight_time": 31.0,
            "max_payload": 0.5,
            "created_by": admin_id,
            "created_at": now - timedelta(days=20),
            "updated_at": now,
        },
    ]

    for d in drones_data:
        await db.drones.insert_one(d)

    print("[MongoDB Seed] Seeding demo missions...")
    missions_data = [
        {
            "id": str(uuid.uuid4()),
            "mission_name": "San Francisco Harbor Perimeter Patrol",
            "mission_type": "Surveillance",
            "status": "in_progress",
            "start_location": "Pier 39 Launchpad",
            "destination": "Presidio Coastal Waypoint",
            "start_lat": 37.8087,
            "start_lng": -122.4098,
            "dest_lat": 37.7989,
            "dest_lng": -122.4662,
            "scheduled_at": now - timedelta(hours=1),
            "started_at": now - timedelta(minutes=45),
            "completed_at": None,
            "drone_id": drones_data[0]["id"],
            "operator_id": operator_id,
            "created_by": admin_id,
            "created_at": now - timedelta(hours=2),
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "mission_name": "Port of Oakland Container Thermal Scan",
            "mission_type": "Inspection",
            "status": "in_progress",
            "start_location": "Oakland Terminal 4",
            "destination": "Bay Bridge Anchorage",
            "start_lat": 37.8044,
            "start_lng": -122.2712,
            "dest_lat": 37.8188,
            "dest_lng": -122.3488,
            "scheduled_at": now - timedelta(minutes=50),
            "started_at": now - timedelta(minutes=30),
            "completed_at": None,
            "drone_id": drones_data[1]["id"],
            "operator_id": operator_id,
            "created_by": admin_id,
            "created_at": now - timedelta(hours=1),
            "updated_at": now,
        },
        {
            "id": str(uuid.uuid4()),
            "mission_name": "Napa Vineyard Multispectral Survey",
            "mission_type": "Survey",
            "status": "completed",
            "start_location": "Rutherford Estate",
            "destination": "Oakville Crossroad",
            "start_lat": 38.4589,
            "start_lng": -122.4228,
            "dest_lat": 38.4312,
            "dest_lng": -122.4011,
            "scheduled_at": now - timedelta(days=1, hours=4),
            "started_at": now - timedelta(days=1, hours=3),
            "completed_at": now - timedelta(days=1, hours=1),
            "drone_id": drones_data[3]["id"],
            "operator_id": operator_id,
            "created_by": admin_id,
            "created_at": now - timedelta(days=2),
            "updated_at": now,
        },
    ]

    for m in missions_data:
        await db.missions.insert_one(m)

    print("[MongoDB Seed] Seeding demo alerts & maintenance...")
    alerts_data = [
        {
            "id": str(uuid.uuid4()),
            "alert_type": "propulsion_warning",
            "severity": "warning",
            "message": "HeavyLift-H8 scheduled rotor inspection overdue by 48 hours.",
            "drone_id": drones_data[4]["id"],
            "is_read": False,
            "created_at": now - timedelta(hours=3),
        },
        {
            "id": str(uuid.uuid4()),
            "alert_type": "telemetry_lost",
            "severity": "critical",
            "message": "StealthEye-S1 offline in Redwood City. Signal timeout exceeded.",
            "drone_id": drones_data[6]["id"],
            "is_read": False,
            "created_at": now - timedelta(hours=1),
        },
    ]
    for a in alerts_data:
        await db.alerts.insert_one(a)

    await db.maintenance.insert_one({
        "id": str(uuid.uuid4()),
        "drone_id": drones_data[4]["id"],
        "category": "propulsion",
        "description": "Routine 200-hour rotor bearing calibration and firmware update",
        "status": "scheduled",
        "scheduled_date": now + timedelta(days=2),
        "completed_date": None,
        "notes": "Parts received in hangar 2",
        "created_at": now - timedelta(days=1),
        "updated_at": now,
    })

    print("[MongoDB Seed] Seeding initial telemetry records...")
    for d in drones_data:
        is_flying = d.get("status") in ["in_flight", "active"]
        await db.telemetry.insert_one({
            "id": str(uuid.uuid4()),
            "drone_id": d["id"],
            "latitude": d["latitude"],
            "longitude": d["longitude"],
            "altitude": 124.5 if is_flying else 0.0,
            "speed": 14.2 if is_flying else 0.0,
            "battery_level": d["battery_percentage"],
            "temperature": 28.5 if is_flying else 22.0,
            "gps_signal": 98.0,
            "connection_status": "connected" if d.get("status") != "offline" else "disconnected",
            "timestamp": now,
        })

    print("[MongoDB Seed] Successfully populated initial fleet database!")


if __name__ == "__main__":
    asyncio.run(seed())
