"""
Archivo: be/app/models/notifications.py
Descripción: Modelo ORM para la tabla `notifications` (notificaciones del sistema).
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, Enum as SQLEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.order import Order


class NotificationType(str, Enum):
    """Tipos de notificación"""
    info = "info"
    advertencia = "advertencia"
    error = "error"
    exito = "exito"


class Notification(Base):
    """Modelo ORM para la tabla `notifications` (notificaciones del sistema)."""

    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )

    title_notification: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    message_notification: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    type_notification: Mapped[str] = mapped_column(
        SQLEnum(NotificationType, name="notification_type", create_type=False),
        nullable=False,
        default=NotificationType.info,
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    # ────────────────────────────
    #  Referencias y auditoría
    # ────────────────────────────

    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    link_url: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
    )

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    deleted_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    # ────────────────────────────
    #  Timestamps
    # ────────────────────────────

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ────────────────────────────
    # 🔗 Relaciones
    # ────────────────────────────

    user = relationship("User", foreign_keys=[user_id], lazy="selectin")
    order = relationship("Order", foreign_keys=[order_id], lazy="selectin")

    def __repr__(self) -> str:
        return f"Notification(id={self.id}, user_id={self.user_id}, is_read={self.is_read})"

