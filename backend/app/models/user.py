"""
User SQLAlchemy model.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class User(Base):
    """User account model."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, default="viewer", server_default="viewer"
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        onupdate=func.now(),
    )

    # Relationships
    drones = relationship(
        "Drone",
        back_populates="creator",
        foreign_keys="[Drone.created_by]",
        lazy="selectin",
    )
    operated_missions = relationship(
        "Mission",
        back_populates="operator",
        foreign_keys="[Mission.operator_id]",
        lazy="selectin",
    )
    created_missions = relationship(
        "Mission",
        back_populates="creator",
        foreign_keys="[Mission.created_by]",
        lazy="selectin",
    )
    notifications = relationship(
        "Notification",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    activity_logs = relationship(
        "ActivityLog",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    oauth_accounts = relationship(
        "OAuthAccount",
        back_populates="user",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    performed_maintenance = relationship(
        "MaintenanceRecord",
        back_populates="performer",
        foreign_keys="[MaintenanceRecord.performed_by]",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
