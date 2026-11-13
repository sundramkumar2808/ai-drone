"""
Mission SQLAlchemy model.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base


class Mission(Base):
    """Mission entity model."""

    __tablename__ = "missions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    mission_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mission_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="surveillance"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", server_default="pending"
    )
    start_location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    destination: Mapped[str | None] = mapped_column(String(255), nullable=True)
    start_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    start_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    dest_lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    dest_lng: Mapped[float | None] = mapped_column(Float, nullable=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    drone_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("drones.id", ondelete="SET NULL"),
        nullable=True,
    )
    operator_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
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
    drone = relationship(
        "Drone",
        back_populates="missions",
        foreign_keys=[drone_id],
        lazy="selectin",
    )
    operator = relationship(
        "User",
        back_populates="operated_missions",
        foreign_keys=[operator_id],
        lazy="selectin",
    )
    creator = relationship(
        "User",
        back_populates="created_missions",
        foreign_keys=[created_by],
        lazy="selectin",
    )
    alerts = relationship(
        "Alert",
        back_populates="mission",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Mission(id={self.id}, name={self.mission_name}, status={self.status})>"
