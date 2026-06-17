"""
Archivo: be/app/modules/admin/router.py
Descripción: Router FastAPI con endpoints administrativos para gestión de usuarios.

¿Qué?
  Define endpoints protegidos (admin/jefe) para gestión de usuarios:
  - POST /create-employee: Crear empleado con occupation (admin/jefe)
  - POST /create-jefe: Crear jefe (admin/jefe)
  - POST /create-client: Crear cliente (admin/jefe)
  - GET /users: Listar todos los usuarios con filtros opcionales
  - GET /users/{user_id}: Obtener detalles de un usuario
  - PATCH /users/{user_id}: Actualizar datos de un usuario
  - PATCH /users/{user_id}/validate: Validar cuenta de usuario
  - PATCH /users/{user_id}/force-password-change: Forzar cambio de contraseña
  
¿Para qué?
  - Permitir a admin/jefe crear y gestionar usuarios del sistema
  - Validación de permisos delegada a core/dependencies.py (_require_admin_or_jefe)
  - Separar endpoints administrativos de endpoints públicos (seguridad)
  
¿Impacto?
  CRÍTICO — Sin este router, admin/jefe no pueden gestionar usuarios.
  Modificar create-employee rompe: dashboard AdminCreateEmployeeForm.
  Modificar /users lista rompe: AdminUserListPage en dashboard.
  Dependencias: admin/schemas.py, auth/schemas.py (UserResponse),
               dependencies.py, models/user.py, models/role.py,
               utils/security.py (hash_password)
"""

import secrets
import string
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db, _require_admin_or_jefe
from app.models.role import Role
from app.models.user import User
from app.models.reactivation_ticket import ReactivationTicket
from app.modules.auth.schemas import MessageResponse, UserResponse
from app.modules.admin.schemas import (
    AdminCreateClientRequest, 
    AdminCreateEmployeeRequest, 
    AdminCreateJefeRequest,
    AdminUpdateUserRequest,
    ProcessReactivationRequest,
    ReactivationTicketResponse,
    RejectUserRequest,
)
from app.utils.email import (
    send_welcome_email,
    send_account_approved_email,
    send_account_rejected_email,
    send_reactivation_approved_email,
    send_reactivation_rejected_email,
)
from app.utils.security import hash_password

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["admin"],
)


# ─────────────────────────────────────────
# Helper interno
# ─────────────────────────────────────────

def _build_user_response(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name_user,
        last_name=user.last_name,
        phone=user.phone,
        identity_document=user.identity_document,
        identity_document_type_id=user.identity_document_type_id,
        identity_document_type_name=(
            user.identity_document_type.name_type_document if user.identity_document_type else None
        ),
        is_active=user.is_active,
        is_validated=user.is_validated,
        must_change_password=user.must_change_password,
        role_name=user.role.name_role if user.role else None,
        business_name=user.business_name,
        occupation=user.occupation,
        created_at=user.created_at,
        updated_at=user.updated_at,
        rejected_by=str(user.rejected_by) if user.rejected_by else None,
        rejected_at=user.rejected_at,
        rejection_reason=user.rejection_reason,
    )


# ─────────────────────────────────────────
# Helper: generación de contraseña temporal
# ─────────────────────────────────────────

def _generate_temporary_password(length: int = 12) -> str:
    """Genera una contraseña temporal segura que cumple requisitos de seguridad."""
    uppercase = secrets.choice(string.ascii_uppercase)
    lowercase = secrets.choice(string.ascii_lowercase)
    digit = secrets.choice(string.digits)
    remaining = "".join(
        secrets.choice(string.ascii_letters + string.digits) for _ in range(length - 3)
    )
    chars = list(uppercase + lowercase + digit + remaining)
    secrets.SystemRandom().shuffle(chars)
    return "".join(chars)


# ─────────────────────────────────────────
# Validación de cuentas
# ─────────────────────────────────────────

@router.get(
    "/users/pending-validation",
    response_model=list[UserResponse],
    summary="Listar usuarios pendientes de validación",
)
def get_pending_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserResponse]:
    """Obtiene usuarios pendientes de validación (admin o jefe)."""
    _require_admin_or_jefe(current_user)
    pending_users = (
        db.query(User)
        .filter(User.is_validated == False, User.rejection_reason == None)  # noqa: E712
        .all()
    )
    return [_build_user_response(u) for u in pending_users]


@router.patch(
    "/users/{user_id}/validate",
    response_model=UserResponse,
    summary="Validar usuario",
)
async def validate_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Aprueba y activa la cuenta de un usuario pendiente (admin o jefe). Envía email de notificación."""
    _require_admin_or_jefe(current_user)

    user_to_validate = db.query(User).filter(User.id == user_id).first()
    if not user_to_validate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    user_to_validate.is_validated = True
    user_to_validate.is_active = True
    user_to_validate.validated_by = current_user.id
    user_to_validate.validated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user_to_validate)

    await send_account_approved_email(
        email=user_to_validate.email,
        name=f"{user_to_validate.name_user} {user_to_validate.last_name}",
    )

    return _build_user_response(user_to_validate)


@router.patch(
    "/users/{user_id}/reject",
    response_model=UserResponse,
    summary="Rechazar usuario",
)
async def reject_user(
    user_id: uuid.UUID,
    data: RejectUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Rechaza una cuenta de usuario pendiente con motivo (admin o jefe)."""
    _require_admin_or_jefe(current_user)

    user_to_reject = db.query(User).filter(User.id == user_id).first()
    if not user_to_reject:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    if user_to_reject.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes rechazar tu propia cuenta",
        )

    user_to_reject.is_validated = False
    user_to_reject.is_active = False
    user_to_reject.rejected_by = current_user.id
    user_to_reject.rejected_at = datetime.now(timezone.utc)
    user_to_reject.rejection_reason = data.reason

    db.commit()
    db.refresh(user_to_reject)

    await send_account_rejected_email(
        email=user_to_reject.email,
        name=f"{user_to_reject.name_user} {user_to_reject.last_name}",
        reason=data.reason,
    )

    return _build_user_response(user_to_reject)


@router.patch(
    "/users/{user_id}/force-password-change",
    response_model=MessageResponse,
    summary="Forzar cambio de contraseña",
)
def force_password_change(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Fuerza el cambio de contraseña en el próximo login (admin o jefe)."""
    _require_admin_or_jefe(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    user.must_change_password = True
    db.commit()
    return MessageResponse(message=f"Usuario {user.email} deberá cambiar contraseña en el próximo login")


# ─────────────────────────────────────────
# Listado y creación de usuarios
# ─────────────────────────────────────────

@router.get(
    "/users",
    response_model=list[UserResponse],
    summary="Listar todos los usuarios",
)
def get_all_users(
    role: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[UserResponse]:
    """Lista todos los usuarios. Filtro opcional por rol. Solo admin y jefe."""
    _require_admin_or_jefe(current_user)
    query = db.query(User).filter(User.deleted_at == None)
    if role:
        query = query.join(Role, User.role_id == Role.id).filter(Role.name_role == role)

    return [_build_user_response(u) for u in query.all()]


@router.get(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Obtener detalles de un usuario",
)
def get_user_detail(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Retorna los datos detallados de un usuario específico."""
    _require_admin_or_jefe(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return _build_user_response(user)


@router.patch(
    "/users/{user_id}",
    response_model=UserResponse,
    summary="Actualizar datos de un usuario",
)
def update_user(
    user_id: uuid.UUID,
    data: AdminUpdateUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Actualiza parcialmente los datos de un usuario (admin o jefe)."""
    _require_admin_or_jefe(current_user)

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # Campos básicos
    if data.name is not None:
        user.name_user = data.name
    if data.last_name is not None:
        user.last_name = data.last_name
    if data.phone is not None:
        user.phone = data.phone
    if data.identity_document is not None:
        user.identity_document = data.identity_document
    if data.identity_document_type_id is not None:
        user.identity_document_type_id = data.identity_document_type_id
    
    # Campos específicos
    if data.occupation is not None:
        user.occupation = data.occupation
    if data.business_name is not None:
        user.business_name = data.business_name
    
    # Estado (Activo/Inactivo)
    if data.is_active is not None:
        user.is_active = data.is_active

    user.updated_at = datetime.now(timezone.utc)
    user.updated_by = current_user.id

    db.commit()
    db.refresh(user)
    return _build_user_response(user)


@router.delete(
    "/users/{user_id}",
    response_model=MessageResponse,
    summary="Eliminar usuario (Rechazar)",
)
def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Elimina permanentemente un usuario de la base de datos (admin o jefe)."""
    _require_admin_or_jefe(current_user)

    user_to_delete = db.query(User).filter(User.id == user_id).first()
    if not user_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # No permitir que un usuario se elimine a sí mismo (medida de seguridad adicional)
    if user_to_delete.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="No puedes eliminar tu propia cuenta"
        )

    db.delete(user_to_delete)
    db.commit()
    return MessageResponse(message=f"Usuario {user_to_delete.email} eliminado exitosamente")


@router.post(
    "/users/create-employee",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear cuenta de empleado",
)
async def create_employee(
    data: AdminCreateEmployeeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """
    Crea una cuenta de empleado activa y validada.
    
    Si no se envía contraseña, el sistema genera una temporal y la envía por email.
    ⚠️ El empleado deberá cambiar su contraseña en el primer login.
    """
    _require_admin_or_jefe(current_user)

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una cuenta con ese email")

    employee_role = db.query(Role).filter(Role.name_role == "employee").first()
    if not employee_role:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Rol 'empleado' no encontrado")

    temp_password = data.password if data.password else _generate_temporary_password()

    new_user = User(
        email=data.email,
        name_user=data.name,
        last_name=data.last_name,
        phone=data.phone,
        identity_document=data.identity_document,
        identity_document_type_id=data.identity_document_type_id,
        occupation=data.occupation,
        hashed_password=hash_password(temp_password),
        role_id=employee_role.id,
        is_active=True,
        is_validated=True,
        must_change_password=True,
        validated_by=current_user.id,
        validated_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    await send_welcome_email(
        email=data.email,
        temp_password=temp_password,
        name=f"{data.name} {data.last_name}",
    )

    response = _build_user_response(new_user)
    response.temporary_password = temp_password
    return response


@router.post(
    "/users/create-client",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear cuenta de cliente (por admin o jefe)",
)
async def create_client(
    data: AdminCreateClientRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """
    Crea una cuenta de cliente activa y validada de inmediato (por el admin o jefe).
    
    Si no se envía contraseña, el sistema genera una temporal y la envía por email.
    ⚠️ El cliente deberá cambiar su contraseña en el primer login.
    """
    _require_admin_or_jefe(current_user)

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una cuenta con ese email")

    client_role = db.query(Role).filter(Role.name_role == "client").first()
    if not client_role:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Rol 'cliente' no encontrado")

    temp_password = data.password if data.password else _generate_temporary_password()

    new_user = User(
        email=data.email,
        name_user=data.name,
        last_name=data.last_name,
        phone=data.phone,
        identity_document=data.identity_document,
        identity_document_type_id=data.identity_document_type_id,
        business_name=data.business_name,
        hashed_password=hash_password(temp_password),
        role_id=client_role.id,
        is_active=True,
        is_validated=True,
        must_change_password=True,
        validated_by=current_user.id,
        validated_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    await send_welcome_email(
        email=data.email,
        temp_password=temp_password,
        name=f"{data.name} {data.last_name}",
    )

    response = _build_user_response(new_user)
    response.temporary_password = temp_password
    return response


@router.post(
    "/users/create-jefe",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear cuenta de jefe de fábrica",
)
async def create_jefe(
    data: AdminCreateJefeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """
    Crea una cuenta de jefe de fábrica (empleado con occupation='jefe') activa y validada.
    
    El jefe tendrá acceso al dashboard administrativo para:
    - Validar cuentas de clientes
    - Gestionar catálogo de productos
    - Clasificar categorías, marcas y estilos
    - Gestionar pedidos y empleados
    
    Si no se envía contraseña, el sistema genera una temporal y la envía por email.
    ⚠️ El jefe deberá cambiar su contraseña en el primer login.
    """
    _require_admin_or_jefe(current_user)

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una cuenta con ese email")

    employee_role = db.query(Role).filter(Role.name_role == "employee").first()
    if not employee_role:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Rol 'empleado' no encontrado")

    temp_password = data.password if data.password else _generate_temporary_password()

    new_user = User(
        email=data.email,
        name_user=data.name,
        last_name=data.last_name,
        phone=data.phone,
        identity_document=data.identity_document,
        identity_document_type_id=data.identity_document_type_id,
        occupation="jefe",
        hashed_password=hash_password(temp_password),
        role_id=employee_role.id,
        is_active=True,
        is_validated=True,
        must_change_password=True,
        validated_by=current_user.id,
        validated_at=datetime.now(timezone.utc),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    await send_welcome_email(
        email=data.email,
        temp_password=temp_password,
        name=f"{data.name} {data.last_name}",
    )

    response = _build_user_response(new_user)
    response.temporary_password = temp_password
    return response


# ─────────────────────────────────────────
# RF-005: Reactivación de cuentas
# ─────────────────────────────────────────

def _build_ticket_response(ticket: ReactivationTicket) -> ReactivationTicketResponse:
    return ReactivationTicketResponse(
        id=str(ticket.id),
        user_id=str(ticket.user_id),
        email=ticket.email,
        reason=ticket.reason,
        phone=ticket.phone,
        identity_document=ticket.identity_document,
        evidence_url=ticket.evidence_url,
        status=ticket.status,
        admin_comment=ticket.admin_comment,
        reviewed_by=str(ticket.reviewed_by) if ticket.reviewed_by else None,
        reviewed_at=ticket.reviewed_at,
        created_at=ticket.created_at,
    )


@router.get(
    "/reactivation-tickets",
    response_model=list[ReactivationTicketResponse],
    summary="Listar tickets de reactivación",
)
def get_reactivation_tickets(
    status_filter: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ReactivationTicketResponse]:
    """Lista todos los tickets de reactivación. Filtro opcional por status."""
    _require_admin_or_jefe(current_user)

    query = db.query(ReactivationTicket)
    if status_filter:
        query = query.filter(ReactivationTicket.status == status_filter)

    tickets = query.order_by(ReactivationTicket.created_at.desc()).all()
    return [_build_ticket_response(t) for t in tickets]


@router.patch(
    "/reactivation-tickets/{ticket_id}/approve",
    response_model=ReactivationTicketResponse,
    summary="Aprobar solicitud de reactivación",
)
async def approve_reactivation(
    ticket_id: uuid.UUID,
    data: ProcessReactivationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReactivationTicketResponse:
    """Aprueba un ticket de reactivación. Reactiva la cuenta y envía email."""
    _require_admin_or_jefe(current_user)

    ticket = db.query(ReactivationTicket).filter(ReactivationTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket no encontrado")

    if ticket.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este ticket ya fue procesado")

    user = db.query(User).filter(User.id == ticket.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    # Reactivar la cuenta
    user.is_active = True
    user.rejection_reason = None
    user.rejected_by = None
    user.rejected_at = None
    db.flush()

    # Actualizar el ticket
    ticket.status = "approved"
    ticket.admin_comment = data.comment
    ticket.reviewed_by = current_user.id
    ticket.reviewed_at = datetime.now(timezone.utc)

    db.flush()

    try:
        await send_reactivation_approved_email(
            email=ticket.email,
            name=f"{user.name_user} {user.last_name}",
        )
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al enviar el email de notificación. La reactivación no fue aplicada.",
        )

    db.commit()
    db.refresh(ticket)
    return _build_ticket_response(ticket)


@router.patch(
    "/reactivation-tickets/{ticket_id}/reject",
    response_model=ReactivationTicketResponse,
    summary="Rechazar solicitud de reactivación",
)
async def reject_reactivation(
    ticket_id: uuid.UUID,
    data: ProcessReactivationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReactivationTicketResponse:
    """Rechaza un ticket de reactivación con comentario obligatorio. Envía email."""
    _require_admin_or_jefe(current_user)

    ticket = db.query(ReactivationTicket).filter(ReactivationTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket no encontrado")

    if ticket.status != "pending":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Este ticket ya fue procesado")

    user = db.query(User).filter(User.id == ticket.user_id).first()

    ticket.status = "rejected"
    ticket.admin_comment = data.comment
    ticket.reviewed_by = current_user.id
    ticket.reviewed_at = datetime.now(timezone.utc)

    db.flush()

    if user:
        try:
            await send_reactivation_rejected_email(
                email=ticket.email,
                name=f"{user.name_user} {user.last_name}",
                reason=data.comment,
            )
        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al enviar el email de notificación. El rechazo no fue aplicado.",
            )

    db.commit()
    db.refresh(ticket)
    return _build_ticket_response(ticket)

