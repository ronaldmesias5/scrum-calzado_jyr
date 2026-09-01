"""
Archivo: be/app/models/email_verification_token.py
Descripción: Modelo ORM SQLAlchemy para la tabla `email_verification_tokens`.

¿Qué?
  Define tokens temporales para verificación de email después del registro.
  Sigue el mismo patrón que PasswordResetToken pero para confirmar el email.

¿Para qué?
  - Enviar enlace de verificación al registrar una nueva cuenta
  - Bloquear login hasta que el email sea verificado
  - Permitir reenviar el enlace de verificación
  
¿Impacto?
  MEDIO — Sin esta tabla, el flujo de verificación de email no funciona.
  Dependencias: User (many-to-one)
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class EmailVerificationToken(Base):
    """Modelo ORM para la tabla `email_verification_tokens`."""

    __tablename__ = "email_verification_tokens"

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
