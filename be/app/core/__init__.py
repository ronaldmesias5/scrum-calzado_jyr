"""Core package: Configuración, base de datos, dependencias y seguridad."""

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.dependencies import get_current_user, get_db, oauth2_scheme

__all__ = [
    "settings",
    "Base",
    "SessionLocal",
    "engine",
    "get_current_user",
    "get_db",
    "oauth2_scheme",
]