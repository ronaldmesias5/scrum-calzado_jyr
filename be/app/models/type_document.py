"""
Archivo: be/app/models/type_document.py
Descripción: Modelo ORM SQLAlchemy para la tabla `type_document` en PostgreSQL.

¿Qué?
  Define tipos de documentos de identidad válidos en el sistema
  (DNI, Pasaporte, Carnet de Extranjería, RUC, etc.).
  Campo principal: name (único, indexado).
  
¿Para qué?
  - Normalizar tipos de documentos en el registro
  - Evitar datos arbitrarios (solo valores predefinidos)
  - Permitir validación en frontend con lista SELECT
  
¿Impacto?
  MEDIO — Usuarios necesitan seleccionar tipo de documento al registrarse.
  Modificar name de tipos existentes rompe: registros de usuarios,
  validaciones en auth/router.py, seed en db/init/99_seed_type_documents.sql
  Dependencias: User (one-to-many desde User.identity_document_type_id)
"""

import uuid
from datetime import datetime

from sqlalchemy import String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TypeDocument(Base):
    """Modelo ORM para la tabla `type_document` de tipos de documentos."""

    __tablename__ = "type_document"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True,
    )

    # ────────────────────────────
    # 📅 Timestamps
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

    # Relación inversa con usuarios
    users = relationship("User", back_populates="identity_document_type", lazy="selectin")

