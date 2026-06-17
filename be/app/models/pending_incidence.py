"""
Archivo: be/app/models/pending_incidence.py
Descripción: Modelo ORM para incidencias de producto pendientes de aprobación del jefe.

Flujo:
  1. Empleado crea una incidencia de producto vinculada a su tarea → status=pending
  2. Jefe ve la lista de pendientes en sección separada
  3. Jefe aprueba → elige tipo (perdida/en_reparacion/devuelto) → se crea LossRecord real
  4. Jefe rechaza → status=rejected
"""

import uuid
from datetime import datetime
from enum import Enum
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SQLEnum, func, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.tasks import Task
    from app.models.product import Product
    from app.models.scrap import DefectCode, LossRecord


class PendingIncidenceStatus(str, Enum):
    """Estados de una incidencia pendiente de aprobación."""
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class PendingProductIncidence(Base):
    """Modelo ORM para la tabla `pending_product_incidences`."""

    __tablename__ = "pending_product_incidences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Empleado que reporta
    employee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    # Tarea vinculada
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    # Producto (denormalizado desde la tarea para conveniencia)
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    # Tamaño reportado
    size: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    # Color (opcional)
    colour: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    # Código de defecto (opcional — reemplazado por descripción libre)
    defect_code_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("defect_codes.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=True,
    )

    # Descripción libre del defecto (reemplaza al código de defecto)
    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # Cantidad reportada
    quantity: Mapped[Decimal] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    # Observaciones del empleado
    observations: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Estado: pending / approved / rejected
    status: Mapped[str] = mapped_column(
        SQLEnum(PendingIncidenceStatus, name="pending_incidence_status", create_type=False),
        nullable=False,
        default=PendingIncidenceStatus.pending,
    )

    # Tipo elegido por el jefe al aprobar (perdida/en_reparacion/devuelto)
    approved_type: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    # Jefe que aprueba/rechaza
    reviewed_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Link al LossRecord creado tras aprobación
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

    employee = relationship("User", foreign_keys=[employee_id], lazy="selectin")
    task = relationship("Task", foreign_keys=[task_id], lazy="selectin")
    product = relationship("Product", foreign_keys=[product_id], lazy="selectin")
    defect_code = relationship("DefectCode", foreign_keys=[defect_code_id], lazy="selectin")
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id], lazy="selectin")
    loss_record = relationship("LossRecord", foreign_keys=[loss_record_id], lazy="selectin")

    def __repr__(self) -> str:
        return f"PendingProductIncidence(id={self.id}, task_id={self.task_id}, status={self.status})"
