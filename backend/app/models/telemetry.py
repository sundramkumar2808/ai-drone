"""
Telemetry SQLAlchemy model for drone flight data.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Telemetry(Base):
    """Telemetry data point for a drone."""

    __tablename__ = "telemetry"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    drone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("drones.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    altitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    speed: Mapped[float | None] = mapped_column(Float, nullable=True)
    battery_level: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    gps_signal: Mapped[float | None] = mapped_column(Float, nullable=True)
    connection_status: Mapped[str | None] = mapped_column(
        String(20), nullable=True, default="connected"
    )
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    # Relationships
    drone = relationship(
        "Drone",
        back_populates="telemetry_records",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Telemetry(id={self.id}, drone_id={self.drone_id}, ts={self.timestamp})>"
