"""
Archivo: be/app/models/role.py
Descripción: Modelo ORM SQLAlchemy para la tabla `roles` en PostgreSQL.

¿Qué?
  Define el modelo Role con campos name (único), description y timestamps.
  Representa los 3 roles principales: admin, employee, client.
  La ocupación (jefe, cortador, etc.) se almacena en User.occupation, NO aquí.
  
¿Para qué?
  - Categorizar usuarios por nivel de acceso
  - Permitir control RBAC (Role-Based Access Control)
  - Separar lógicamente permisos (admin puede TODO, employee limitado)
  
¿Impacto?
  CRÍTICO — Sin roles, el sistema no puede distinguir admin de employee.
  Modificar name rompe: dependencies.py (_require_admin, _require_jefe),
  routers protegidos, lógica de autorización.
  Dependencias: User (many-to-one desde User.role_id), seed_data.py
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Role(Base):
    """Modelo ORM para la tabla `roles`."""

    __tablename__ = "roles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

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

    def __repr__(self) -> str:
        return f"Role(id={self.id}, name={self.name})"
