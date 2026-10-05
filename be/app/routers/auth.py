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

from fastapi import APIRouter, Depends, HTTPException, Request, status, Response
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
)
from app.controllers import auth as auth_service
from app.logging_config import audit_logger
from app.services.auth import _redact_email

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["auth"],
)


@router.post(
    "/register",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar nuevo cliente",
)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Registra un nuevo cliente con respuesta idéntica exista o no el email (anti-enumeración).

    Si el email ya está registrado no se crea nada ni se revela la existencia:
    se responde el mismo mensaje genérico 201 que en el caso exitoso.
    """
    await auth_service.register_user(db=db, user_data=user_data)
    return MessageResponse(
        message=(
            "Si el email estaba disponible, tu cuenta ha sido creada y recibirás "
            "un correo de verificación para activarla. Si ya tenías una cuenta, "
            "no se ha realizado ningún cambio."
        )
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesión",
)
def login(
    login_data: UserLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Autentica un usuario y retorna tokens JWT y los establece en HttpOnly cookies."""
    client_ip = request.client.host if request.client else "unknown"
    token_response = auth_service.login_user(
        db=db, login_data=login_data, client_ip=client_ip
    )
    response.set_cookie(
        key="access_token",
        value=token_response.access_token,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
    )
    response.set_cookie(
        key="refresh_token",
        value=token_response.refresh_token,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
    )
    return token_response


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Renovar access token",
)
def refresh_token(
    request: Request,
    response: Response,
    token_data: RefreshTokenRequest | None = None,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Genera nuevos tokens usando un refresh token válido y establece las cookies.

    Acepta el refresh token en el body (app móvil) o en la cookie HttpOnly
    `refresh_token` (frontend web, inaccesible para JavaScript).
    """
    body_refresh = token_data.refresh_token if token_data is not None else None
    cookie_refresh = request.cookies.get("refresh_token")
    refresh = body_refresh or cookie_refresh
    if not refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token no proporcionado",
        )
    token_response = auth_service.refresh_access_token(
        db=db,
        refresh_token=refresh,
    )
    response.set_cookie(
        key="access_token",
        value=token_response.access_token,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
    )
    response.set_cookie(
        key="refresh_token",
        value=token_response.refresh_token,
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT == "production",
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
    )
    return token_response

@router.post(
    "/logout",
    summary="Cerrar sesión",
)
def logout(response: Response):
    """Cierra la sesión eliminando las cookies HttpOnly."""
    response.delete_cookie(key="access_token", samesite="lax", httponly=True)
    response.delete_cookie(key="refresh_token", samesite="lax", httponly=True)
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

    Respuesta idéntica en todos los casos (anti-enumeración de usuarios):
    no revela si el email existe, si la cuenta está activa/eliminada o si ya
    hay un ticket pendiente. El ticket solo se crea cuando el caso es elegible.
    """
    user = db.query(User).filter(User.email == data.email).first()

    if user is None:
        audit_logger.info(
            f"Reactivación solicitada para email inexistente: {_redact_email(data.email)}"
        )
    elif user.is_active:
        audit_logger.info(
            f"Reactivación solicitada para cuenta ya activa: {_redact_email(data.email)}"
        )
    elif user.deleted_at is not None:
        audit_logger.info(
            f"Reactivación solicitada para cuenta eliminada: {_redact_email(data.email)}"
        )
    else:
        existing = (
            db.query(ReactivationTicket)
            .filter(
                ReactivationTicket.user_id == user.id,
                ReactivationTicket.status == "pending",
            )
            .first()
        )
        if existing:
            audit_logger.info(
                f"Reactivación solicitada con ticket ya pendiente: {_redact_email(data.email)}"
            )
        else:
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
            audit_logger.info(
                f"Solicitud de reactivación registrada: {_redact_email(data.email)}"
            )

    return MessageResponse(
        message=(
            "Si existe una cuenta inactiva con ese email, recibirás una "
            "respuesta por correo electrónico."
        )
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

