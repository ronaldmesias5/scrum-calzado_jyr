"""
Archivo: be/app/models/scrap.py
Descripción: Modelos ORM para las tablas de registro de pérdidas por calzado defectuoso.

Modelos:
  - DefectCode: Códigos de defecto (DEF-FAB, DEF-ALM, etc.)
  - LossRecord: Registro de pérdida (vincula producto, defecto, cantidad)
  - ScrapStock: Stock de scrap generado por pérdidas aprobadas
"""

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, Numeric, DateTime, ForeignKey, Boolean, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.product import Product
    from app.models.order import Order, OrderDetail


class DefectCode(Base):
    """Modelo ORM para la tabla `defect_codes` (códigos de defecto)."""

    __tablename__ = "defect_codes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
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

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
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

    loss_records = relationship("LossRecord", back_populates="defect_code", lazy="selectin")
    scrap_stock = relationship("ScrapStock", back_populates="defect_code", lazy="selectin")

    def __repr__(self) -> str:
        return f"DefectCode(id={self.id}, code={self.code}, name={self.name})"


class LossRecord(Base):
    """Modelo ORM para la tabla `loss_records` (registro de incidencias)."""

    __tablename__ = "loss_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Category: producto, maquinaria, insumo
    incidence_category: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="producto",
    )

    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=True,
    )

    size: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    # Machinery-specific: free text name
    machinery_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # Supply-specific: FK to supplies table (when selecting existing supply)
    supply_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("supplies.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    # Supply-specific: free text name (when typing custom supply name)
    custom_supply_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    colour: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    quantity: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    defect_code_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("defect_codes.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=True,
    )

    # Descripción libre del defecto (reemplaza al código de defecto cuando no se usa)
    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    observations: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Incident type: perdida, en_reparacion, reparado, devuelto
    incident_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="perdida",
    )

    registered_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    approved_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Order linking (optional)
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    order_detail_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("order_details.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    line_group: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # Repair tracking
    repaired_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    repaired_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
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

    product = relationship("Product", lazy="selectin")
    defect_code = relationship("DefectCode", back_populates="loss_records", lazy="selectin")
    supply = relationship("Supplies", lazy="selectin")
    registered_by = relationship("User", foreign_keys=[registered_by_id], lazy="selectin")
    approved_by = relationship("User", foreign_keys=[approved_by_id], lazy="selectin")
    repaired_by = relationship("User", foreign_keys=[repaired_by_id], lazy="selectin")
    order = relationship("Order", backref="loss_records", lazy="selectin")
    order_detail = relationship("OrderDetail", backref="loss_records", lazy="selectin")
    scrap_stock = relationship("ScrapStock", back_populates="loss_record", lazy="selectin")

    def __repr__(self) -> str:
        return f"LossRecord(id={self.id}, product_id={self.product_id}, type={self.incident_type})"


class ScrapStock(Base):
    """Modelo ORM para la tabla `scrap_stock` (stock de scrap)."""

    __tablename__ = "scrap_stock"

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

    quantity: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    defect_code_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("defect_codes.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    loss_record_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("loss_records.id", ondelete="SET NULL", onupdate="CASCADE"),
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

    product = relationship("Product", lazy="selectin")
    defect_code = relationship("DefectCode", back_populates="scrap_stock", lazy="selectin")
    loss_record = relationship("LossRecord", back_populates="scrap_stock", lazy="selectin")

    def __repr__(self) -> str:
        return f"ScrapStock(id={self.id}, product_id={self.product_id}, quantity={self.quantity})"