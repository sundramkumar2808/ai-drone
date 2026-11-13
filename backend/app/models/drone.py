"""
Drone SQLAlchemy model.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Drone(Base):
    """Drone entity model."""

    __tablename__ = "drones"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    drone_name: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    manufacturer: Mapped[str] = mapped_column(String(100), nullable=False)
    serial_number: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    battery_percentage: Mapped[float] = mapped_column(
        Float, nullable=False, default=100.0, server_default="100.0"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="available", server_default="available"
    )
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_flight_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    total_flight_hours: Mapped[float] = mapped_column(
        Float, nullable=False, default=0.0, server_default="0.0"
    )
    max_flight_time: Mapped[float] = mapped_column(
        Float, nullable=False, default=30.0
    )
    max_payload: Mapped[float] = mapped_column(
        Float, nullable=False, default=5.0
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
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
    creator = relationship(
        "User",
        back_populates="drones",
        foreign_keys=[created_by],
        lazy="selectin",
    )
    missions = relationship(
        "Mission",
        back_populates="drone",
        lazy="selectin",
    )
    telemetry_records = relationship(
        "Telemetry",
        back_populates="drone",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    maintenance_records = relationship(
        "MaintenanceRecord",
        back_populates="drone",
        lazy="selectin",
        cascade="all, delete-orphan",
    )
    alerts = relationship(
        "Alert",
        back_populates="drone",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Drone(id={self.id}, name={self.drone_name}, status={self.status})>"
