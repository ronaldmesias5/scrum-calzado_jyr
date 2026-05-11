"""
Archivo: be/tests/test_config.py
Descripción: Tests para validación de configuración (Pydantic Settings).
"""

import pytest
from pydantic import ValidationError

from app.core.config import Settings


class TestSettingsValidation:
    """Tests para validación de variables de entorno."""

    def test_database_url_must_start_with_postgresql(self):
        """DATABASE_URL debe comenzar con postgresql:// o postgres://."""
        with pytest.raises(ValueError, match="DATABASE_URL"):
            Settings(
                DATABASE_URL="mysql://user:pass@host/db",
                SECRET_KEY="a" * 32,
                FRONTEND_URL="http://localhost:5173",
                MAIL_USERNAME="test@test.com",
                MAIL_PASSWORD="pass",
                MAIL_SERVER="smtp.test.com",
            )

    def test_secret_key_must_be_at_least_32_chars(self):
        """SECRET_KEY debe tener al menos 32 caracteres."""
        with pytest.raises(ValueError, match="SECRET_KEY"):
            Settings(
                DATABASE_URL="postgresql://user:pass@host/db",
                SECRET_KEY="corta",
                FRONTEND_URL="http://localhost:5173",
                MAIL_USERNAME="test@test.com",
                MAIL_PASSWORD="pass",
                MAIL_SERVER="smtp.test.com",
            )

    def test_secret_key_rejects_default_value(self):
        """SECRET_KEY no debe ser el valor de ejemplo."""
        with pytest.raises(ValueError, match="SECRET_KEY"):
            Settings(
                DATABASE_URL="postgresql://user:pass@host/db",
                SECRET_KEY="CAMBIA_ESTO_genera_con_secrets_token_urlsafe_48",
                FRONTEND_URL="http://localhost:5173",
                MAIL_USERNAME="test@test.com",
                MAIL_PASSWORD="pass",
                MAIL_SERVER="smtp.test.com",
            )

    def test_frontend_url_must_start_with_http(self):
        """FRONTEND_URL debe comenzar con http:// o https://."""
        with pytest.raises(ValueError, match="FRONTEND_URL"):
            Settings(
                DATABASE_URL="postgresql://user:pass@host/db",
                SECRET_KEY="a" * 32,
                FRONTEND_URL="ftp://invalid",
                MAIL_USERNAME="test@test.com",
                MAIL_PASSWORD="pass",
                MAIL_SERVER="smtp.test.com",
            )

    def test_valid_settings_work(self):
        """Configuración válida no debe lanzar error."""
        settings = Settings(
            DATABASE_URL="postgresql://user:pass@host/db",
            SECRET_KEY="a" * 32,
            FRONTEND_URL="http://localhost:5173",
            MAIL_USERNAME="test@test.com",
            MAIL_PASSWORD="pass",
            MAIL_SERVER="smtp.test.com",
        )
        assert settings.ALGORITHM == "HS256"
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 15
        assert settings.ENVIRONMENT == "development"
