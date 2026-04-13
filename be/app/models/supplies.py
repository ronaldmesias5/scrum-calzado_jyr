"""
Archivo: be/app/models/supplies.py
Descripción: Modelo ORM SQLAlchemy para la tabla `supplies` (insumos de fabricación).
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, Integer, Numeric, Column, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.supplies_movement import SuppliesMovement
    from app.models.product_supplies import ProductSupply


class Supplies(Base):
    """Modelo ORM para la tabla `supplies` de insumos."""

    __tablename__ = "supplies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name_supplies: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description_supplies: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="otros",
    )

    color: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    stock_quantity: Mapped[float] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=0,
    )

    sizes: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    unit: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        default="unidades",
    )

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

    # Relaciones
    movements = relationship("SuppliesMovement", back_populates="supply", lazy="selectin")
    product_links: Mapped[list["ProductSupply"]] = relationship(
        "ProductSupply",
        back_populates="supply",
        lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"Supplies(id={self.id}, name={self.name_supplies}, category={self.category})"
