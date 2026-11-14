# ════════════════════════════════════════
# 📄 Modelo ORM SQLAlchemy para la tabla `inventory` (stock por talla/color)
# ════════════════════════════════════════

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, ForeignKey, Numeric, Integer, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    pass


class Inventory(Base):
    """Modelo para inventario de productos"""
    __tablename__ = "inventory"
    __table_args__ = (
        UniqueConstraint(
            "product_id", "size", "colour",
            name="uq_inventory_product_size_colour",
        ),
    )

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

    size: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    colour: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    amount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    reserved: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
        default=0,
    )

    minimum_stock: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    # ────────────────────────────────────────────────────────────────────────────
    #  Timestamps
    # ────────────────────────────────────────────────────────────────────────────

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

    # ────────────────────────────────────────────────────────────────────────────
    # 🔗 Relaciones
    # ────────────────────────────────────────────────────────────────────────────

    product = relationship("Product", back_populates="inventory", lazy="selectin")

    def __repr__(self) -> str:
        return f"Inventory(id={self.id}, product_id={self.product_id}, size={self.size})"

