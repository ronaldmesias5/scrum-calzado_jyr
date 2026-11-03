# ════════════════════════════════════════
# 📄 Modelo ORM SQLAlchemy para la tabla `categories` (categorías de productos)
# ════════════════════════════════════════

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    pass


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

