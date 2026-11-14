"""AI assistant service module using Google Gemini and MongoDB context."""

import uuid
from datetime import datetime, timezone
from typing import Optional, Any

from app.core.config import get_settings

settings = get_settings()


async def _build_context(db: Any) -> str:
    """Query MongoDB and build a context string for the AI prompt."""
    total_drones = await db.drones.count_documents({})
    active_drones = await db.drones.count_documents({"status": {"$in": ["in_flight", "active"]}})
    available_drones = await db.drones.count_documents({"status": "available"})
    maintenance_drones = await db.drones.count_documents({"status": "maintenance"})
    offline_drones = await db.drones.count_documents({"status": "offline"})

    cursor = db.drones.find({}, {"drone_name": 1, "model": 1, "status": 1, "battery_percentage": 1, "total_flight_hours": 1})
    drones = await cursor.to_list(length=20)

    drone_list = [
        f"  - {d.get('drone_name')} ({d.get('model')}): status={d.get('status')}, battery={d.get('battery_percentage', 100):.1f}%, hours={d.get('total_flight_hours', 0)}"
        for d in drones
    ]

    total_missions = await db.missions.count_documents({})
    active_missions = await db.missions.count_documents({"status": "in_progress"})
    completed_missions = await db.missions.count_documents({"status": "completed"})
    planned_missions = await db.missions.count_documents({"status": {"$in": ["scheduled", "pending"]}})

    pending_maintenance = await db.maintenance.count_documents({"status": {"$in": ["scheduled", "in_progress"]}})
    unread_alerts = await db.alerts.count_documents({"is_read": False})

    alert_cursor = db.alerts.find({"is_read": False}).sort("created_at", -1).limit(5)
    alerts = await alert_cursor.to_list(length=5)
    recent_alerts = [f"[{a.get('severity', 'info').upper()}] {a.get('message')}" for a in alerts]

    context = f"""
=== DRONE FLEET PLATFORM DATA (real-time) ===

FLEET SUMMARY:
- Total Drones: {total_drones}
- Active/In-Flight: {active_drones}
- Available: {available_drones}
- In Maintenance: {maintenance_drones}
- Offline: {offline_drones}

DRONE LIST:
{chr(10).join(drone_list) if drone_list else "  No drones registered."}

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
    db: Any, user_message: str, user_id: Optional[Any] = None
) -> str:
    """Process a chat message with the AI assistant."""
    api_key = settings.GEMINI_API_KEY if hasattr(settings, "GEMINI_API_KEY") else None

    if not api_key or api_key in ("", "your-gemini-api-key-here", "not-set"):
        context = await _build_context(db)
        return (
            "🤖 **AI Assistant (Offline Mode)**\n\n"
            "The Gemini API key is not configured. To enable AI-powered responses, "
            "set the `GEMINI_API_KEY` environment variable.\n\n"
            "Here's the current fleet data:\n\n"
            f"```\n{context}\n```\n\n"
            "Configure the API key to get intelligent analysis and recommendations!"
        )

    context = await _build_context(db)
    system_instruction = (
        "You are an AI assistant for the DroneFleet AI drone fleet management platform. "
        "You help operators manage their drone fleet, analyze telemetry data, plan missions, "
        "and monitor fleet health. You have access to real-time platform data provided below. "
        "Be concise, helpful, and proactive in suggesting actions. Use the data to give specific, "
        "data-driven answers. Format responses with markdown for readability."
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
    except Exception as e:
        return f"AI assistant error: {str(e)}."
