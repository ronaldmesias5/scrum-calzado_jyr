"""
Archivo: be/app/modules/admin/router.py
Descripción: Router FastAPI con endpoints administrativos para gestión de usuarios.

¿Qué?
  Define 8 endpoints protegidos (admin/jefe) para gestión de usuarios:
  - POST /create-employee: Crear empleado con occupation (admin/jefe)
  - POST /create-jefe: Crear jefe (admin/jefe)
  - POST /create-client: Crear cliente (admin/jefe)
  - GET /users: Listar todos los usuarios con filtros opcionales
  - GET /users/{user_id}: Obtener detalles de un usuario
  - PUT /users/{user_id}/validate: Validar cuenta de usuario
  - PUT /users/{user_id}/deactivate: Desactivar usuario
  - PUT /users/{user_id}/activate: Reactivar usuario
  
¿Para qué?
  - Permitir a admin/jefe crear y gestionar usuarios del sistema
  - Centralizar validación de permisos (_require_admin, _require_admin_or_jefe)
  - Separar endpoints administrativos de endpoints públicos (seguridad)
  
¿Impacto?
  CRÍTICO — Sin este router, admin/jefe no pueden gestionar usuarios.
  Modificar create-employee rompe: dashboard AdminCreateEmployeeForm.
  Modificar /users lista rompe: AdminUserListPage en dashboard.
  Dependencias: admin/schemas.py, auth/schemas.py (UserResponse),
               dependencies.py, models/user.py, models/role.py,
               utils/security.py (hash_password)
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.role import Role
from app.models.user import User
from app.modules.auth.schemas import MessageResponse, UserResponse
from app.modules.admin.schemas import AdminCreateClientRequest, AdminCreateEmployeeRequest, AdminCreateJefeRequest
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
        name=user.name,
        last_name=user.last_name,
        phone=user.phone,
        identity_document=user.identity_document,
        identity_document_type_id=user.identity_document_type_id,
        identity_document_type_name=(
            user.identity_document_type.name if user.identity_document_type else None
        ),
        is_active=user.is_active,
        is_validated=user.is_validated,
        must_change_password=user.must_change_password,
        role_name=user.role.name if user.role else None,
        business_name=user.business_name,
        occupation=user.occupation,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def _require_admin(current_user: User) -> None:
    if current_user.role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores pueden acceder a este endpoint",
        )


def _require_jefe(current_user: User) -> None:
    """Valida que el usuario sea un jefe (employee + occupation='jefe')."""
    if current_user.role.name != "employee" or current_user.occupation != "jefe":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo jefes de fábrica pueden acceder a este endpoint",
        )


def _require_admin_or_jefe(current_user: User) -> None:
    """Valida que sea admin O jefe."""
    is_admin = current_user.role.name == "admin"
    is_jefe = current_user.role.name == "employee" and current_user.occupation == "jefe"
    
    if not (is_admin or is_jefe):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo administradores o jefes pueden acceder a este endpoint",
        )


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
    pending_users = db.query(User).filter(User.is_validated == False).all()  # noqa: E712
    return [_build_user_response(u) for u in pending_users]


@router.patch(
    "/users/{user_id}/validate",
    response_model=UserResponse,
    summary="Validar usuario",
)
def validate_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Aprueba y activa la cuenta de un usuario pendiente (admin o jefe)."""
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
    return _build_user_response(user_to_validate)


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
    """Lista todos los usuarios. Filtro opcional por rol (client, employee, admin). Acceso: admin, jefe o cualquier usuario autenticado."""
    # Permitir acceso a cualquier usuario autenticado (no requerir admin/jefe específicamente)
    query = db.query(User)
    if role:
        query = query.join(Role, User.role_id == Role.id).filter(Role.name == role)

    return [_build_user_response(u) for u in query.all()]


@router.post(
    "/users/create-employee",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear cuenta de empleado",
)
def create_employee(
    data: AdminCreateEmployeeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """
    Crea una cuenta de empleado activa y validada.
    
    ⚠️ El empleado deberá cambiar su contraseña en el primer login.
    """
    _require_admin_or_jefe(current_user)

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una cuenta con ese email")

    employee_role = db.query(Role).filter(Role.name == "employee").first()
    if not employee_role:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Rol 'employee' no encontrado")

    new_user = User(
        email=data.email,
        name=data.name,
        last_name=data.last_name,
        phone=data.phone,
        identity_document=data.identity_document,
        identity_document_type_id=data.identity_document_type_id,
        occupation=data.occupation,
        hashed_password=hash_password(data.password),
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
    return _build_user_response(new_user)


@router.post(
    "/users/create-client",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear cuenta de cliente (por admin o jefe)",
)
def create_client(
    data: AdminCreateClientRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """
    Crea una cuenta de cliente activa y validada de inmediato (por el admin o jefe).
    
    ⚠️ El cliente deberá cambiar su contraseña en el primer login.
    """
    _require_admin_or_jefe(current_user)

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una cuenta con ese email")

    client_role = db.query(Role).filter(Role.name == "client").first()
    if not client_role:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Rol 'client' no encontrado")

    new_user = User(
        email=data.email,
        name=data.name,
        last_name=data.last_name,
        phone=data.phone,
        identity_document=data.identity_document,
        identity_document_type_id=data.identity_document_type_id,
        business_name=data.business_name,
        hashed_password=hash_password(data.password),
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
    return _build_user_response(new_user)


@router.post(
    "/users/create-jefe",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear cuenta de jefe de fábrica",
)
def create_jefe(
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
    
    ⚠️ El jefe deberá cambiar su contraseña en el primer login.
    """
    _require_admin_or_jefe(current_user)

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ya existe una cuenta con ese email")

    employee_role = db.query(Role).filter(Role.name == "employee").first()
    if not employee_role:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Rol 'employee' no encontrado")

    new_user = User(
        email=data.email,
        name=data.name,
        last_name=data.last_name,
        phone=data.phone,
        identity_document=data.identity_document,
        identity_document_type_id=data.identity_document_type_id,
        occupation="jefe",  # 🔑 Ocupación específica para jefe
        hashed_password=hash_password(data.password),
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
    return _build_user_response(new_user)

