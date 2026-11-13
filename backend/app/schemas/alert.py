"""
Pydantic v2 schemas for Alert and Notification responses.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AlertResponse(BaseModel):
    """Schema for alert response data."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    alert_type: str
    severity: str
    message: str
    drone_id: Optional[uuid.UUID] = None
    mission_id: Optional[uuid.UUID] = None
    is_read: bool
    created_at: datetime


class NotificationResponse(BaseModel):
    """Schema for notification response data."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime
