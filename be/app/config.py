"""
Módulo: config.py
Descripción: Configuración centralizada del backend usando Pydantic Settings.
¿Para qué? Cargar y validar TODAS las variables de entorno necesarias al iniciar la app.
¿Impacto? Sin este módulo, las variables de entorno se leerían sin validación,
          lo que podría causar errores silenciosos en tiempo de ejecución.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class Settings(BaseSettings):
    """Configuración de la aplicación cargada desde variables de entorno."""

    # ────────────────────────────
    # 🗄️ Base de datos
    # ────────────────────────────
    DATABASE_URL: str = Field(
        ...,
        description="URL de conexión PostgreSQL (formato: postgresql://user:pass@host:port/dbname)"
    )

    # ────────────────────────────
    # 🔐 JWT y Seguridad
    # ────────────────────────────
    SECRET_KEY: str = Field(
        ...,
        description="Clave secreta para firmar JWT tokens (generar con: python -c \"import secrets; print(secrets.token_urlsafe(48))\")"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ────────────────────────────
    # 📧 Email
    # ────────────────────────────
    MAIL_SERVER: str = Field(
        ...,
        description="Servidor SMTP para enviar emails (ej: smtp.gmail.com)"
    )
    MAIL_PORT: int = 587
    MAIL_USERNAME: str = Field(
        ...,
        description="Usuario/email SMTP"
    )
    MAIL_PASSWORD: str = Field(
        ...,
        description="Contraseña o app password SMTP"
    )
    MAIL_FROM: str = "noreply@calzadojyr.com"
    MAIL_FROM_NAME: str = "CALZADO J&R"

    # ────────────────────────────
    # 🌐 URLs (REQUERIDAS para CORS)
    # ────────────────────────────
    FRONTEND_URL: str = Field(
        ...,
        description="URL del frontend para configurar CORS (ej: http://localhost:5173)"
    )
    
    # ────────────────────────────
    # 🏢 Ambiente
    # ────────────────────────────
    ENVIRONMENT: str = "development"  # development o production

    @field_validator("DATABASE_URL")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Validar que DATABASE_URL es válida."""
        if not v or not v.startswith(("postgresql://", "postgres://")):
            raise ValueError(
                "DATABASE_URL inválida. Formato: postgresql://user:password@host:port/dbname"
            )
        return v

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Validar que SECRET_KEY no es el valor de ejemplo."""
        if v == "CAMBIA_ESTO_genera_con_secrets_token_urlsafe_48" or len(v) < 32:
            raise ValueError(
                "SECRET_KEY inválida. Debe cambiar el valor en .env y tener al menos 32 caracteres. "
                "Generar con: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
            )
        return v

    @field_validator("FRONTEND_URL")
    @classmethod
    def validate_frontend_url(cls, v: str) -> str:
        """Validar que FRONTEND_URL es válida."""
        if not v or not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError(
                "FRONTEND_URL inválida. Formato: http://localhost:5173 o https://ejemplo.com"
            )
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
