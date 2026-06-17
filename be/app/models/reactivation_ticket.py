"""
Archivo: be/app/models/reactivation_ticket.py
Descripción: Modelo ORM SQLAlchemy para la tabla `reactivation_tickets`.

¿Qué?
  Define la estructura del modelo ReactivationTicket con campos:
  id, user_id, email, reason, phone, identity_document, evidence_url,
  status (pending/approved/rejected), admin_comment, reviewed_by, reviewed_at, created_at

¿Para qué?
  RF-005 — Solicitud de Reactivación de Cuentas. Almacena tickets de reactivación
  que usuarios con cuentas inactivas envían para solicitar reactivación de su cuenta.

¿Impacto?
  MEDIO — Nueva tabla independiente. No modifica tablas existentes.
  Dependencias: admin/router.py (endpoints de gestión), auth/router.py (endpoint público)
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ReactivationTicket(Base):
    """Modelo ORM para la tabla `reactivation_tickets`."""

    __tablename__ = "reactivation_tickets"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    reason: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    identity_document: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    evidence_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        SQLEnum(
            "pending", "approved", "rejected",
            name="reactivation_ticket_status",
            create_type=False,
        ),
        default="pending",
        nullable=False,
    )

    admin_comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # ────────────────────────────
    # Relaciones
    # ────────────────────────────

    user = relationship("User", foreign_keys=[user_id], lazy="selectin")
    reviewer = relationship(
        "User",
        foreign_keys=[reviewed_by],
        primaryjoin="ReactivationTicket.reviewed_by == User.id",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return (
            f"ReactivationTicket(id={self.id}, email={self.email}, "
            f"status={self.status})"
        )
