"""
Archivo: be/app/models/incidence.py
Descripción: Modelo ORM para la tabla `incidence` (incidencias de tareas).
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SQLEnum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.tasks import Task


class IncidenceStatus(str, Enum):
    """Estados posibles de una incidencia"""
    abierta = "abierta"
    en_progreso = "en_progreso"
    resuelta = "resuelta"
    cerrada = "cerrada"


class Incidence(Base):
    """Modelo ORM para la tabla `incidence` (incidencias/problemas en tareas)."""

    __tablename__ = "incidence"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="RESTRICT", onupdate="CASCADE"),
        nullable=False,
    )

    type_incidence: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    description_incidence: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    state: Mapped[str] = mapped_column(
        SQLEnum(IncidenceStatus, name="incidence_status", create_type=False),
        nullable=False,
        default=IncidenceStatus.abierta,
    )

    report_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
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

    task = relationship("Task", foreign_keys=[task_id], back_populates="incidences", lazy="selectin")

    def __repr__(self) -> str:
        return f"Incidence(id={self.id}, task_id={self.task_id}, state={self.state})"

