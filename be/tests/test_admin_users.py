"""Tests de gestión de usuarios por admin/jefe (routers/admin.py).

Cubre: crear empleado/cliente, duplicados, guard de rol, validar pendiente,
renovar invitación, listar y detalle. Los envíos de email se mockean para no
depender de SMTP.
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import select

from app.models.role import Role
from app.models.user import User
from app.utils.security import hash_password


@pytest.fixture()
def no_email(monkeypatch):
    """Evita envíos SMTP reales en los endpoints de usuarios."""
    monkeypatch.setattr("app.routers.admin.send_welcome_email", AsyncMock())
    monkeypatch.setattr("app.routers.admin.send_account_approved_email", AsyncMock())


def _csrf(client, base: dict) -> dict:
    token = client.cookies.get("csrf_token")
    return {**base, "X-CSRF-Token": token} if token else base


def _employee_payload(occupation="cortador") -> dict:
    tag = uuid.uuid4().hex[:8]
    return {
        "email": f"empleado.{tag}@test.com",
        "name": "Empleado",
        "last_name": "Test",
        "occupation": occupation,
        "password": "Empleado123!",
    }


def _login(client, email, password) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
    return _csrf(client, headers)


def test_create_employee_ok(client, jefe_headers, no_email):
    response = client.post(
        "/api/v1/admin/users/create-employee",
        headers=_csrf(client, jefe_headers),
        json=_employee_payload(),
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["must_change_password"] is True
    assert body["is_validated"] is True


def test_create_employee_duplicate_email(client, jefe_headers, no_email):
    payload = _employee_payload()
    first = client.post(
        "/api/v1/admin/users/create-employee",
        headers=_csrf(client, jefe_headers),
        json=payload,
    )
    assert first.status_code == 201, first.text

    retry = client.post(
        "/api/v1/admin/users/create-employee",
        headers=_csrf(client, jefe_headers),
        json=payload,
    )
    assert retry.status_code == 400, retry.text


def test_create_employee_forbidden_for_non_jefe(client, db_session, no_email):
    """Un empleado no puede crear otros usuarios (403)."""
    role = db_session.execute(select(Role).where(Role.name_role == "employee")).scalar_one()
    email = f"op.{uuid.uuid4().hex[:8]}@test.com"
    db_session.add(
        User(
            email=email,
            hashed_password=hash_password("Operario123!"),
            name_user="Op",
            last_name="Test",
            role_id=role.id,
            occupation="cortador",
            is_active=True,
            is_validated=True,
            must_change_password=False,
        )
    )
    db_session.flush()
    headers = _login(client, email, "Operario123!")

    response = client.post(
        "/api/v1/admin/users/create-employee",
        headers=headers,
        json=_employee_payload(),
    )
    assert response.status_code == 403, response.text


def test_create_client_ok(client, jefe_headers, no_email):
    tag = uuid.uuid4().hex[:8]
    response = client.post(
        "/api/v1/admin/users/create-client",
        headers=_csrf(client, jefe_headers),
        json={
            "email": f"cliente.{tag}@test.com",
            "name": "Cliente",
            "last_name": "Test",
            "business_name": "Tienda Test",
            "password": "Cliente123!",
        },
    )
    assert response.status_code == 201, response.text


def test_validate_pending_user(client, jefe_headers, db_session, no_email):
    """Un usuario pendiente queda validado y activo."""
    role = db_session.execute(select(Role).where(Role.name_role == "client")).scalar_one()
    pending = User(
        email=f"pendiente.{uuid.uuid4().hex[:8]}@test.com",
        hashed_password=hash_password("Pendiente123!"),
        name_user="Pend",
        last_name="Test",
        role_id=role.id,
        is_active=False,
        is_validated=False,
        must_change_password=False,
    )
    db_session.add(pending)
    db_session.flush()

    response = client.patch(
        f"/api/v1/admin/users/{pending.id}/validate",
        headers=_csrf(client, jefe_headers),
    )
    assert response.status_code == 200, response.text
    assert response.json()["is_validated"] is True

    db_session.expire_all()
    assert db_session.execute(select(User).where(User.id == pending.id)).scalar_one().is_active is True


def test_renew_invitation_extends_expiry(client, jefe_headers, db_session, no_email):
    """Renovar invitación mueve invitation_expires_at al futuro (+24h)."""
    role = db_session.execute(select(Role).where(Role.name_role == "employee")).scalar_one()
    user = User(
        email=f"invitado.{uuid.uuid4().hex[:8]}@test.com",
        hashed_password=hash_password("Invitado123!"),
        name_user="Inv",
        last_name="Test",
        role_id=role.id,
        occupation="solador",
        is_active=True,
        is_validated=True,
        must_change_password=True,
        invitation_expires_at=datetime.now(timezone.utc),
    )
    db_session.add(user)
    db_session.flush()

    response = client.post(
        f"/api/v1/admin/users/{user.id}/renew-invitation",
        headers=_csrf(client, jefe_headers),
    )
    assert response.status_code == 200, response.text

    db_session.expire_all()
    renewed = db_session.execute(select(User).where(User.id == user.id)).scalar_one()
    assert renewed.invitation_expires_at > datetime.now(timezone.utc)


def test_list_users_and_detail(client, jefe_headers):
    response = client.get("/api/v1/admin/users", headers=jefe_headers)
    assert response.status_code == 200, response.text
    users = response.json()
    assert isinstance(users, list) and len(users) >= 1

    detail = client.get(f"/api/v1/admin/users/{users[0]['id']}", headers=jefe_headers)
    assert detail.status_code == 200, detail.text
