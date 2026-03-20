"""
Archivo: be/app/models/user.py
Descripción: Modelo ORM SQLAlchemy para la tabla `users` en PostgreSQL.

¿Qué?
  Define la estructura completa del modelo User con todos los campos
  (email, password, nombre, apellido, teléfono, documento de identidad),
  relaciones con Role, TypeDocument y PasswordResetToken, y timestamps automáticos.
  
¿Para qué?
  - Centralizar la estructura de usuarios del sistema CALZADO J&R
  - Validar tipos de datos y restricciones (unique email, índices)
  - Establecer relaciones con roles, ocupaciones y documentos
  - Permitir autenticación, autorización y gestión de perfiles
  
¿Impacto?
  CRÍTICO — Cada registro representa un usuario real (admin, employee, client).
  Modificar campos rompe: registro, login, dashboard, permisos.
  Dependencias: Role (many-to-one), TypeDocument (many-to-one),
               PasswordResetToken (one-to-many), auth/service.py,
               modules/users/router.py, modules/admin/router.py
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    """Modelo ORM para la tabla `users`."""

    __tablename__ = "users"

    # ────────────────────────────
    # 📌 Columnas principales
    # ────────────────────────────

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    name_user: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    last_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    identity_document: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    identity_document_type_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("type_document.id"),
        nullable=True,
    )

    # ────────────────────────────
    # 🔗 Relaciones
    # ────────────────────────────

    identity_document_type = relationship("TypeDocument", back_populates="users", lazy="selectin")

    password_reset_tokens = relationship(
        "PasswordResetToken",
        back_populates="user",
        foreign_keys="PasswordResetToken.user_id",
        lazy="selectin",
    )

    # ────────────────────────────
    # 🔗 Relación con roles
    # ────────────────────────────

    role_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id"),
        nullable=False,
    )

    role = relationship("Role", lazy="selectin")

    # ────────────────────────────
    # 🔐 Estado de la cuenta
    # ────────────────────────────

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    is_validated: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    must_change_password: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    # ────────────────────────────
    # 📋 Campos específicos por rol
    # ────────────────────────────

    # Solo para clientes
    business_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # Solo para empleados (guarnición, solador, cortador, emplantillador)
    occupation: Mapped[str | None] = mapped_column(
        Enum("jefe", "cortador", "guarnecedor", "solador", "emplantillador", name="occupation_type"),
        nullable=True,
    )

    # ────────────────────────────
    # ✅ Validación por admin
    # ────────────────────────────

    validated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )

    validated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ────────────────────────────
    # 🕐 Auditoría - Quién creó/actualizó/borró
    # ────────────────────────────

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
    # 🔗 Relaciones de auditoría (auto-referencias)
    # ────────────────────────────

    validated_by_user = relationship(
        "User",
        foreign_keys=[validated_by],
        remote_side=id,
        primaryjoin="User.validated_by == User.id",
    )
    created_by_user = relationship(
        "User",
        foreign_keys=[created_by],
        remote_side=id,
        primaryjoin="User.created_by == User.id",
    )
    updated_by_user = relationship(
        "User",
        foreign_keys=[updated_by],
        remote_side=id,
        primaryjoin="User.updated_by == User.id",
    )
    deleted_by_user = relationship(
        "User",
        foreign_keys=[deleted_by],
        remote_side=id,
        primaryjoin="User.deleted_by == User.id",
    )

    def __repr__(self) -> str:
        return f"User(id={self.id}, email={self.email}, is_active={self.is_active})"

