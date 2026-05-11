"""
Archivo: be/tests/test_security.py
Descripción: Tests unitarios para el módulo de seguridad (hashing, JWT).
"""

import pytest
from datetime import datetime, timedelta, timezone

from app.utils.security import hash_password, verify_password, create_access_token, decode_token
from app.core.config import settings


class TestPasswordHashing:
    """Tests para hash y verificación de contraseñas."""

    def test_hash_password_returns_different_from_plain(self):
        """El hash debe ser diferente del texto plano."""
        plain = "TestPassword123!"
        hashed = hash_password(plain)
        assert hashed != plain
        assert len(hashed) > 20

    def test_hash_password_is_deterministic_for_same_input(self):
        """Cada hash debe ser único (salt aleatorio)."""
        plain = "TestPassword123!"
        hash1 = hash_password(plain)
        hash2 = hash_password(plain)
        assert hash1 != hash2  # Diferentes salts

    def test_verify_password_correct(self):
        """Verificar contraseña correcta retorna True."""
        plain = "CorrectPass1!"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_password_incorrect(self):
        """Verificar contraseña incorrecta retorna False."""
        plain = "CorrectPass1!"
        hashed = hash_password(plain)
        assert verify_password("WrongPass2@", hashed) is False

    def test_verify_password_empty_handled(self):
        """Verificar con string vacío no debe causar error."""
        hashed = hash_password("SomePass1!")
        assert verify_password("", hashed) is False


class TestJWT:
    """Tests para creación y validación de JWT tokens."""

    def test_create_access_token_returns_string(self):
        """El access token debe ser un string JWT válido."""
        token = create_access_token(
            data={"sub": "test@test.com", "user_id": "123"},
            expires_delta=timedelta(minutes=15)
        )
        assert isinstance(token, str)
        assert token.count(".") == 2  # Formato JWT: header.payload.signature

    def test_decode_valid_token(self):
        """Decodificar un token válido retorna los claims."""
        token = create_access_token(
            data={"sub": "user@test.com", "user_id": "abc-123"},
            expires_delta=timedelta(minutes=15)
        )
        payload = decode_token(token)
        assert payload["sub"] == "user@test.com"
        assert payload["user_id"] == "abc-123"
        assert "exp" in payload

    def test_decode_expired_token(self):
        """Token expirado debe lanzar excepción."""
        token = create_access_token(
            data={"sub": "test@test.com"},
            expires_delta=timedelta(seconds=-1)  # Ya expiró
        )
        with pytest.raises(Exception):
            decode_token(token)

    def test_decode_invalid_token(self):
        """Token malformado debe lanzar excepción."""
        with pytest.raises(Exception):
            decode_token("not.a.valid.token")

    def test_token_contains_expiration(self):
        """El token debe contener fecha de expiración."""
        token = create_access_token(data={"sub": "test@test.com"})
        payload = decode_token(token)
        assert "exp" in payload
        exp_time = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        assert exp_time > now
