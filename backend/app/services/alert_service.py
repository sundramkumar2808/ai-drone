"""Alert and notification service module."""

import uuid
from datetime import datetime, timezone
from typing import Optional, List

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert, Notification, ActivityLog
from app.models.drone import Drone


async def get_alerts(
    db: AsyncSession,
    is_read: Optional[bool] = None,
    severity: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[List[Alert], int]:
    """List alerts with optional filters."""
    query = select(Alert)
    count_query = select(func.count(Alert.id))

    if is_read is not None:
        query = query.where(Alert.is_read == is_read)
        count_query = count_query.where(Alert.is_read == is_read)

    if severity:
        query = query.where(Alert.severity == severity)
        count_query = count_query.where(Alert.severity == severity)

    total_result = await db.execute(count_query)
    total = total_result.scalar()

    query = query.offset(skip).limit(limit).order_by(Alert.created_at.desc())
    result = await db.execute(query)
    alerts = result.scalars().all()

    return list(alerts), total


async def mark_alert_read(db: AsyncSession, alert_id: uuid.UUID) -> Optional[Alert]:
    """Mark an alert as read."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        return None

    alert.is_read = True
    await db.commit()
    await db.refresh(alert)
    return alert


async def create_alert(
    db: AsyncSession,
    alert_type: str,
    severity: str,
    message: str,
    drone_id: Optional[uuid.UUID] = None,
    mission_id: Optional[uuid.UUID] = None,
) -> Alert:
    """Create a new alert."""
    alert = Alert(
        id=uuid.uuid4(),
        alert_type=alert_type,
        severity=severity,
        message=message,
        drone_id=drone_id,
        mission_id=mission_id,
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


async def get_notifications(
    db: AsyncSession,
    user_id: uuid.UUID,
    is_read: Optional[bool] = None,
) -> List[Notification]:
    """Get notifications for a user."""
    query = select(Notification).where(Notification.user_id == user_id)

    if is_read is not None:
        query = query.where(Notification.is_read == is_read)

    query = query.order_by(Notification.created_at.desc()).limit(100)
    result = await db.execute(query)
    return list(result.scalars().all())


async def mark_notification_read(
    db: AsyncSession, notification_id: uuid.UUID
) -> Optional[Notification]:
    """Mark a notification as read."""
    result = await db.execute(
        select(Notification).where(Notification.id == notification_id)
    )
    notification = result.scalar_one_or_none()
    if not notification:
        return None

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    message: str,
    notification_type: str = "info",
) -> Notification:
    """Create a notification for a user."""
    notification = Notification(
        id=uuid.uuid4(),
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification


async def check_drone_alerts(db: AsyncSession) -> List[Alert]:
    """Check all drones for alert conditions and create alerts."""
    result = await db.execute(select(Drone))
    drones = result.scalars().all()
    created_alerts: List[Alert] = []

    for drone in drones:
        # Low battery alert
        if drone.battery_level is not None and drone.battery_level < 20:
            severity = "critical" if drone.battery_level < 10 else "warning"
            # Check if a similar unread alert already exists
            existing = await db.execute(
                select(Alert).where(
                    Alert.drone_id == drone.id,
                    Alert.alert_type == "low_battery",
                    Alert.is_read == False,
                )
            )
            if not existing.scalar_one_or_none():
                alert = await create_alert(
                    db,
                    alert_type="low_battery",
                    severity=severity,
                    message=f"Drone '{drone.name}' battery is critically low at {drone.battery_level:.1f}%",
                    drone_id=drone.id,
                )
                created_alerts.append(alert)

        # Offline drone alert
        if drone.status == "offline":
            existing = await db.execute(
                select(Alert).where(
                    Alert.drone_id == drone.id,
                    Alert.alert_type == "drone_offline",
                    Alert.is_read == False,
                )
            )
            if not existing.scalar_one_or_none():
                alert = await create_alert(
                    db,
                    alert_type="drone_offline",
                    severity="warning",
                    message=f"Drone '{drone.name}' is offline and not responding",
                    drone_id=drone.id,
                )
                created_alerts.append(alert)

        # Maintenance overdue
        if drone.next_maintenance and drone.next_maintenance < datetime.now(timezone.utc):
            existing = await db.execute(
                select(Alert).where(
                    Alert.drone_id == drone.id,
                    Alert.alert_type == "maintenance_overdue",
                    Alert.is_read == False,
                )
            )
            if not existing.scalar_one_or_none():
                alert = await create_alert(
                    db,
                    alert_type="maintenance_overdue",
                    severity="warning",
                    message=f"Drone '{drone.name}' has overdue maintenance",
                    drone_id=drone.id,
                )
                created_alerts.append(alert)

    return created_alerts


async def log_activity(
    db: AsyncSession,
    user_id: Optional[uuid.UUID],
    action: str,
    resource_type: str,
    resource_id: Optional[uuid.UUID] = None,
    details: Optional[str] = None,
) -> ActivityLog:
    """Log an activity for auditing."""
    log_entry = ActivityLog(
        id=uuid.uuid4(),
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        created_at=datetime.now(timezone.utc),
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)
    return log_entry
