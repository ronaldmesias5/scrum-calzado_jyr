# ════════════════════════════════════════
# 📄 Utilidades de seguridad para hashing de contraseñas y manejo de tokens JWT
# ════════════════════════════════════════

from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.config import settings

# bcrypt solo considera los primeros 72 bytes de la contraseña.
_BCRYPT_MAX_BYTES = 72


def hash_password(password: str) -> str:
    """Hashea una contraseña en texto plano usando bcrypt."""
    secret = password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(secret, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si una contraseña en texto plano coincide con su hash."""
    secret = plain_password.encode("utf-8")[:_BCRYPT_MAX_BYTES]
    try:
        return bcrypt.checkpw(secret, hashed_password.encode("utf-8"))
    except ValueError:
        # Hash corrupto o con formato inesperado: se trata como no coincidente.
        return False


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
            minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
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
