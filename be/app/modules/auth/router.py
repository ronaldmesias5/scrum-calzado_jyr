"""
Archivo: be/app/modules/auth/router.py
Descripción: Router FastAPI con endpoints de autenticación y gestión de contraseñas.

¿Qué?
  Define 6 endpoints públicos/protegidos para autenticación:
  - POST /register: Registro de nuevos clientes (público)
  - POST /login: Login con email/password → retorna access/refresh tokens
  - POST /refresh: Renovar access token usando refresh token
  - POST /change-password: Cambiar contraseña (requiere auth)
  - POST /forgot-password: Solicitar recuperación de contraseña (público)
  - POST /reset-password: Restablecer contraseña con token (público)
  
¿Para qué?
  - Permitir registro, login y gestión de sesiones
  - Implementar flujo completo de recuperación de contraseña
  - Delegar lógica de negocio a auth/service.py (separación de capas)
  
¿Impacto?
  CRÍTICO — Sin estos endpoints, usuarios no pueden ingresar al sistema.
  Modificar /login rompe: frontend LoginPage, todos los flujos de auth.
  Modificar /register rompe: RegisterPage, onboarding de nuevos usuarios.
  Dependencias: auth/service.py (lógica de negocio), auth/schemas.py,
               dependencies.py (get_db, get_current_user)
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    MessageResponse,
    RefreshTokenRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.modules.auth import service as auth_service

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["auth"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo cliente",
)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
) -> UserResponse:
    """Registra un nuevo cliente. La cuenta queda pendiente de validación por el admin."""
    user = auth_service.register_user(db=db, user_data=user_data)
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        last_name=user.last_name,
        phone=user.phone,
        identity_document=user.identity_document,
        identity_document_type_id=user.identity_document_type_id,
        identity_document_type_name=user.identity_document_type.name if user.identity_document_type else None,
        is_active=user.is_active,
        is_validated=user.is_validated,
        must_change_password=user.must_change_password,
        role_name=user.role.name if user.role else None,
        business_name=user.business_name,
        occupation=user.occupation,
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesión",
)
def login(
    login_data: UserLogin,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Autentica un usuario y retorna tokens JWT."""
    return auth_service.login_user(db=db, login_data=login_data)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Renovar access token",
)
def refresh_token(
    token_data: RefreshTokenRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Genera nuevos tokens usando un refresh token válido."""
    return auth_service.refresh_access_token(
        db=db,
        refresh_token=token_data.refresh_token,
    )


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Cambiar contraseña (usuario autenticado)",
)
def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Cambia la contraseña del usuario autenticado."""
    auth_service.change_password(db=db, user=current_user, password_data=password_data)
    return MessageResponse(message="Contraseña actualizada exitosamente")


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Solicitar recuperación de contraseña",
)
async def forgot_password(
    request_data: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Solicita un email de recuperación de contraseña."""
    await auth_service.request_password_reset(db=db, email=request_data.email)
    return MessageResponse(
        message="Si el email está registrado, recibirás un enlace de recuperación"
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Restablecer contraseña con token",
)
def reset_password(
    reset_data: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Restablece la contraseña usando un token de recuperación."""
    auth_service.reset_password(db=db, reset_data=reset_data)
    return MessageResponse(message="Contraseña restablecida exitosamente")

