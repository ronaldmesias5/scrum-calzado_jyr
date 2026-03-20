"""
Archivo: be/app/models/category.py
Descripción: Modelo ORM SQLAlchemy para la tabla `categories` (categorías de productos).

¿Qué?
  Define categorías de calzado (Hombre, Mujer, Niño, Especializado, etc.).
  Campos: name_category (único), description_category, timestamps, soft delete.
  Relaciones: one-to-many con Product.

¿Para qué?
  - Organizar catálogo en categorías
  - Permitir filtrado y búsqueda por categoría
  - Mejorar experiencia de usuario (navegación por categorías)
  - Validación de datos (solo categorías existentes)

¿Impacto?
  CRÍTICO — Sin categorías, el catálogo está desorganizado.
  Si falla: landing page no muestra categorías, queries de búsqueda rompen.
  Modificar name_category rompe: frontend landing/catalog, admin/catalog_router.py,
  schemas que validan categorías existentes.
  Dependencias: models/product.py, database.py
"""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Category(Base):
    """Modelo para categorías de productos"""
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name_category: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
    )

    description_category: Mapped[str | None] = mapped_column(
        Text,
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

    products = relationship("Product", back_populates="category", lazy="selectin")

    def __repr__(self) -> str:
        return f"Category(id={self.id}, name_category={self.name_category})"

