"""
Archivo: be/app/modules/admin/schemas.py
Descripción: Schemas Pydantic para validación en endpoints administrativos.

¿Qué?
  Define 3 schemas Pydantic para creación de usuarios:
  - AdminCreateEmployeeRequest: Crear empleado con occupation (cortador, solador, etc.)
  - AdminCreateJefeRequest: Crear jefe (employee con occupation=jefe)
  - AdminCreateClientRequest: Crear cliente con business_name opcional
  Incluye validaciones: password strength, name/last_name length, EmailStr
  
¿Para qué?
  - Validar datos de entrada en admin/router.py endpoints
  - Garantizar contraseñas seguras (8+ chars, mayúscula, minúscula, número)
  - Separar schemas admin de schemas públicos (más campos obligatorios)
  - Type safety con Pydantic (conversión automática de tipos)
  
¿Impacto?
  ALTO — Endpoints de admin/router.py dependen de estos schemas.
  Modificar validaciones rompe: formularios frontend (AdminCreateEmployeeForm),
  lógica de creación de usuarios en admin/router.py.
  Dependencias: auth/schemas.py (OccupationType enum),
               admin/router.py (consume estos schemas)
"""

import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.modules.auth.schemas import OccupationType


def _validate_password_strength(v: str) -> str:
    """Valida requisitos mínimos de seguridad para contraseñas."""
    if len(v) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres")
    if not re.search(r"[A-Z]", v):
        raise ValueError("La contraseña debe contener al menos una letra mayúscula")
    if not re.search(r"[a-z]", v):
        raise ValueError("La contraseña debe contener al menos una letra minúscula")
    if not re.search(r"\d", v):
        raise ValueError("La contraseña debe contener al menos un número")
    return v


class AdminCreateEmployeeRequest(BaseModel):
    """Schema para que el admin cree una cuenta de empleado."""
    email: EmailStr
    name: str
    last_name: str
    phone: str | None = None
    identity_document: str | None = None
    identity_document_type_id: uuid.UUID | None = None
    occupation: OccupationType
    password: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return _validate_password_strength(v)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return v

    @field_validator("last_name")
    @classmethod
    def validate_last_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("El apellido debe tener al menos 2 caracteres")
        return v


class AdminCreateClientRequest(BaseModel):
    """Schema para que el admin cree una cuenta de cliente."""
    email: EmailStr
    name: str
    last_name: str
    phone: str | None = None
    identity_document: str | None = None
    identity_document_type_id: uuid.UUID | None = None
    business_name: str | None = None
    password: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return _validate_password_strength(v)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return v

    @field_validator("last_name")
    @classmethod
    def validate_last_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("El apellido debe tener al menos 2 caracteres")
        return v


class AdminCreateJefeRequest(BaseModel):
    """Schema para que el admin cree una cuenta de jefe (empleado con occupation='jefe')."""
    email: EmailStr
    name: str
    last_name: str
    phone: str | None = None
    identity_document: str | None = None
    identity_document_type_id: uuid.UUID | None = None
    password: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str | None) -> str | None:
        if v is None:
            return v
        return _validate_password_strength(v)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return v

    @field_validator("last_name")
    @classmethod
    def validate_last_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("El apellido debe tener al menos 2 caracteres")
        return v


class RejectUserRequest(BaseModel):
    """Schema para rechazar una cuenta de usuario con motivo."""
    reason: str

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("El motivo debe tener al menos 5 caracteres")
        if len(v) > 500:
            raise ValueError("El motivo no puede exceder 500 caracteres")
        return v


class ProcessReactivationRequest(BaseModel):
    """Schema para aprobar o rechazar un ticket de reactivación."""
    comment: str

    @field_validator("comment")
    @classmethod
    def validate_comment(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 5:
            raise ValueError("El comentario debe tener al menos 5 caracteres")
        if len(v) > 500:
            raise ValueError("El comentario no puede exceder 500 caracteres")
        return v


class ReactivationTicketResponse(BaseModel):
    """Schema de respuesta con los datos de un ticket de reactivación."""
    id: str
    user_id: str
    email: str
    reason: str
    phone: str
    identity_document: str
    evidence_url: str | None = None
    status: str
    admin_comment: str | None = None
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminUpdateUserRequest(BaseModel):
    """Schema para actualizar datos de un usuario por un admin/jefe."""
    name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    identity_document: str | None = None
    identity_document_type_id: uuid.UUID | None = None
    occupation: OccupationType | None = None
    business_name: str | None = None
    is_active: bool | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        return v

    @field_validator("last_name")
    @classmethod
    def validate_last_name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if len(v) < 2:
            raise ValueError("El apellido debe tener al menos 2 caracteres")
        return v
