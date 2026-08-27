"""
Archivo: be/app/utils/security.py
Descripción: Utilidades de seguridad para hashing de contraseñas y manejo de tokens JWT.

¿Qué?
  Provee 5 funciones para seguridad:
  - hash_password(): Hashea contraseñas con bcrypt
  - verify_password(): Verifica contraseña vs hash
  - create_access_token(): Genera JWT access token (corta duración)
  - create_refresh_token(): Genera JWT refresh token (larga duración)
  - decode_token(): Decodifica y valida JWT
  
¿Para qué?
  - Proteger contraseñas en BD (nunca almacenar texto plano)
  - Implementar autenticación JWT stateless (sin sesiones en BD)
  - Diferenciar tokens de acceso (15 min) de tokens de refresco (7 días)
  - Centralizar lógica de seguridad (DRY, auditable)
  
¿Impacto?
  CRÍTICO — Base de seguridad del sistema. Error aquí compromete TODA auth.
  Modificar hash_password() rompe: login de usuarios existentes (hashes incompatibles).
  Modificar decode_token() rompe: validación de JWT en TODOS los endpoints protegidos.
  Dependencias: config.py (SECRET_KEY, ALGORITHM), passlib, python-jose,
               auth/service.py (register, login), dependencies.py (get_current_user)
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hashea una contraseña en texto plano usando bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si una contraseña en texto plano coincide con su hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Crea un token JWT de acceso (access token)."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def create_refresh_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Crea un token JWT de refresco (refresh token)."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def decode_token(token: str) -> dict | None:
    """Decodifica y verifica un token JWT."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )
        return payload
    except JWTError:
        return None
