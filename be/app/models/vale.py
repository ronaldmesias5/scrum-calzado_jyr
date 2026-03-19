"""
Archivo: be/app/models/vale.py
Descripción: Modelo ORM para las tablas `vale` y `detail_vale` (comprobantes de entrega).
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.orders import Order


class Vale(Base):
    """Modelo ORM para la tabla `vale` (comprobante de entrega)."""

    __tablename__ = "vale"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )

    size: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    colour: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    amount: Mapped[float | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )

    creation_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ────────────────────────────
    # 🕐 Auditoría
    # ────────────────────────────

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

    # ────────────────────────────
    # 📅 Timestamps
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

    order = relationship("Order", lazy="selectin")
    details = relationship("DetailVale", back_populates="vale", lazy="selectin", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"Vale(id={self.id}, order_id={self.order_id})"


class DetailVale(Base):
    """Modelo ORM para la tabla `detail_vale` (detalles de vale)."""

    __tablename__ = "detail_vale"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    vale_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vale.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=False,
    )

    size: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    colour: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    amount: Mapped[float | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,
    )

    creation_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
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

    vale = relationship("Vale", back_populates="details", lazy="selectin")

    def __repr__(self) -> str:
        return f"DetailVale(id={self.id}, vale_id={self.vale_id})"

