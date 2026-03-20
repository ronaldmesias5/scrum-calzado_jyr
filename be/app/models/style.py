"""
Archivo: be/app/models/style.py
Descripción: Modelo ORM SQLAlchemy para la tabla `styles` (modelos/estilos de calzado).

¿Qué?
  Define estilos/modelos específicos de calzado dentro de una marca.
  Campos: name_style (ej: "Air Max 90", "Superstar"), description_style.
  FK: brand_id (vincula a marca madre, RESTRICT integridad).
  Relaciones: many-to-one con Brand, one-to-many con Product.

¿Para qué?
  - Organizar productos por estilo dentro de marca
  - Permitir búsqueda/filtrado por estilo específico
  - Mejorar experiencia de catálogo (Nike > Air Max > colores/tallas)
  - Rastrear característica/modelo específico de producto

¿Impacto?
  CRÍTICO — Sin estilos, no hay estructura en catálogo.
  Si falla: productos no están organizados, búsqueda no funciona.
  Modificar FK RESTRICT rompe: no se pueden eliminar marcas sin eliminar estilos.
  Modificar name_style rompe: queries en admin/catalog que filtran por estilo.
  Dependencias: models/brand.py (many-to-one), models/product.py (one-to-many),
               admin/catalog_router.py, landing pages
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
    from app.models.brand import Brand


class Style(Base):
    """Modelo para estilos/modelos de calzado"""
    __tablename__ = "styles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    brand_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brands.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    name_style: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description_style: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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

    brand = relationship("Brand", back_populates="styles", lazy="selectin")
    products = relationship("Product", back_populates="style", lazy="selectin")

    def __repr__(self) -> str:
        return f"Style(id={self.id}, name_style={self.name_style})"

