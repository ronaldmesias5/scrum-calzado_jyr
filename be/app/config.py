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
        description="URL de conexión PostgreSQL (formato: postgresql://user:pass@host:port/dbname)",
    )

    # ────────────────────────────
    # 🔐 JWT y Seguridad
    # ────────────────────────────
    SECRET_KEY: str = Field(
        ...,
        description='Clave secreta para firmar JWT tokens (generar con: python -c "import secrets; print(secrets.token_urlsafe(48))")',
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10

    # ────────────────────────────
    # 📧 Email
    # ────────────────────────────
    MAIL_SERVER: str = Field(
        ..., description="Servidor SMTP para enviar emails (ej: smtp.gmail.com)"
    )
    MAIL_PORT: int = 587
    MAIL_USERNAME: str = Field(..., description="Usuario/email SMTP")
    MAIL_PASSWORD: str = Field(..., description="Contraseña o app password SMTP")
    MAIL_FROM: str = "noreply@calzadojyr.com"
    MAIL_FROM_NAME: str = "CALZADO J&R"

    # ────────────────────────────
    # 🌐 URLs (REQUERIDAS para CORS)
    # ────────────────────────────
    FRONTEND_URL: str = Field(
        ..., description="URL del frontend para configurar CORS (ej: http://localhost:5173)"
    )

    # ────────────────────────────
    # 🏢 Ambiente
    # ────────────────────────────
    ENVIRONMENT: str = "development"  # development o production

    # ────────────────────────────
    # 📁 Archivos subidos
    # ────────────────────────────
    UPLOAD_DIR: str = Field(
        default="",
        description="Directorio para archivos subidos (vacío = be/uploads junto al código)",
    )

    # ────────────────────────────
    # 🤖 IA — Asistente (Fase 0, pgvector + LLM agnóstico)
    # ────────────────────────────
    AI_PROVIDER: str = Field(
        default="groq",
        description="Proveedor LLM: groq | gemini | ollama | openai",
    )
    AI_API_KEY: str = Field(
        default="",
        description="API key del proveedor LLM (vacío = IA deshabilitada hasta Fase 1)",
    )
    AI_MODEL: str = Field(
        default="openai/gpt-oss-20b",
        description="Modelo LLM (ej: openai/gpt-oss-20b, gemini-2.0-flash)",
    )
    AI_EMBEDDING_MODEL: str = Field(
        default="nomic-embed-text",
        description="Modelo de embeddings local ($0, 768 dims)",
    )
    AI_MAX_TOKENS: int = Field(
        default=512,
        description="Máx tokens por respuesta del LLM",
    )
    AI_EMBEDDING_DIM: int = Field(
        default=768,
        description="Dimensión del vector de embeddings (debe coincidir con ai_embeddings.embedding)",
    )

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
        """Validar que SECRET_KEY no es un valor de ejemplo conocido."""
        placeholder_keys = {
            "CAMBIA_ESTO_genera_con_secrets_token_urlsafe_48",
            "replace_with_a_secure_random_secret_for_dev_only",
        }
        if v in placeholder_keys or len(v) < 32:
            raise ValueError(
                "SECRET_KEY inválida. Debe cambiar el valor en .env y tener al menos 32 caracteres. "
                'Generar con: python -c "import secrets; print(secrets.token_urlsafe(48))"'
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

    @field_validator("AI_PROVIDER")
    @classmethod
    def validate_ai_provider(cls, v: str) -> str:
        """Validar que AI_PROVIDER es un proveedor soportado."""
        allowed = {"groq", "gemini", "ollama", "openai", "disabled"}
        if v not in allowed:
            raise ValueError(f"AI_PROVIDER inválido. Permitidos: {', '.join(sorted(allowed))}")
        return v

    @field_validator("AI_EMBEDDING_DIM")
    @classmethod
    def validate_ai_embedding_dim(cls, v: int) -> int:
        """Validar dimensión de embeddings."""
        if v not in (384, 768, 1024, 1536):
            raise ValueError("AI_EMBEDDING_DIM inválido. Permitidos: 384, 768, 1024, 1536")
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
