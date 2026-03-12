"""
Archivo: be/app/models/password_reset_token.py
Descripción: Modelo ORM SQLAlchemy para la tabla `password_reset_tokens` en PostgreSQL.

¿Qué?
  Define tokens temporales para flujo "Olvidé mi contraseña".
  Campos: token (único, indexado), user_id (FK a users), expires_at (datetime),
  used (boolean, evita reutilización), created_at timestamp.
  
¿Para qué?
  - Generar enlaces seguros de restablecimiento de contraseña
  - Expirar tokens después de cierto tiempo (configurable)
  - Evitar que un token se use más de una vez
  - Permitir múltiples solicitudes simultáneas (varios tokens por usuario)
  
¿Impacto?
  MEDIO — Sin esta tabla, usuarios no pueden recuperar contraseñas olvidadas.
  Modificar estructura rompe: auth/service.py (forgot_password, reset_password),
  auth/router.py (/forgot-password, /reset-password endpoints),
  emails de recuperación (utils/email.py).
  Dependencias: User (many-to-one), módulos auth/service, utils/email
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PasswordResetToken(Base):
    """Modelo ORM para la tabla `password_reset_tokens`."""

    __tablename__ = "password_reset_tokens"

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

    token: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    used: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    user = relationship("User", lazy="selectin")

    def __repr__(self) -> str:
        token_preview = self.token[:8] if self.token else "N/A"
        return (
            f"PasswordResetToken(id={self.id}, user_id={self.user_id}, "
            f"token={token_preview}..., used={self.used})"
        )
