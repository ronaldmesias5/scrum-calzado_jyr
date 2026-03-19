"""
Módulo: config.py
Descripción: Configuración centralizada del backend usando Pydantic Settings.
¿Para qué? Cargar y validar TODAS las variables de entorno necesarias al iniciar la app.
¿Impacto? Sin este módulo, las variables de entorno se leerían sin validación,
          lo que podría causar errores silenciosos en tiempo de ejecución.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración de la aplicación cargada desde variables de entorno."""

    # ────────────────────────────
    # 🗄️ Base de datos
    # ────────────────────────────
    DATABASE_URL: str

    # ────────────────────────────
    # 🔐 JWT y Seguridad
    # ────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ────────────────────────────
    # 📧 Email
    # ────────────────────────────
    MAIL_SERVER: str = "smtp.example.com"
    MAIL_PORT: int = 587
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "noreply@calzadojyr.com"
    MAIL_FROM_NAME: str = "CALZADO J&R"

    # ────────────────────────────
    # 🌐 URLs
    # ────────────────────────────
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
