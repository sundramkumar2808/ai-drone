"""Alert and notification service module using MongoDB."""

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Any

from app.models.alert import Alert, Notification, ActivityLog
from app.models.drone import Drone


async def get_alerts(
    db: Any,
    is_read: Optional[bool] = None,
    severity: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[Alert], int]:
    """List alerts with optional filters."""
    filter_dict: dict = {}
    if is_read is not None:
        filter_dict["is_read"] = is_read
    if severity:
        filter_dict["severity"] = severity

    total = await db.alerts.count_documents(filter_dict)
    cursor = db.alerts.find(filter_dict).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [Alert(d) for d in docs], total


async def mark_alert_read(db: Any, alert_id: Any) -> Optional[Alert]:
    """Mark an alert as read."""
    doc = await db.alerts.find_one({"id": str(alert_id)})
    if not doc:
        return None
    await db.alerts.update_one({"id": str(alert_id)}, {"$set": {"is_read": True}})
    doc["is_read"] = True
    return Alert(doc)


async def create_alert(
    db: Any,
    alert_type: str,
    severity: str,
    message: str,
    drone_id: Any = None,
    mission_id: Any = None,
) -> Alert:
    """Create a new alert."""
    now = datetime.now(timezone.utc)
    alert_doc = {
        "id": str(uuid.uuid4()),
        "alert_type": alert_type,
        "severity": severity,
        "message": message,
        "drone_id": str(drone_id) if drone_id else None,
        "mission_id": str(mission_id) if mission_id else None,
        "is_read": False,
        "created_at": now,
    }
    await db.alerts.insert_one(alert_doc)
    return Alert(alert_doc)


async def get_notifications(
    db: Any,
    user_id: Any,
    is_read: Optional[bool] = None,
) -> List[Notification]:
    """Get notifications for a user."""
    filter_dict: dict = {"user_id": str(user_id)}
    if is_read is not None:
        filter_dict["is_read"] = is_read

    cursor = db.notifications.find(filter_dict).sort("created_at", -1).limit(100)
    docs = await cursor.to_list(length=100)
    return [Notification(d) for d in docs]


async def mark_notification_read(
    db: Any, notification_id: Any
) -> Optional[Notification]:
    """Mark a notification as read."""
    doc = await db.notifications.find_one({"id": str(notification_id)})
    if not doc:
        return None
    await db.notifications.update_one({"id": str(notification_id)}, {"$set": {"is_read": True}})
    doc["is_read"] = True
    return Notification(doc)


async def create_notification(
    db: Any,
    user_id: Any,
    title: str,
    message: str,
    notification_type: str = "info",
) -> Notification:
    """Create a notification for a user."""
    now = datetime.now(timezone.utc)
    notification_doc = {
        "id": str(uuid.uuid4()),
        "user_id": str(user_id),
        "title": title,
        "message": message,
        "notification_type": notification_type,
        "is_read": False,
        "created_at": now,
    }
    await db.notifications.insert_one(notification_doc)
    return Notification(notification_doc)


async def log_activity(
    db: Any,
    user_id: Any,
    action: str,
    resource_type: str,
    resource_id: Any = None,
    details: Optional[str] = None,
) -> ActivityLog:
    """Log an activity for auditing."""
    now = datetime.now(timezone.utc)
    log_doc = {
        "id": str(uuid.uuid4()),
        "user_id": str(user_id) if user_id else None,
        "action": action,
        "resource_type": resource_type,
        "resource_id": str(resource_id) if resource_id else None,
        "details": details,
        "created_at": now,
    }
    await db.activity_logs.insert_one(log_doc)
    return ActivityLog(log_doc)
