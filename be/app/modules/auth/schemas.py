"""
Archivo: be/app/modules/auth/schemas.py
Descripción: Schemas Pydantic para validación en endpoints de autenticación.

¿Qué?
  Define 10+ schemas Pydantic:
  - Enums: OccupationType (jefe, cortador, etc.)
  - Request: UserCreate (registro cliente), UserLogin, ChangePasswordRequest, etc.
  - Response: UserResponse (con todos los campos), TokenResponse, MessageResponse
  Incluye validaciones: password strength, phone format, identity_document, email
  
¿Para qué?
  - Validar datos de entrada en auth/router.py
  - Garantizar type safety (conversión automática de tipos)
  - Separar schemas públicos (UserCreate) de schemas admin (AdminCreateEmployeeRequest)
  - Documentar API con OpenAPI (FastAPI usa estos schemas para docs)
  
¿Impacto?
  CRÍTICO — Auth/router.py, admin/router.py y users/router.py dependen de estos schemas.
  Modificar UserResponse rompe: frontend types/auth.ts (debe coincidir exacto).
  Cambiar validaciones rompe: formularios RegisterPage, LoginPage.
  Dependencias: auth/router.py, admin/schemas.py (reutiliza OccupationType),
               frontend types/auth.ts (interfaces reflejan estos schemas)
"""

import re
import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator


# ════════════════════════════════════════
# 📋 ENUMS
# ════════════════════════════════════════

class OccupationType(str, Enum):
    """Ocupaciones disponibles para empleados."""
    JEFE = "jefe"
    CORTADOR = "cortador"
    GUARNECEDOR = "guarnecedor"
    SOLADOR = "solador"
    EMPLANTILLADOR = "emplantillador"


# ════════════════════════════════════════
# 📥 Schemas de REQUEST
# ════════════════════════════════════════

class UserCreate(BaseModel):
    """Schema para el registro de un nuevo cliente."""
    email: EmailStr
    name: str
    last_name: str
    phone: str | None = None
    identity_document: str | None = None
    identity_document_type_id: uuid.UUID | None = None
    business_name: str | None = None
    occupation: OccupationType | None = None
    accepted_terms: bool = False
    password: str

    @field_validator("accepted_terms")
    @classmethod
    def validate_terms(cls, v: bool) -> bool:
        if not v:
            raise ValueError("Debes aceptar los términos y condiciones")
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) < 7 or len(v) > 20:
                raise ValueError("El teléfono debe tener entre 7 y 20 caracteres")
        return v

    @field_validator("identity_document")
    @classmethod
    def validate_identity_document(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) < 8 or len(v) > 10:
                raise ValueError("El documento de identidad debe tener entre 8 y 10 dígitos")
            if not v.isdigit():
                raise ValueError("El documento de identidad debe contener solo dígitos")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        if not re.search(r"[A-Z]", v):
            raise ValueError("La contraseña debe contener al menos una letra mayúscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("La contraseña debe contener al menos una letra minúscula")
        if not re.search(r"\d", v):
            raise ValueError("La contraseña debe contener al menos un número")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres")
        if len(v) > 255:
            raise ValueError("El nombre no puede exceder 255 caracteres")
        return v

    @field_validator("last_name")
    @classmethod
    def validate_last_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("El apellido debe tener al menos 2 caracteres")
        if len(v) > 255:
            raise ValueError("El apellido no puede exceder 255 caracteres")
        return v

    @field_validator("business_name")
    @classmethod
    def validate_business_name(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("El nombre comercial debe tener al menos 2 caracteres")
            if len(v) > 255:
                raise ValueError("El nombre comercial no puede exceder 255 caracteres")
        return v


class UserLogin(BaseModel):
    """Schema para el login de un usuario."""
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    """Schema para cambiar la contraseña (usuario autenticado)."""
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        if not re.search(r"[A-Z]", v):
            raise ValueError("La contraseña debe contener al menos una letra mayúscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("La contraseña debe contener al menos una letra minúscula")
        if not re.search(r"\d", v):
            raise ValueError("La contraseña debe contener al menos un número")
        return v


class ForgotPasswordRequest(BaseModel):
    """Schema para solicitar recuperación de contraseña."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema para restablecer la contraseña con un token de recuperación."""
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        if not re.search(r"[A-Z]", v):
            raise ValueError("La contraseña debe contener al menos una letra mayúscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("La contraseña debe contener al menos una letra minúscula")
        if not re.search(r"\d", v):
            raise ValueError("La contraseña debe contener al menos un número")
        return v


class RefreshTokenRequest(BaseModel):
    """Schema para renovar el access token usando el refresh token."""
    refresh_token: str


# ════════════════════════════════════════
# 📤 Schemas de RESPONSE
# ════════════════════════════════════════

class UserResponse(BaseModel):
    """Schema de respuesta con datos del usuario (sin password)."""
    id: uuid.UUID
    email: str
    name: str
    last_name: str
    phone: str | None
    identity_document: str | None
    identity_document_type_id: uuid.UUID | None = None
    identity_document_type_name: str | None = None
    is_active: bool
    is_validated: bool
    must_change_password: bool
    role_name: str | None = None
    business_name: str | None = None
    occupation: str | None = None
    accepted_terms: bool = False
    terms_accepted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Schema de respuesta con los tokens de autenticación."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    """Schema de respuesta genérico con un mensaje."""
    message: str
