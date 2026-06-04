import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import String, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class ReportShare(Base):
    __tablename__ = "report_shares"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    shared_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    target_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    report_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Tipo de reporte: employee, customer, production",
    )

    report_title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    parameters: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
        comment="Parámetros usados al generar el reporte (fechas, filtros, etc.)",
    )

    message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )

    is_read: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    shared_by = relationship("User", foreign_keys=[shared_by_id], lazy="selectin")
    target_user = relationship("User", foreign_keys=[target_user_id], lazy="selectin")

    def __repr__(self) -> str:
        return f"ReportShare(id={self.id}, type={self.report_type}, target={self.target_user_id})"
