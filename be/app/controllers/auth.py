"""Controlador para autenticación: wrappers que delegan en `services.auth`.
"""
from typing import Annotated

from sqlalchemy.orm import Session

from app.schemas.auth import UserCreate, UserLogin, ChangePasswordRequest, ResetPasswordRequest, TokenResponse
from app.models.user import User
from app.services import auth as auth_service


async def register_user(db: Annotated[Session, ...], user_data: UserCreate) -> User:
    """Registra un usuario (delegado a services.auth.register_user)."""
    return await auth_service.register_user(db=db, user_data=user_data)


def login_user(db: Annotated[Session, ...], login_data: UserLogin) -> TokenResponse:
    """Autentica y retorna tokens (delegado a services.auth.login_user)."""
    return auth_service.login_user(db=db, login_data=login_data)


def logout_from_all_devices(db: Annotated[Session, ...], user: User) -> None:
    return auth_service.logout_from_all_devices(db, user)


def refresh_access_token(db: Annotated[Session, ...], refresh_token: str) -> TokenResponse:
    return auth_service.refresh_access_token(db, refresh_token)


def change_password(db: Annotated[Session, ...], user: User, password_data: ChangePasswordRequest) -> None:
    return auth_service.change_password(db, user, password_data)


async def request_password_reset(db: Annotated[Session, ...], email: str) -> None:
    return await auth_service.request_password_reset(db, email)


def reset_password(db: Annotated[Session, ...], reset_data: ResetPasswordRequest) -> None:
    return auth_service.reset_password(db, reset_data)


async def request_new_invitation(db: Annotated[Session, ...], email: str) -> None:
    return await auth_service.request_new_invitation(db, email)
