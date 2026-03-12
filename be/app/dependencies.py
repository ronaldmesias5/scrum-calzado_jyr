"""
Archivo: be/app/dependencies.py
Descripción: Dependencias inyectables de FastAPI para gestión de sesiones y autenticación.

¿Qué?
  Contiene funciones para inyección de dependencias de FastAPI:
  - get_db(): Provee sesión de BD (SessionLocal) con ciclo de vida seguro
  - get_current_user(): Extrae usuario autenticado desde JWT token
  - _require_admin(): Valida que el usuario sea admin
  - _require_jefe(): Valida que el usuario sea jefe (occupation)
  - _require_admin_or_jefe(): Valida cualquiera de los dos
  
¿Para qué?
  - Centralizar lógica de autenticación y autorización (DRY)
  - Evitar duplicar validaciones JWT en cada endpoint
  - Garantizar cierre correcto de sesiones BD (evitar leaks)
  - Implementar RBAC (Role-Based Access Control)
  
¿Impacto?
  CRÍTICO — Sin este módulo, todos los endpoints protegidos fallan.
  Modificar get_current_user() rompe: TODOS los endpoints que requieren auth.
  Modificar _require_admin() rompe: endpoints de admin/router.py
  Modificar _require_jefe() rompe: endpoints de dashboard_jefe/router.py
  Dependencias: database.py (SessionLocal), utils/security.py (decode_token),
               models/user.py, OAuth2PasswordBearer
"""

from collections.abc import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.utils.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_db() -> Generator[Session, None, None]:
    """Provee una sesión de base de datos para cada request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Obtiene el usuario autenticado a partir del access token JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(token)
    if not payload:
        raise credentials_exception

    if payload.get("type") != "access":
        raise credentials_exception

    email: str | None = payload.get("sub")
    if not email:
        raise credentials_exception

    stmt = select(User).where(User.email == email)
    user = db.execute(stmt).scalar_one_or_none()

    if not user:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cuenta desactivada",
        )

    return user
