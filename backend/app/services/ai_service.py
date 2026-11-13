"""AI assistant service module using Google Gemini."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.drone import Drone
from app.models.mission import Mission
from app.models.maintenance import MaintenanceRecord
from app.models.alert import Alert


settings = get_settings()


async def _build_context(db: AsyncSession) -> str:
    """Query the database and build a context string for the AI prompt."""
    # Drone statistics
    total_drones_r = await db.execute(select(func.count(Drone.id)))
    total_drones = total_drones_r.scalar() or 0

    active_r = await db.execute(
        select(func.count(Drone.id)).where(Drone.status.in_(["in_flight", "active"]))
    )
    active_drones = active_r.scalar() or 0

    available_r = await db.execute(
        select(func.count(Drone.id)).where(Drone.status == "available")
    )
    available_drones = available_r.scalar() or 0

    maintenance_r = await db.execute(
        select(func.count(Drone.id)).where(Drone.status == "maintenance")
    )
    maintenance_drones = maintenance_r.scalar() or 0

    offline_r = await db.execute(
        select(func.count(Drone.id)).where(Drone.status == "offline")
    )
    offline_drones = offline_r.scalar() or 0

    # Average battery
    avg_battery_r = await db.execute(select(func.avg(Drone.battery_percentage)))
    avg_battery = round(float(avg_battery_r.scalar() or 0), 1)

    # Low battery drones
    low_battery_r = await db.execute(
        select(Drone.drone_name, Drone.battery_percentage)
        .where(Drone.battery_percentage < 30)
        .order_by(Drone.battery_percentage.asc())
        .limit(10)
    )
    low_battery_drones = [
        f"{row.drone_name}: {row.battery_percentage:.1f}%" for row in low_battery_r
    ]

    # Mission statistics
    total_missions_r = await db.execute(select(func.count(Mission.id)))
    total_missions = total_missions_r.scalar() or 0

    active_missions_r = await db.execute(
        select(func.count(Mission.id)).where(Mission.status == "in_progress")
    )
    active_missions = active_missions_r.scalar() or 0

    completed_missions_r = await db.execute(
        select(func.count(Mission.id)).where(Mission.status == "completed")
    )
    completed_missions = completed_missions_r.scalar() or 0

    planned_missions_r = await db.execute(
        select(func.count(Mission.id)).where(Mission.status == "planned")
    )
    planned_missions = planned_missions_r.scalar() or 0

    # Flight hours
    flight_hours_r = await db.execute(
        select(func.coalesce(func.sum(Drone.total_flight_hours), 0))
    )
    total_flight_hours = round(float(flight_hours_r.scalar() or 0), 1)

    # Pending maintenance
    pending_maintenance_r = await db.execute(
        select(func.count(MaintenanceRecord.id)).where(
            MaintenanceRecord.status.in_(["scheduled", "in_progress"])
        )
    )
    pending_maintenance = pending_maintenance_r.scalar() or 0

    # Unread alerts
    unread_alerts_r = await db.execute(
        select(func.count(Alert.id)).where(Alert.is_read == False)
    )
    unread_alerts = unread_alerts_r.scalar() or 0

    # Recent alerts
    recent_alerts_r = await db.execute(
        select(Alert.message, Alert.severity, Alert.created_at)
        .where(Alert.is_read == False)
        .order_by(Alert.created_at.desc())
        .limit(5)
    )
    recent_alerts = [
        f"[{row.severity.upper()}] {row.message}" for row in recent_alerts_r
    ]

    # Drone list summary
    all_drones_r = await db.execute(
        select(Drone.drone_name, Drone.model, Drone.status, Drone.battery_percentage, Drone.total_flight_hours)
        .order_by(Drone.drone_name)
        .limit(20)
    )
    drone_list = [
        f"  - {r.drone_name} ({r.model}): status={r.status}, battery={r.battery_percentage:.1f}%, hours={r.total_flight_hours or 0}"
        for r in all_drones_r
    ]

    context = f"""
=== DRONE FLEET PLATFORM DATA (real-time) ===

FLEET SUMMARY:
- Total Drones: {total_drones}
- Active/In-Flight: {active_drones}
- Available: {available_drones}
- In Maintenance: {maintenance_drones}
- Offline: {offline_drones}
- Average Battery Level: {avg_battery}%
- Total Flight Hours: {total_flight_hours}

DRONE LIST:
{chr(10).join(drone_list) if drone_list else "  No drones registered."}

LOW BATTERY DRONES:
{chr(10).join(f"  - {d}" for d in low_battery_drones) if low_battery_drones else "  None – all drones have adequate battery."}

MISSION STATISTICS:
- Total Missions: {total_missions}
- Active Missions: {active_missions}
- Completed Missions: {completed_missions}
- Planned Missions: {planned_missions}

MAINTENANCE:
- Pending Maintenance Records: {pending_maintenance}

ALERTS:
- Unread Alerts: {unread_alerts}
- Recent Alerts:
{chr(10).join(f"  - {a}" for a in recent_alerts) if recent_alerts else "  No recent alerts."}
"""
    return context.strip()


async def chat(
    db: AsyncSession, user_message: str, user_id: Optional[uuid.UUID] = None
) -> str:
    """Process a chat message with the AI assistant."""
    api_key = settings.GEMINI_API_KEY if hasattr(settings, "GEMINI_API_KEY") else None

    if not api_key or api_key in ("", "your-gemini-api-key-here", "not-set"):
        # Provide a helpful fallback without Gemini
        context = await _build_context(db)
        return (
            "🤖 **AI Assistant (Offline Mode)**\n\n"
            "The Gemini API key is not configured. To enable AI-powered responses, "
            "set the `GEMINI_API_KEY` environment variable.\n\n"
            "Here's the current fleet data I can share:\n\n"
            f"```\n{context}\n```\n\n"
            "Configure the API key to get intelligent analysis and recommendations!"
        )

    # Build context from database
    context = await _build_context(db)

    system_instruction = (
        "You are an AI assistant for the DroneFleet AI drone fleet management platform. "
        "You help operators manage their drone fleet, analyze telemetry data, plan missions, "
        "and monitor fleet health. You have access to real-time platform data provided below. "
        "Be concise, helpful, and proactive in suggesting actions. Use the data to give specific, "
        "data-driven answers. Format responses with markdown for readability. "
        "If asked about something not in the data, say so clearly."
    )

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            "gemini-1.5-flash",
            system_instruction=system_instruction,
        )

        full_prompt = f"{context}\n\n---\nUser question: {user_message}"
        response = model.generate_content(full_prompt)
        return response.text

    except ImportError:
        return (
            "The `google-generativeai` package is not installed. "
            "Install it with: `pip install google-generativeai`"
        )
    except Exception as e:
        return f"AI assistant error: {str(e)}. Please check your Gemini API key configuration."
