"""
Archivo: be/app/models/product_supplies.py
Descripción: Modelo ORM para la tabla product_supplies (vinculación de productos con insumos).

¿Para qué?
  - Ligar un producto de calzado con los insumos que necesita para fabricarse
  - Permite verificar si hay stock de insumos suficiente antes de iniciar producción
"""

import uuid
from datetime import datetime

from sqlalchemy import Integer, Numeric, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProductSupply(Base):
    """Relación M:M entre productos e insumos con cantidad requerida."""

    __tablename__ = "product_supplies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )

    supply_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("supplies.id", ondelete="CASCADE"),
        nullable=False,
    )

    quantity_required: Mapped[float] = mapped_column(
        Numeric(10, 4),
        nullable=False,
        default=1,
        comment="Cuántas unidades del insumo se necesitan por par/producto",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relaciones
    product = relationship("Product", back_populates="supply_links")
    supply = relationship("Supplies", back_populates="product_links")

    __table_args__ = (
        UniqueConstraint("product_id", "supply_id", name="uq_product_supply"),
    )

    def __repr__(self) -> str:
        return f"ProductSupply(product={self.product_id}, supply={self.supply_id}, qty={self.quantity_required})"
