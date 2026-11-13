"""Alerts and notifications API endpoints."""

from typing import Any, List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.alert import AlertResponse, NotificationResponse
from app.services import alert_service

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get("", response_model=dict)
async def list_alerts(
    is_read: Optional[bool] = Query(None),
    severity: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """List system alerts with filtering."""
    alerts, total = await alert_service.get_alerts(
        db, is_read=is_read, severity=severity, skip=skip, limit=limit
    )
    return {
        "alerts": [AlertResponse.model_validate(a) for a in alerts],
        "total": total,
    }


@router.put("/{alert_id}/read", response_model=AlertResponse)
async def mark_alert_as_read(
    alert_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Mark a specific alert as read."""
    alert = await alert_service.mark_alert_read(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )
    return alert


@router.get("/notifications", response_model=List[NotificationResponse])
async def list_notifications(
    is_read: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Get notifications for the current authenticated user."""
    return await alert_service.get_notifications(
        db, user_id=current_user.id, is_read=is_read
    )


@router.put("/notifications/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Mark a notification as read."""
    notification = await alert_service.mark_notification_read(db, notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return notification
