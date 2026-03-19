"""
Archivo: be/app/modules/users/router.py
Descripción: Router FastAPI con endpoints para gestión del perfil del usuario autenticado.

¿Qué?
  Define 1 endpoint protegido:
  - GET /me: Obtener perfil completo del usuario autenticado (requiere JWT)
  
¿Para qué?
  - Permitir al usuario consultar sus propios datos
  - Proveer información para header del dashboard (nombre, avatar)
  - Centralizar lógica de perfil de usuario (separado de admin)
  
¿Impacto?
  MEDIO — Dashboard AdminHeader depende de /me para mostrar nombre/avatar.
  Modificar UserResponse rompe: frontend context/AuthContext.tsx,
  AdminHeader.tsx, cualquier componente que use useAuth().
  Dependencias: dependencies.py (get_current_user),
               auth/schemas.py (UserResponse), models/user.py
"""

from fastapi import APIRouter, Depends

from app.core.dependencies import get_current_user
from app.models.user import User
from app.modules.auth.schemas import UserResponse

router = APIRouter(
    prefix="/api/v1/users",
    tags=["users"],
)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Obtener perfil del usuario autenticado",
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Retorna los datos del usuario autenticado."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        identity_document=current_user.identity_document,
        is_active=current_user.is_active,
        is_validated=current_user.is_validated,
        must_change_password=current_user.must_change_password,
        role_name=current_user.role.name if current_user.role else None,
        business_name=current_user.business_name,
        occupation=current_user.occupation,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
    )

