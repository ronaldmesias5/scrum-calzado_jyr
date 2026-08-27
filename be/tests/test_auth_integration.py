"""Tests de integración de autenticación (login + guards) contra BD aislada."""


def test_login_returns_tokens(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "ronald.jefe@gmail.com", "password": "Test123456!"},
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["access_token"]
    assert data["refresh_token"]


def test_login_wrong_password_is_rejected(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "ronald.jefe@gmail.com", "password": "Incorrecta123!"},
    )
    assert response.status_code == 401


def test_login_unknown_user_is_rejected(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "no.existe@example.com", "password": "Test123456!"},
    )
    assert response.status_code == 401


def test_orders_endpoint_requires_authentication(client):
    response = client.get("/api/v1/admin/orders")
    assert response.status_code == 401
