# ════════════════════════════════════════
# 📄 Schemas Pydantic para validación en endpoints de autenticación
# ════════════════════════════════════════

import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.validators import (
    AcceptedTerms,
    BusinessNameStr,
    IdentityDocLooseStr,
    IdentityDocStr,
    LastNameStr,
    NameStr,
    PasswordStr,
    PhoneStr,
    ReasonLongStr,
)


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
    name: NameStr
    last_name: LastNameStr
    phone: PhoneStr | None = None
    identity_document: IdentityDocStr | None = None
    identity_document_type_id: uuid.UUID | None = None
    business_name: BusinessNameStr | None = None
    occupation: OccupationType | None = None
    accepted_terms: AcceptedTerms = False
    password: PasswordStr


class UserLogin(BaseModel):
    """Schema para el login de un usuario."""
    email: EmailStr
    password: str
    remember_me: bool = False


class ChangePasswordRequest(BaseModel):
    """Schema para cambiar la contraseña (usuario autenticado)."""
    current_password: str
    new_password: PasswordStr


class ForgotPasswordRequest(BaseModel):
    """Schema para solicitar recuperación de contraseña."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema para restablecer la contraseña con un token de recuperación."""
    token: str
    new_password: PasswordStr


class RefreshTokenRequest(BaseModel):
    """Schema para renovar el access token usando el refresh token.

    Opcional: el token también puede llegar en la cookie HttpOnly `refresh_token`
    (frontend web). El body sigue soportado para la app móvil.
    """
    refresh_token: str | None = None


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
    invitation_expires_at: datetime | None = None
    role_name: str | None = None
    business_name: str | None = None
    occupation: str | None = None
    avatar_url: str | None = None
    accepted_terms: bool = False
    terms_accepted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    temporary_password: str | None = None
    rejected_by: str | None = None
    rejected_at: datetime | None = None
    rejection_reason: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """Schema de respuesta con los tokens de autenticación."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class ReactivationRequest(BaseModel):
    """Schema para solicitar reactivación de cuenta (público, sin auth)."""
    email: EmailStr
    reason: ReasonLongStr
    phone: PhoneStr
    identity_document: IdentityDocLooseStr
    evidence_url: str | None = None


class RequestNewInvitationRequest(BaseModel):
    """Schema para solicitar una nueva invitación cuando la anterior expiró."""
    email: EmailStr


class MessageResponse(BaseModel):
    """Schema de respuesta genérico con un mensaje."""
    message: str
