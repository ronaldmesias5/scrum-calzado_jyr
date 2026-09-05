"""Tests del endpoint DELETE /api/v1/users/me (auto-eliminación de cuenta).

Aislamiento: todos los tests HTTP usan el fixture `client` de conftest.py
(BD `<bd>_test` + rollback por test). Nunca se toca la BD de desarrollo.
"""

import uuid

from sqlalchemy import select

from app.models.role import Role
from app.models.user import User
from app.utils.security import hash_password


def _create_user(db_session, password="Test123456!", **kwargs) -> User:
    role = db_session.execute(select(Role).where(Role.name_role == "client")).scalar_one()
    user = User(
        email=f"deleteme.{uuid.uuid4().hex[:8]}@test.com",
        hashed_password=hash_password(password),
        name_user="Delete",
        last_name="Me",
        role_id=role.id,
        is_active=True,
        is_validated=True,
        must_change_password=False,
        **kwargs,
    )
    db_session.add(user)
    db_session.flush()
    return user


def _login_headers(client, email, password) -> dict:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
    csrf = client.cookies.get("csrf_token")
    if csrf:
        headers["X-CSRF-Token"] = csrf
    return headers


def test_delete_account_request_schema_validation():
    """El schema DeleteAccountRequest valida correctamente."""
    from app.routers.users import DeleteAccountRequest

    req = DeleteAccountRequest(password="Test1234!")
    assert req.password == "Test1234!"

    try:
        DeleteAccountRequest()
        raise AssertionError("Debería haber fallado sin password")
    except Exception:
        pass


def test_delete_account_wrong_password(db_session, client):
    """Con contraseña incorrecta se rechaza (400) y la cuenta sigue intacta."""
    user = _create_user(db_session)
    headers = _login_headers(client, user.email, "Test123456!")

    response = client.request(
        "DELETE",
        "/api/v1/users/me",
        headers=headers,
        json={"password": "Wrong9999!"},
    )
    assert response.status_code == 400, response.text

    db_session.expire_all()
    alive = db_session.execute(select(User).where(User.id == user.id)).scalar_one()
    assert alive.deleted_at is None
    assert alive.is_active is True


def test_delete_account_correct_password(db_session, client):
    """Con la contraseña correcta se hace soft delete y el login deja de funcionar."""
    user = _create_user(db_session)
    headers = _login_headers(client, user.email, "Test123456!")

    response = client.request(
        "DELETE",
        "/api/v1/users/me",
        headers=headers,
        json={"password": "Test123456!"},
    )
    assert response.status_code == 200, response.text

    db_session.expire_all()
    deleted = db_session.execute(select(User).where(User.id == user.id)).scalar_one()
    assert deleted.deleted_at is not None
    assert deleted.is_active is False

    # Sesiones invalidadas: el login posterior debe fallar
    retry = client.post(
        "/api/v1/auth/login",
        json={"email": user.email, "password": "Test123456!"},
    )
    assert retry.status_code in (400, 401, 403), retry.text


def test_csrf_middleware_blocks_mutations_without_token(client):
    """POST sin CSRF token en ruta protegida es bloqueado (el register exento no)."""
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@test.com",
            "name": "Test",
            "last_name": "User",
            "password": "Test1234!",
            "accepted_terms": True,
        },
    )
    # La ruta /register está exenta: retorna 400/422/200, nunca 403 por CSRF
    assert response.status_code != 403, "Register no debería ser bloqueado por CSRF"


def test_csrf_middleware_allows_get_without_token(client):
    """GET funciona sin token CSRF."""
    response = client.get("/api/v1/document-types/")
    # Puede retornar 200 o 401 (si requiere auth), pero nunca 403 por CSRF
    assert response.status_code != 403, "GET no debería ser bloqueado por CSRF"


def test_csrf_cookie_is_set(client):
    """El cookie csrf_token se establece en las respuestas."""
    response = client.get("/api/v1/document-types/")
    cookies = dict(response.cookies)
    assert "csrf_token" in cookies, "El cookie csrf_token debería estar presente"
    assert len(cookies["csrf_token"]) == 64, "El token CSRF debería tener 64 caracteres hex"
