"""Tests de autenticación y autorización (IDOR).

Un usuario normal (empleado/cliente) debe recibir 403 al acceder a rutas de
administración, scrap y vales de producción ajenos. Sin token → 401. El jefe
conserva acceso (control positivo).
"""

import uuid
from datetime import UTC, datetime

import pytest
from sqlalchemy import select

from app.models.category import Category
from app.models.product import Product
from app.models.role import Role
from app.models.style import Style
from app.models.tasks import Task
from app.models.user import User
from app.utils.security import hash_password

PASSWORD = "Password123!"


def _csrf(client, base: dict) -> dict:
    token = client.cookies.get("csrf_token")
    return {**base, "X-CSRF-Token": token} if token else base


def _login(client, email, password) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
    return _csrf(client, headers)


def _create_user(db_session, role_name: str, occupation: str | None = None) -> User:
    role = db_session.execute(select(Role).where(Role.name_role == role_name)).scalar_one()
    user = User(
        email=f"{role_name}.{uuid.uuid4().hex[:8]}@test.com",
        hashed_password=hash_password(PASSWORD),
        name_user="Test",
        last_name="User",
        role_id=role.id,
        occupation=occupation,
        is_active=True,
        is_validated=True,
        must_change_password=False,
    )
    db_session.add(user)
    db_session.flush()
    return user


def _first_product(db_session) -> Product:
    style = db_session.execute(select(Style).limit(1)).scalar_one()
    category = db_session.execute(select(Category).limit(1)).scalar_one()
    product = Product(
        style_id=style.id,
        brand_id=style.brand_id,
        category_id=category.id,
        name_product="Producto IDOR Test",
        color="negro",
        task_prices={},
    )
    db_session.add(product)
    db_session.flush()
    return product


def _make_task(db_session, assigned_to, product_id, order_id=None) -> Task:
    task = Task(
        assigned_to=assigned_to,
        order_id=order_id,
        product_id=product_id,
        line_group=1,
        vale_number=1,
        amount=4,
        description_task="Tarea IDOR test",
        priority="baja",
        type="corte",
        status="pendiente",
        assignment_date=datetime.now(UTC),
    )
    db_session.add(task)
    db_session.flush()
    return task


@pytest.fixture()
def employee_headers(client, db_session) -> dict:
    user = _create_user(db_session, "employee", "cortador")
    return _login(client, user.email, PASSWORD)


@pytest.fixture()
def client_headers(client, db_session) -> dict:
    user = _create_user(db_session, "client")
    return _login(client, user.email, PASSWORD)


# ─── Autenticación básica ───


def test_missing_token_returns_401(client):
    response = client.get("/api/v1/admin/users")
    assert response.status_code == 401


# ─── Rutas de administración ───


def test_employee_forbidden_admin_users(client, employee_headers):
    response = client.get("/api/v1/admin/users", headers=employee_headers)
    assert response.status_code == 403


def test_client_forbidden_admin_users(client, client_headers):
    response = client.get("/api/v1/admin/users", headers=client_headers)
    assert response.status_code == 403


# ─── Rutas de scrap (vales de producción / mermas) ───


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/scrap/defect-codes",
        "/api/v1/scrap/losses",
        "/api/v1/scrap/stock",
    ],
)
def test_employee_forbidden_scrap(client, employee_headers, path):
    response = client.get(path, headers=employee_headers)
    assert response.status_code == 403, path


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/scrap/defect-codes",
        "/api/v1/scrap/losses",
        "/api/v1/scrap/stock",
    ],
)
def test_client_forbidden_scrap(client, client_headers, path):
    response = client.get(path, headers=client_headers)
    assert response.status_code == 403, path


# ─── Endpoints admin de tareas (solo jefe) ───


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/admin/orders/tasks/all",
        "/api/v1/admin/orders/tasks/next-number",
    ],
)
def test_employee_forbidden_task_admin_endpoints(client, employee_headers, path):
    response = client.get(path, headers=employee_headers)
    assert response.status_code == 403, path


# ─── Controles positivos (jefe) ───


def test_jefe_allowed_controls(client, jefe_headers):
    assert client.get("/api/v1/admin/users", headers=jefe_headers).status_code == 200
    assert client.get("/api/v1/scrap/defect-codes", headers=jefe_headers).status_code == 200
    assert client.get("/api/v1/admin/orders/tasks/all", headers=jefe_headers).status_code == 200


# ─── IDOR: estado de tarea ajena ───


def test_employee_cannot_modify_task_of_another_employee(client, db_session):
    emp_a = _create_user(db_session, "employee", "cortador")
    emp_b = _create_user(db_session, "employee", "solador")
    headers_a = _login(client, emp_a.email, PASSWORD)
    headers_b = _login(client, emp_b.email, PASSWORD)

    product = _first_product(db_session)
    task = _make_task(db_session, assigned_to=emp_a.id, product_id=product.id)

    response = client.patch(
        f"/api/v1/admin/orders/tasks/{task.id}/status",
        headers=headers_b,
        json={"status": "en_progreso"},
    )
    assert response.status_code == 403
    assert "permiso" in response.json()["detail"].lower()


def test_employee_can_modify_own_task(client, db_session, jefe_headers):
    emp = _create_user(db_session, "employee", "cortador")
    headers = _login(client, emp.email, PASSWORD)

    product = _first_product(db_session)

    role = db_session.execute(select(Role).where(Role.name_role == "client")).scalar_one()
    customer = User(
        email=f"cliente.{uuid.uuid4().hex[:8]}@test.com",
        hashed_password=hash_password(PASSWORD),
        name_user="Cliente",
        last_name="Test",
        role_id=role.id,
        is_active=True,
        is_validated=True,
        must_change_password=False,
    )
    db_session.add(customer)
    db_session.flush()

    order_response = client.post(
        "/api/v1/admin/orders",
        headers=jefe_headers,
        json={
            "customer_id": str(customer.id),
            "total_pairs": 4,
            "details": [
                {
                    "product_id": str(product.id),
                    "size": "38",
                    "colour": "negro x blanco",
                    "amount": 4,
                    "line_group": 1,
                }
            ],
        },
    )
    assert order_response.status_code == 201, order_response.text
    order_id = order_response.json()["id"]

    task = _make_task(db_session, assigned_to=emp.id, product_id=product.id, order_id=order_id)

    response = client.patch(
        f"/api/v1/admin/orders/tasks/{task.id}/status",
        headers=headers,
        json={"status": "en_progreso"},
    )
    assert response.status_code == 200, response.text


# ─── IDOR: lectura de vale ajeno ───


def test_employee_cannot_read_vale_of_another_employee(client, db_session):
    emp_a = _create_user(db_session, "employee", "cortador")
    emp_b = _create_user(db_session, "employee", "solador")
    _login(client, emp_a.email, PASSWORD)
    headers_b = _login(client, emp_b.email, PASSWORD)

    product = _first_product(db_session)
    task = _make_task(db_session, assigned_to=emp_a.id, product_id=product.id)

    response = client.get(
        f"/api/v1/dashboard/employee/tasks/{task.id}/vale",
        headers=headers_b,
    )
    assert response.status_code == 403
    assert "vale" in response.json()["detail"].lower()


def test_employee_can_read_own_vale(client, db_session, jefe_headers):
    """Control positivo: el dueño de la tarea lee su vale (200)."""
    emp = _create_user(db_session, "employee", "cortador")
    headers = _login(client, emp.email, PASSWORD)

    product = _first_product(db_session)

    role = db_session.execute(select(Role).where(Role.name_role == "client")).scalar_one()
    customer = User(
        email=f"cliente.{uuid.uuid4().hex[:8]}@test.com",
        hashed_password=hash_password(PASSWORD),
        name_user="Cliente",
        last_name="Test",
        role_id=role.id,
        is_active=True,
        is_validated=True,
        must_change_password=False,
    )
    db_session.add(customer)
    db_session.flush()

    order_response = client.post(
        "/api/v1/admin/orders",
        headers=jefe_headers,
        json={
            "customer_id": str(customer.id),
            "total_pairs": 4,
            "details": [
                {
                    "product_id": str(product.id),
                    "size": "38",
                    "colour": "negro x blanco",
                    "amount": 4,
                    "line_group": 1,
                }
            ],
        },
    )
    assert order_response.status_code == 201, order_response.text
    order_id = order_response.json()["id"]

    task = _make_task(db_session, assigned_to=emp.id, product_id=product.id, order_id=order_id)

    response = client.get(
        f"/api/v1/dashboard/employee/tasks/{task.id}/vale",
        headers=headers,
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["order_id"] == order_id
    assert any(t["is_mine"] for t in body["tasks"])
