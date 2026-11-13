"""Database seeder with realistic drone fleet management initial data."""

import asyncio
from datetime import datetime, timezone, timedelta
import uuid

from sqlalchemy import select
from app.core.security import get_password_hash
from app.database.session import async_session_factory, init_db
from app.models.user import User
from app.models.drone import Drone
from app.models.mission import Mission
from app.models.maintenance import MaintenanceRecord
from app.models.alert import Alert, Notification, ActivityLog


async def seed():
    """Seed the database with enterprise-ready drone fleet data."""
    await init_db()

    async with async_session_factory() as db:
        # Check if already seeded
        result = await db.execute(select(User).where(User.email == "admin@dronefleet.ai"))
        if result.scalar_one_or_none():
            print("[Database Seed] Already seeded. Skipping.")
            return

        print("[Database Seed] Seeding demo users...")
        users_data = [
            {
                "full_name": "Chief Administrator",
                "email": "admin@dronefleet.ai",
                "phone": "+1-555-0199",
                "password": "AdminPassword123!",
                "role": "admin",
            },
            {
                "full_name": "Sarah Connor (Fleet Manager)",
                "email": "manager@dronefleet.ai",
                "phone": "+1-555-0142",
                "password": "ManagerPassword123!",
                "role": "fleet_manager",
            },
            {
                "full_name": "Marcus Vance (Drone Pilot)",
                "email": "operator@dronefleet.ai",
                "phone": "+1-555-0177",
                "password": "OperatorPassword123!",
                "role": "operator",
            },
            {
                "full_name": "Elena Rostova (Flight Analyst)",
                "email": "viewer@dronefleet.ai",
                "phone": "+1-555-0123",
                "password": "ViewerPassword123!",
                "role": "viewer",
            },
        ]

        user_objects = {}
        for u in users_data:
            user = User(
                id=uuid.uuid4(),
                full_name=u["full_name"],
                email=u["email"],
                phone=u["phone"],
                hashed_password=get_password_hash(u["password"]),
                role=u["role"],
                is_active=True,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(user)
            user_objects[u["role"]] = user

        await db.flush()
        admin_id = user_objects["admin"].id
        operator_id = user_objects["operator"].id

        print("[Database Seed] Seeding drones...")
        drones_data = [
            {
                "drone_name": "SkyGuardian Alpha-1",
                "model": "Matrice 300 RTK",
                "manufacturer": "DJI",
                "serial_number": "DJI-M300-88410",
                "battery_percentage": 94.0,
                "status": "in_flight",
                "location": "Sector 4 Industrial Park",
                "latitude": 37.7749,
                "longitude": -122.4194,
                "total_flight_hours": 142.5,
                "max_flight_time": 55.0,
                "max_payload": 2.7,
            },
            {
                "drone_name": "AeroScan Mapper-X",
                "model": "WingtraOne GEN II",
                "manufacturer": "Wingtra",
                "serial_number": "WT-GEN2-40192",
                "battery_percentage": 88.0,
                "status": "in_flight",
                "location": "Central Valley Farmlands",
                "latitude": 37.7833,
                "longitude": -122.4167,
                "total_flight_hours": 98.2,
                "max_flight_time": 59.0,
                "max_payload": 0.8,
            },
            {
                "drone_name": "Falcon Scout-4",
                "model": "EVO II Dual 640T",
                "manufacturer": "Autel Robotics",
                "serial_number": "AUT-EVO2-11029",
                "battery_percentage": 100.0,
                "status": "available",
                "location": "North Hangar Bay 1",
                "latitude": 37.7690,
                "longitude": -122.4467,
                "total_flight_hours": 64.0,
                "max_flight_time": 40.0,
                "max_payload": 1.2,
            },
            {
                "drone_name": "CyberHawk Pro-2",
                "model": "Skydio X2E",
                "manufacturer": "Skydio",
                "serial_number": "SKY-X2E-99321",
                "battery_percentage": 78.0,
                "status": "available",
                "location": "Main Dispatch Hub",
                "latitude": 37.7550,
                "longitude": -122.4200,
                "total_flight_hours": 115.8,
                "max_flight_time": 35.0,
                "max_payload": 1.0,
            },
            {
                "drone_name": "HeavyLift Cargo-01",
                "model": "Astro Industrial",
                "manufacturer": "Freefly Systems",
                "serial_number": "FF-ASTRO-55201",
                "battery_percentage": 45.0,
                "status": "charging",
                "location": "Docking Bay 3",
                "latitude": 37.7600,
                "longitude": -122.4100,
                "total_flight_hours": 210.4,
                "max_flight_time": 38.0,
                "max_payload": 5.5,
            },
            {
                "drone_name": "Vanguard Patrol-7",
                "model": "Anafi USA GOV",
                "manufacturer": "Parrot",
                "serial_number": "PAR-ANA-77291",
                "battery_percentage": 18.0,
                "status": "available",
                "location": "South Perimeter Depot",
                "latitude": 37.7400,
                "longitude": -122.4300,
                "total_flight_hours": 87.5,
                "max_flight_time": 32.0,
                "max_payload": 0.5,
            },
            {
                "drone_name": "TerraSurveyor Delta",
                "model": "eBee X",
                "manufacturer": "senseFly",
                "serial_number": "SF-EBEE-33411",
                "battery_percentage": 100.0,
                "status": "maintenance",
                "location": "Tech Lab Diagnostics",
                "latitude": 37.7650,
                "longitude": -122.4050,
                "total_flight_hours": 178.9,
                "max_flight_time": 90.0,
                "max_payload": 3.0,
            },
            {
                "drone_name": "Ghost Recon-9",
                "model": "Golden Eagle",
                "manufacturer": "Teal Drones",
                "serial_number": "TL-GE-66299",
                "battery_percentage": 0.0,
                "status": "offline",
                "location": "Maintenance Depot B",
                "latitude": 37.7350,
                "longitude": -122.4500,
                "total_flight_hours": 52.3,
                "max_flight_time": 30.0,
                "max_payload": 0.9,
            },
        ]

        drone_objects = []
        for d in drones_data:
            drone = Drone(
                id=uuid.uuid4(),
                drone_name=d["drone_name"],
                model=d["model"],
                manufacturer=d["manufacturer"],
                serial_number=d["serial_number"],
                battery_percentage=d["battery_percentage"],
                status=d["status"],
                location=d["location"],
                latitude=d["latitude"],
                longitude=d["longitude"],
                total_flight_hours=d["total_flight_hours"],
                max_flight_time=d["max_flight_time"],
                max_payload=d["max_payload"],
                created_by=admin_id,
                created_at=datetime.now(timezone.utc) - timedelta(days=60),
                updated_at=datetime.now(timezone.utc),
            )
            db.add(drone)
            drone_objects.append(drone)

        await db.flush()

        print("[Database Seed] Seeding missions...")
        now = datetime.now(timezone.utc)
        missions_data = [
            {
                "mission_name": "Solar Array Thermal Inspection",
                "mission_type": "inspection",
                "status": "in_progress",
                "start_location": "Solar Field Gate 1",
                "destination": "Substation 3B",
                "start_lat": 37.7749,
                "start_lng": -122.4194,
                "dest_lat": 37.7810,
                "dest_lng": -122.4110,
                "scheduled_at": now - timedelta(minutes=45),
                "started_at": now - timedelta(minutes=30),
                "drone_id": drone_objects[0].id,
                "notes": "IR sensor active. Scanning panels 401 through 600.",
            },
            {
                "mission_name": "Precision Vineyard Moisture Mapping",
                "mission_type": "agriculture",
                "status": "in_progress",
                "start_location": "Ridge Vineyard Base",
                "destination": "South Acre Block",
                "start_lat": 37.7833,
                "start_lng": -122.4167,
                "dest_lat": 37.7920,
                "dest_lng": -122.4080,
                "scheduled_at": now - timedelta(minutes=60),
                "started_at": now - timedelta(minutes=40),
                "drone_id": drone_objects[1].id,
                "notes": "Multispectral imaging for NDVI moisture indices.",
            },
            {
                "mission_name": "Port Facility Security Sweep",
                "mission_type": "surveillance",
                "status": "completed",
                "start_location": "Pier 14 Gate",
                "destination": "Container Yard C",
                "start_lat": 37.7690,
                "start_lng": -122.4467,
                "dest_lat": 37.7600,
                "dest_lng": -122.4300,
                "scheduled_at": now - timedelta(hours=5),
                "started_at": now - timedelta(hours=4, minutes=45),
                "completed_at": now - timedelta(hours=3, minutes=30),
                "drone_id": drone_objects[2].id,
                "notes": "Zero security anomalies detected along perimeter fence.",
            },
            {
                "mission_name": "Emergency Medical Supply Dispatch",
                "mission_type": "delivery",
                "status": "completed",
                "start_location": "Regional Hospital Helipad",
                "destination": "Remote Clinic Station 8",
                "start_lat": 37.7550,
                "start_lng": -122.4200,
                "dest_lat": 37.7400,
                "dest_lng": -122.3900,
                "scheduled_at": now - timedelta(hours=8),
                "started_at": now - timedelta(hours=7, minutes=50),
                "completed_at": now - timedelta(hours=7, minutes=15),
                "drone_id": drone_objects[4].id,
                "notes": "Urgent anti-venom vial payload delivered intact.",
            },
            {
                "mission_name": "Wilderness Search & Rescue Grid B",
                "mission_type": "search_rescue",
                "status": "scheduled",
                "start_location": "Ranger Outpost 4",
                "destination": "Canyon Ravine Sector",
                "start_lat": 37.7500,
                "start_lng": -122.4300,
                "dest_lat": 37.7300,
                "dest_lng": -122.4100,
                "scheduled_at": now + timedelta(hours=2),
                "drone_id": drone_objects[3].id,
                "notes": "Thermal FLIR scan for missing hiking party.",
            },
        ]

        for m in missions_data:
            mission = Mission(
                id=uuid.uuid4(),
                mission_name=m["mission_name"],
                mission_type=m["mission_type"],
                status=m["status"],
                start_location=m["start_location"],
                destination=m["destination"],
                start_lat=m["start_lat"],
                start_lng=m["start_lng"],
                dest_lat=m["dest_lat"],
                dest_lng=m["dest_lng"],
                scheduled_at=m.get("scheduled_at"),
                started_at=m.get("started_at"),
                completed_at=m.get("completed_at"),
                notes=m.get("notes"),
                drone_id=m["drone_id"],
                operator_id=operator_id,
                created_by=admin_id,
                created_at=now - timedelta(days=2),
                updated_at=now,
            )
            db.add(mission)

        print("[Database Seed] Seeding maintenance records...")
        maint_data = [
            {
                "drone_id": drone_objects[6].id,
                "category": "motor_inspection",
                "description": "50-hour brushless motor bearing check and vibration test.",
                "status": "in_progress",
                "scheduled_date": now - timedelta(days=1),
                "cost": 320.0,
            },
            {
                "drone_id": drone_objects[5].id,
                "category": "battery_replacement",
                "description": "LiPo smart battery cell imbalance replacement.",
                "status": "scheduled",
                "scheduled_date": now + timedelta(days=3),
                "cost": 185.0,
            },
            {
                "drone_id": drone_objects[0].id,
                "category": "propeller_replacement",
                "description": "Composite carbon fiber prop blade routine refresh.",
                "status": "completed",
                "scheduled_date": now - timedelta(days=14),
                "completed_date": now - timedelta(days=13),
                "cost": 140.0,
            },
        ]

        for mr in maint_data:
            record = MaintenanceRecord(
                id=uuid.uuid4(),
                drone_id=mr["drone_id"],
                category=mr["category"],
                description=mr["description"],
                status=mr["status"],
                scheduled_date=mr["scheduled_date"],
                completed_date=mr.get("completed_date"),
                performed_by=admin_id,
                cost=mr["cost"],
                created_at=now - timedelta(days=15),
                updated_at=now,
            )
            db.add(record)

        print("[Database Seed] Seeding alerts...")
        alerts_data = [
            {
                "alert_type": "low_battery",
                "severity": "critical",
                "message": "Drone Vanguard Patrol-7 critical battery level at 18%. Immediate RTL recommended.",
                "drone_id": drone_objects[5].id,
            },
            {
                "alert_type": "drone_offline",
                "severity": "warning",
                "message": "Ghost Recon-9 heartbeat signal lost. Status set to Offline.",
                "drone_id": drone_objects[7].id,
            },
            {
                "alert_type": "maintenance_required",
                "severity": "info",
                "message": "TerraSurveyor Delta reached scheduled 150-hour motor inspection cycle.",
                "drone_id": drone_objects[6].id,
            },
        ]

        for a in alerts_data:
            alert = Alert(
                id=uuid.uuid4(),
                alert_type=a["alert_type"],
                severity=a["severity"],
                message=a["message"],
                drone_id=a["drone_id"],
                is_read=False,
                created_at=now - timedelta(minutes=25),
            )
            db.add(alert)

        # Seed initial notification for admin
        db.add(
            Notification(
                id=uuid.uuid4(),
                user_id=admin_id,
                title="Fleet Command Ready",
                message="All autonomous telemetry simulation and services initialized.",
                notification_type="system",
                is_read=False,
                created_at=now,
            )
        )

        await db.commit()
        print("[Database Seed] Initial seed completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
