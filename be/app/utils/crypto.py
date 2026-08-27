"""
Cifrado simétrico para secretos en reposo (p. ej. claves de aplicación de correo).

Usa Fernet con clave derivada de SECRET_KEY (SHA-256). El token resultante
es seguro de almacenar en la base de datos y solo es descifrable con el
mismo SECRET_KEY del entorno.
"""

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken

from app.config import settings


def _fernet() -> Fernet:
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(key))


def encrypt_secret(plain: str) -> str:
    """Cifra un secreto y devuelve el token como texto."""
    return _fernet().encrypt(plain.encode()).decode()


def decrypt_secret(token: str) -> str:
    """Descifra un token producido por encrypt_secret. Lanza ValueError si no corresponde."""
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken as exc:
        raise ValueError("Secreto cifrado inválido o SECRET_KEY cambiada") from exc
