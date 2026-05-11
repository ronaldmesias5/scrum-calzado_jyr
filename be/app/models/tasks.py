"""
Archivo: be/app/models/tasks.py
Descripción: Modelo ORM para la tabla `tasks` (tareas de producción).
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SQLEnum, func, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.incidence import Incidence
    from app.models.order import Order
    from app.models.product import Product


class TaskPriority(str, Enum):
    """Prioridad de una tarea"""
    baja = "baja"
    media = "media"
    alta = "alta"


class TaskType(str, Enum):
    """Tipo de tarea (etapa de producción)"""
    corte = "corte"
    guarnicion = "guarnicion"
    soladura = "soladura"
    emplantillado = "emplantillado"


class TaskStatus(str, Enum):
    """Estado de una tarea"""
    pendiente = "pendiente"
    por_liquidar = "por_liquidar"
    en_progreso = "en_progreso"
    completado = "completado"
    pagado = "pagado"
    cancelado = "cancelado"


class Task(Base):
    """Modelo ORM para la tabla `tasks` (tareas de producción)."""

    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    assigned_to: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    vale_number: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
        index=True
    )

    amount: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Cantidad de pares asignados a esta tarea"
    )

    order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=True,
    )

    product_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE", onupdate="CASCADE"),
        nullable=True,
    )

    description_task: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    priority: Mapped[str] = mapped_column(
        SQLEnum(TaskPriority, name="task_priority", create_type=False),
        nullable=False,
    )

    type: Mapped[str] = mapped_column(
        SQLEnum(TaskType, name="task_type", create_type=False),
        nullable=False,
    )

    status: Mapped[str] = mapped_column(
        SQLEnum(TaskStatus, name="task_status", create_type=False),
        nullable=False,
        default=TaskStatus.pendiente,
    )

    deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    assignment_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    deleted_by: Mapped[uuid.UUID | None] = mapped_column(
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

    # Usuario asignado a la tarea
    assigned_user = relationship("User", foreign_keys=[assigned_to], lazy="selectin")

    # Producto de la tarea
    product = relationship("Product", lazy="select")

    # Incidencias reportadas en esta tarea
    incidences = relationship("Incidence", back_populates="task", lazy="selectin")

    # Orden vinculada (opcional)
    order = relationship("Order", lazy="select")

    def __repr__(self) -> str:
        return f"Task(id={self.id}, type={self.type}, status={self.status}, priority={self.priority})"
