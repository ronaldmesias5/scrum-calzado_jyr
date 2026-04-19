"""
Archivo: be/app/models/supply_categories.py
Descripción: Modelo ORM para la tabla `supply_categories`.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SupplyCategory(Base):
    """Modelo ORM para categorías independientes de insumos."""

    __tablename__ = "supply_categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
    )

    global_stage: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        default="otros",
    )

    color: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="blue",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    def __repr__(self) -> str:
        return f"SupplyCategory(id={self.id}, name={self.name}, color={self.color})"
