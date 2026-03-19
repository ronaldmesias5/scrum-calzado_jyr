"""
Archivo: be/app/models/inventory_movement.py
Descripción: Modelo ORM para la tabla `inventory_movement` (movimientos de inventario).
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, Numeric, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.product import Product


class InventoryMovementType(str, Enum):
    """Tipos de movimiento de inventario"""
    entrada = "entrada"
    salida = "salida"
    ajuste = "ajuste"


class InventoryMovement(Base):
    """Modelo ORM para la tabla `inventory_movement`."""

    __tablename__ = "inventory_movement"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
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

    type_of_movement: Mapped[str] = mapped_column(
        SQLEnum(InventoryMovementType, name="inventory_movement_type", create_type=False),
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

    amount: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    reason: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    movement_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
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

    product = relationship("Product", lazy="selectin")
    user = relationship("User", lazy="selectin")

    def __repr__(self) -> str:
        return f"InventoryMovement(id={self.id}, type={self.type_of_movement})"

