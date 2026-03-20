"""
Archivo: be/app/models/inventory.py
Descripción: Modelo ORM SQLAlchemy para la tabla `inventory` (stock por talla/color).

¿Qué?
  Define inventario desglosado por talla y color para cada producto.
  Campos: product_id (FK), size, colour, amount (Decimal), minimum_stock.
  Relaciones: many-to-one con Product, one-to-many con InventoryMovement.
  Un solo registro por (product_id, size, colour) - único a nivel lógica.

¿Para qué?
  - Gestionar stock granular (talla 35 roja, talla 36 azul, etc.)
  - Alertas de bajo stock (minimum_stock)
  - Calcular stock disponible antes de crear orden
  - Rastrear movimientos (entrada/salida) con InventoryMovement
  - Permitir reportes de inventario por talla/color

¿Impacto?
  CRÍTICO — Sin inventario preciso, se sobrevenden productos.
  Si falla: órdenes sin validación de stock → producción imposible.
  Modificar amount lógica rompe: cálculos de disponibilidad en dashboard.
  Modificar minimum_stock rompe: alertas de bajo stock en admin.
  Dependencias: models/product.py, models/inventory_movement.py,
               dashboard_jefe/router.py (alertas), orders/service.py (validación)
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime, ForeignKey, Numeric, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.product import Product


class Inventory(Base):
    """Modelo para inventario de productos"""
    __tablename__ = "inventory"

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

