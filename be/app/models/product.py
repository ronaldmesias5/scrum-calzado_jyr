"""
Archivo: be/app/models/product.py
Descripción: Modelo ORM SQLAlchemy para la tabla `products` (productos del catálogo).

¿Qué?
  Define productos de calzado con: nombre, descripción, color, imagen, estado.
  ForeignKeys: style_id, brand_id, category_id (RESTRICT para integridad referencial).
  Campos críticos: insufficient_threshold (alerta de bajo stock), state (activo/inactivo).
  Relaciones: many-to-one con Style, Brand, Category; one-to-many con Inventory, OrderDetail.

¿Para qué?
  - Almacenar productos disponibles en el catálogo
  - Vincular productos con estilos, marcas, categorías
  - Validar inventario disponible
  - Permitir búsqueda y filtrado en landing y admin
  - Trackear estado de producto (activo/inactivo)

¿Impacto?
  CRÍTICO — Base de negocio, sin productos no hay ventas.
  Si falla: catálogo vacío, órdenes no se pueden crear, inventario no existe.
  Modificar RESTRICT en ForeignKey rompe: eliminación de estilos, marcas, categorías.
  Modificar insufficient_threshold lógica rompe: alertas de inventario bajo.
  Dependencias: models/style.py, models/brand.py, models/category.py,
               models/inventory.py, models/order.py, catalog/*
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.style import Style
    from app.models.brand import Brand
    from app.models.category import Category


class Product(Base):
    """Modelo para productos del catálogo"""
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    style_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("styles.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    brand_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brands.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    name_product: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description_product: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    color: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    image_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    insufficient_threshold: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=12,
    )

    state: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
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

    style = relationship("Style", back_populates="products", lazy="selectin")
    brand = relationship("Brand", back_populates="products", lazy="selectin")
    category = relationship("Category", back_populates="products", lazy="selectin")
    inventory = relationship("Inventory", back_populates="product", lazy="selectin")
    supply_links = relationship("ProductSupply", back_populates="product", lazy="selectin", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"Product(id={self.id}, name_product={self.name_product})"

