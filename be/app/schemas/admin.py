# ════════════════════════════════════════
# 📄 Schemas Pydantic para validación en endpoints administrativos
# ════════════════════════════════════════

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.schemas.auth import OccupationType
from app.schemas.validators import (
    CommentStr,
    LastNameStr,
    NameStr,
    PasswordStr,
    ReasonStr,
)


class AdminCreateEmployeeRequest(BaseModel):
    """Schema para que el admin cree una cuenta de empleado."""
    email: EmailStr
    name: NameStr
    last_name: LastNameStr
    phone: str | None = None
    identity_document: str | None = None
    identity_document_type_id: uuid.UUID | None = None
    occupation: OccupationType
    password: PasswordStr | None = None


class AdminCreateClientRequest(BaseModel):
    """Schema para que el admin cree una cuenta de cliente."""
    email: EmailStr
    name: NameStr
    last_name: LastNameStr
    phone: str | None = None
    identity_document: str | None = None
    identity_document_type_id: uuid.UUID | None = None
    business_name: str | None = None
    password: PasswordStr | None = None


class AdminCreateJefeRequest(BaseModel):
    """Schema para que el admin cree una cuenta de jefe (empleado con occupation='jefe')."""
    email: EmailStr
    name: NameStr
    last_name: LastNameStr
    phone: str | None = None
    identity_document: str | None = None
    identity_document_type_id: uuid.UUID | None = None
    password: PasswordStr | None = None


class RejectUserRequest(BaseModel):
    """Schema para rechazar una cuenta de usuario con motivo."""
    reason: ReasonStr


class ProcessReactivationRequest(BaseModel):
    """Schema para aprobar o rechazar un ticket de reactivación."""
    comment: CommentStr


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
    name: NameStr | None = None
    last_name: LastNameStr | None = None
    phone: str | None = None
    identity_document: str | None = None
    identity_document_type_id: uuid.UUID | None = None
    occupation: OccupationType | None = None
    business_name: str | None = None
    is_active: bool | None = None
