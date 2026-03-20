"""
Archivo: be/app/models/supplies.py
Descripción: Modelo ORM SQLAlchemy para la tabla `supplies` (insumos de fabricación).

¿Qué?
  Define el registro centralizado de insumos (materiales) utilizados en
  la fabricación de calzado: cueros, telas, pegamentos, herrajes, plantillas.
  
¿Para qué?
  - Gestión de inventario de materiales
  - Controlar entrada y salida de insumos
  - Rastrear costos de producción
  
¿Impacto?
  CRÍTICO - Sin esta tabla, no se puede producir calzado.
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
    from app.models.supplies_movement import SuppliesMovement


class Supplies(Base):
    """Modelo ORM para la tabla `supplies` de insumos."""

    __tablename__ = "supplies"

    # ────────────────────────────
    # 📌 Columnas principales
    # ────────────────────────────

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

    movements = relationship("SuppliesMovement", back_populates="supply", lazy="selectin")

    def __repr__(self) -> str:
        return f"Supplies(id={self.id}, name_supplies={self.name_supplies})"

