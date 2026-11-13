"""
Import all models so they are registered with SQLAlchemy metadata.
"""

from app.models.user import User
from app.models.drone import Drone
from app.models.mission import Mission
from app.models.telemetry import Telemetry
from app.models.maintenance import MaintenanceRecord
from app.models.alert import Alert, Notification, ActivityLog, OAuthAccount

__all__ = [
    "User",
    "Drone",
    "Mission",
    "Telemetry",
    "MaintenanceRecord",
    "Alert",
    "Notification",
    "ActivityLog",
    "OAuthAccount",
]
