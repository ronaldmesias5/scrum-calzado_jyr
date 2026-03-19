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

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
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

    def __repr__(self) -> str:
        return f"Product(id={self.id}, name={self.name})"

