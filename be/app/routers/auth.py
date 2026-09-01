"""
Archivo: be/app/routers/auth.py
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

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.config import settings
from app.models.user import User
from app.models.reactivation_ticket import ReactivationTicket
from app.schemas.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    MessageResponse,
    ReactivationRequest,
    RefreshTokenRequest,
    RequestNewInvitationRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.controllers import auth as auth_service

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
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
) -> UserResponse:
    """Registra un nuevo cliente. La cuenta queda activa inmediatamente y recibe un email de confirmación."""
    user = await auth_service.register_user(db=db, user_data=user_data)
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name_user,
        last_name=user.last_name,
        phone=user.phone,
        identity_document=user.identity_document,
        identity_document_type_id=user.identity_document_type_id,
        identity_document_type_name=user.identity_document_type.name_type_document if user.identity_document_type else None,
        is_active=user.is_active,
        is_validated=user.is_validated,
        must_change_password=user.must_change_password,
        role_name=user.role.name_role if user.role else None,
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
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Autentica un usuario y retorna tokens JWT y los establece en HttpOnly cookies."""
    token_response = auth_service.login_user(db=db, login_data=login_data)
    response.set_cookie(
        key="access_token",
        value=token_response.access_token,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
    )
    return token_response


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Renovar access token",
)
def refresh_token(
    token_data: RefreshTokenRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Genera nuevos tokens usando un refresh token válido y establece la cookie."""
    token_response = auth_service.refresh_access_token(
        db=db,
        refresh_token=token_data.refresh_token,
    )
    response.set_cookie(
        key="access_token",
        value=token_response.access_token,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
    )
    return token_response

@router.post(
    "/logout",
    summary="Cerrar sesión",
)
def logout(response: Response):
    """Cierra la sesión eliminando la cookie HttpOnly."""
    response.delete_cookie(key="access_token", samesite="lax", httponly=True)
    return {"message": "Sesión cerrada exitosamente"}


@router.post(
    "/logout-all",
    summary="Cerrar sesión en todos los dispositivos",
)
def logout_all(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Invalida todas las sesiones activas y elimina la cookie local."""
    auth_service.logout_from_all_devices(db=db, user=current_user)
    response.delete_cookie(key="access_token", samesite="lax", httponly=True)
    return {"message": "Has cerrado sesión en todos tus dispositivos"}


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


@router.post(
    "/request-reactivation",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Solicitar reactivación de cuenta (público)",
)
async def request_reactivation(
    data: ReactivationRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Solicita la reactivación de una cuenta inactiva/suspendida.

    El usuario debe tener una cuenta existente en estado inactivo.
    Se genera un ticket que el admin revisará en el panel de gestión.
    """
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró una cuenta con ese email",
        )

    if user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta ya está activa. Si necesitas ayuda, inicia sesión o recupera tu contraseña.",
        )

    if user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta cuenta ha sido eliminada y no puede ser reactivada.",
        )

    # Verificar que no haya un ticket pendiente para este usuario
    existing = (
        db.query(ReactivationTicket)
        .filter(
            ReactivationTicket.user_id == user.id,
            ReactivationTicket.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya tienes una solicitud de reactivación pendiente. Espera a que sea revisada.",
        )

    ticket = ReactivationTicket(
        user_id=user.id,
        email=data.email,
        reason=data.reason,
        phone=data.phone,
        identity_document=data.identity_document,
        evidence_url=data.evidence_url,
        status="pending",
    )

    db.add(ticket)
    db.commit()

    return MessageResponse(
        message="Tu solicitud de reactivación ha sido registrada. Recibirás una respuesta por correo electrónico."
    )


@router.post(
    "/request-new-invitation",
    response_model=MessageResponse,
    summary="Solicitar nueva invitación (contraseña temporal expirada)",
)
async def request_new_invitation(
    data: RequestNewInvitationRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Permite a un usuario solicitar una nueva contraseña temporal cuando su
    invitación anterior ha expirado. Endpoint público (sin auth).

    Por seguridad, siempre responde con el mismo mensaje sin revelar si el
    email existe o si la invitación estaba realmente expirada.
    """
    await auth_service.request_new_invitation(db=db, email=data.email)
    return MessageResponse(
        message="Si tu invitación había expirado, recibirás un nuevo email con tus credenciales."
    )


# ────────────────────────────
# 📧 Verificación de email
# ────────────────────────────


@router.get(
    "/verify-email",
    response_model=MessageResponse,
    summary="Verificar correo electrónico con token",
)
async def verify_email(
    token: str,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Verifica el correo electrónico del usuario usando el token enviado por email.
    Endpoint público (sin auth) — el token sirve como autenticación.
    """
    from datetime import datetime, timezone
    from app.models.email_verification_token import EmailVerificationToken

    # Buscar el token
    token_record = (
        db.query(EmailVerificationToken)
        .filter(EmailVerificationToken.token == token)
        .first()
    )

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token de verificación inválido o no encontrado.",
        )

    if token_record.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este token de verificación ya ha sido utilizado.",
        )

    if token_record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token de verificación ha expirado. Solicita uno nuevo.",
        )

    # Marcar token como usado
    token_record.used = True
    db.commit()

    return MessageResponse(
        message="Correo electrónico verificado exitosamente. Ya puedes iniciar sesión."
    )


class ResendVerificationRequest(BaseModel):
    """Schema para reenviar email de verificación."""
    email: EmailStr


@router.post(
    "/resend-verification",
    response_model=MessageResponse,
    summary="Reenviar email de verificación",
)
async def resend_verification(
    data: ResendVerificationRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """
    Reenvía el email de verificación. Por seguridad, siempre responde con
    el mismo mensaje sin revelar si el email existe.
    """
    import uuid
    from datetime import timedelta
    from app.models.email_verification_token import EmailVerificationToken
    from app.utils.email import send_verification_email

    stmt = select(User).where(User.email == data.email)
    user = db.execute(stmt).scalar_one_or_none()

    if not user:
        # Por seguridad, no revelar si el email existe
        return MessageResponse(
            message="Si tu correo está registrado, recibirás un enlace de verificación."
        )

    # Invalidar tokens anteriores no usados
    old_tokens = (
        db.query(EmailVerificationToken)
        .filter(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.used == False,
        )
        .all()
    )
    for old_token in old_tokens:
        old_token.used = True
    db.commit()

    # Generar nuevo token
    verification_token = str(uuid.uuid4())
    token_record = EmailVerificationToken(
        user_id=user.id,
        token=verification_token,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.add(token_record)
    db.commit()

    # Enviar email (no bloquea)
    try:
        await send_verification_email(
            email=user.email,
            name=f"{user.name_user} {user.last_name}",
            token=verification_token,
        )
    except Exception:
        pass  # No revelar errores al usuario

    return MessageResponse(
        message="Si tu correo está registrado, recibirás un enlace de verificación."
    )

