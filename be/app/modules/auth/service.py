"""
Archivo: app/modules/auth/service.py
Descripción: Lógica de negocio (business logic) para autenticación.

¿Qué?
  Centraliza las operaciones de autenticación:
  - register_user() → Crear nuevo usuario cliente (sin validar)
  - login_user() → Validar credenciales y generar JWT tokens
  - change_password() → Cambiar contraseña de usuario autenticado
  - forgot_password() → Generar token para reset remoto
  - reset_password() → Resetear contraseña con token

¿Para qué?
  Separar la LÓGICA DE NEGOCIO (qué hacer) del TRANSPORTE HTTP (cómo exponerlo).
  Permite reutilizar esta lógica desde diferentes routers o scripts.
  Facilita testing unitario sin need de HTTP.

¿Impacto?
  CRÍTICO para seguridad. Cambios aquí afectan:
  - Cómo se validan contraseñas
  - Cuándo se crean tokens
  - Qué datos se guardan en la BD
  
  Error aquí = autenticación rota para TODO el sistema.
  
  DEPENDENCIAS:
  - sqlalchemy.orm.Session (conexión a BD)
  - app.models.user.User (modelo de usuario)
  - app.utils.security (hashing, JWT)
"""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.password_reset_token import PasswordResetToken
from app.models.role import Role
from app.models.user import User
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserLogin,
)
from app.utils.email import send_password_reset_email
from app.core.logging_config import audit_logger
from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

def _redact_email(email: str) -> str:
    """user@example.com -> us***@example.com para privacidad en logs."""
    try:
        parts = email.split("@")
        if len(parts) != 2: return "invalid-email"
        name, domain = parts
        return f"{name[:2]}***@{domain}"
    except:
        return "redacted-error"


def register_user(db: Session, user_data: UserCreate) -> User:
    """Registra un nuevo cliente. Queda con is_active=False hasta que un admin valide."""
    stmt = select(User).where(User.email == user_data.email)
    existing_user = db.execute(stmt).scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado",
        )

    stmt = select(Role).where(Role.name_role == "client")
    client_role = db.execute(stmt).scalar_one_or_none()

    if not client_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error de configuración: rol 'client' no encontrado",
        )

    new_user = User(
        email=user_data.email,
        name_user=user_data.name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        identity_document=user_data.identity_document,
        identity_document_type_id=user_data.identity_document_type_id,
        business_name=user_data.business_name,
        occupation=user_data.occupation,
        hashed_password=hash_password(user_data.password),
        role_id=client_role.id,
        is_active=False,
        is_validated=False,
        accepted_terms=user_data.accepted_terms,
        terms_accepted_at=datetime.now(timezone.utc) if user_data.accepted_terms else None,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def login_user(db: Session, login_data: UserLogin) -> TokenResponse:
    """Autentica un usuario y retorna tokens JWT."""
    stmt = select(User).where(User.email == login_data.email)
    user = db.execute(stmt).scalar_one_or_none()

    if not user or not verify_password(login_data.password, user.hashed_password):
        audit_logger.warning(f"Intento de login fallido: {_redact_email(login_data.email)} (credenciales incorrectas)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        audit_logger.warning(f"Intento de login bloqueado: {_redact_email(login_data.email)} (cuenta inactiva)")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta pendiente de validación por el administrador.",
        )

    audit_logger.info(f"Login exitoso: {_redact_email(user.email)}")

    access_token = create_access_token(data={"sub": user.email, "version": user.session_version})
    refresh_token = create_refresh_token(data={"sub": user.email, "version": user.session_version})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
    )


def logout_from_all_devices(db: Session, user: User) -> None:
    """Invalida todas las sesiones activas incrementando la versión de sesión."""
    user.session_version += 1
    db.commit()
    audit_logger.info(f"Cierre de sesión global: {_redact_email(user.email)}")


def refresh_access_token(db: Session, refresh_token: str) -> TokenResponse:
    """Genera un nuevo access token usando un refresh token válido."""
    payload = decode_token(refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token de renovación es incorrecto o ha expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email: str | None = payload.get("sub")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sin identificador de usuario",
        )

    stmt = select(User).where(User.email == email)
    user = db.execute(stmt).scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o cuenta desactivada",
        )

    new_access = create_access_token(data={"sub": user.email, "version": user.session_version})
    new_refresh = create_refresh_token(data={"sub": user.email, "version": user.session_version})

    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


def change_password(db: Session, user: User, password_data: ChangePasswordRequest) -> None:
    """Cambia la contraseña de un usuario autenticado."""
    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta",
        )

    user.hashed_password = hash_password(password_data.new_password)
    db.commit()
    audit_logger.info(f"Cambio de contraseña exitoso: {_redact_email(user.email)}")


async def request_password_reset(db: Session, email: str) -> None:
    """Solicita un email de recuperación de contraseña (previene enumeración de usuarios)."""
    stmt = select(User).where(User.email == email)
    user = db.execute(stmt).scalar_one_or_none()

    if not user:
        return

    reset_token = str(uuid.uuid4())

    token_record = PasswordResetToken(
        user_id=user.id,
        token=reset_token,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )

    db.add(token_record)
    db.commit()

    await send_password_reset_email(email=user.email, token=reset_token)
    audit_logger.info(f"Solicitud de recuperación de contraseña: {_redact_email(user.email)}")


def reset_password(db: Session, reset_data: ResetPasswordRequest) -> None:
    """Restablece la contraseña usando un token de recuperación."""
    stmt = select(PasswordResetToken).where(
        PasswordResetToken.token == reset_data.token
    )
    token_record = db.execute(stmt).scalar_one_or_none()

    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token de recuperación es incorrecto o no existe",
        )

    if token_record.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este token de recuperación ya fue utilizado",
        )

    if token_record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El token de recuperación ha expirado. Solicite uno nuevo.",
        )

    stmt = select(User).where(User.id == token_record.user_id)
    user = db.execute(stmt).scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario no encontrado",
        )

    user.hashed_password = hash_password(reset_data.new_password)
    token_record.used = True
    db.commit()
    audit_logger.info(f"Restablecimiento de contraseña exitoso (vía token): {_redact_email(user.email)}")
