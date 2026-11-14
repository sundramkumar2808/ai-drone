"""Alert, Notification, and ActivityLog document models for MongoDB."""
from app.models.base import MongoModel


class Alert(MongoModel):
    """Alert MongoDB entity."""
    pass


class Notification(MongoModel):
    """Notification MongoDB entity."""
    pass


class ActivityLog(MongoModel):
    """Activity and audit log entity."""
    pass


class OAuthAccount(MongoModel):
    """OAuth account entity."""
    pass
