"""Tests de la máquina de estados de pedidos.

Cubre la validación unitaria de transiciones (ALLOWED_ORDER_TRANSITIONS) y el
rechazo HTTP 409 en el endpoint PATCH /api/v1/admin/orders/{id}/status.
"""

import uuid
from datetime import UTC, datetime  # noqa: F401

import pytest
from sqlalchemy import select

from app.models.category import Category
from app.models.order import Order, OrderStatus
from app.models.product import Product
from app.models.role import Role
from app.models.style import Style
from app.models.user import User
from app.services.orders import validate_order_transition
from app.utils.security import hash_password

PASSWORD = "Password123!"


# ─── Unit: validate_order_transition ───


@pytest.mark.parametrize(
    "new_state",
    [
        OrderStatus.completado,
        OrderStatus.entregado,
        OrderStatus.en_progreso,
    ],
)
def test_cancelado_rejects_invalid_transitions(new_state):
    with pytest.raises(ValueError, match="no permitida"):
        validate_order_transition(OrderStatus.cancelado, new_state)


@pytest.mark.parametrize(
    "new_state",
    [
        OrderStatus.pendiente,
        OrderStatus.en_progreso,
        OrderStatus.completado,
        OrderStatus.cancelado,
    ],
)
def test_entregado_is_terminal(new_state):
    with pytest.raises(ValueError, match="no permitida"):
        validate_order_transition(OrderStatus.entregado, new_state)


@pytest.mark.parametrize(
    "current,new_state",
    [
        (OrderStatus.pendiente, OrderStatus.entregado),
        (OrderStatus.en_progreso, OrderStatus.entregado),
    ],
)
def test_entregado_requires_completado_first(current, new_state):
    with pytest.raises(ValueError, match="no permitida"):
        validate_order_transition(current, new_state)


def test_same_state_is_noop():
    for state in OrderStatus:
        validate_order_transition(state, state)


@pytest.mark.parametrize(
    "current,new_state",
    [
        (OrderStatus.pendiente, OrderStatus.en_progreso),
        (OrderStatus.pendiente, OrderStatus.completado),
        (OrderStatus.pendiente, OrderStatus.cancelado),
        (OrderStatus.en_progreso, OrderStatus.completado),
        (OrderStatus.en_progreso, OrderStatus.cancelado),
        (OrderStatus.completado, OrderStatus.entregado),
        (OrderStatus.completado, OrderStatus.en_progreso),
        (OrderStatus.completado, OrderStatus.pendiente),
        (OrderStatus.completado, OrderStatus.cancelado),
        (OrderStatus.cancelado, OrderStatus.pendiente),
    ],
)
def test_allowed_transitions_pass(current, new_state):
    validate_order_transition(current, new_state)


# ─── API: PATCH /api/v1/admin/orders/{id}/status ───


def _csrf(client, base: dict) -> dict:
    token = client.cookies.get("csrf_token")
    return {**base, "X-CSRF-Token": token} if token else base


def _login(client, email, password) -> dict:
    response = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    headers = {"Authorization": f"Bearer {response.json()['access_token']}"}
    return _csrf(client, headers)


def _first_product(db_session) -> Product:
    style = db_session.execute(select(Style).limit(1)).scalar_one()
    category = db_session.execute(select(Category).limit(1)).scalar_one()
    product = Product(
        style_id=style.id,
        brand_id=style.brand_id,
        category_id=category.id,
        name_product="Producto Estado Test",
        color="negro",
        task_prices={},
    )
    db_session.add(product)
    db_session.flush()
    return product


def _create_client_user(db_session) -> User:
    role = db_session.execute(select(Role).where(Role.name_role == "client")).scalar_one()
    user = User(
        email=f"cliente.{uuid.uuid4().hex[:8]}@test.com",
        hashed_password=hash_password(PASSWORD),
        name_user="Cliente",
        last_name="Test",
        role_id=role.id,
        is_active=True,
        is_validated=True,
        must_change_password=False,
    )
    db_session.add(user)
    db_session.flush()
    return user


def _create_order(client, jefe_headers, customer_id, product_id, size="38", amount=2) -> dict:
    response = client.post(
        "/api/v1/admin/orders",
        headers=jefe_headers,
        json={
            "customer_id": str(customer_id),
            "total_pairs": amount,
            "details": [
                {
                    "product_id": str(product_id),
                    "size": size,
                    "colour": "negro x blanco",
                    "amount": amount,
                    "line_group": 1,
                }
            ],
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def _change_status(client, jefe_headers, order_id, state, expect=200) -> dict:
    response = client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=jefe_headers,
        json={"state": state},
    )
    assert response.status_code == expect, response.text
    return response.json() if expect >= 400 else response.json()


def _get_state(db_session, order_id) -> str:
    db_session.expire_all()
    order = db_session.execute(select(Order).where(Order.id == uuid.UUID(order_id))).scalar_one()
    return order.state if isinstance(order.state, str) else order.state.value


def _make_order_ready(client, db_session, jefe_headers) -> dict:
    product = _first_product(db_session)
    customer = _create_client_user(db_session)
    return _create_order(client, jefe_headers, customer.id, product.id)


def test_cancelado_cannot_complete(client, db_session, jefe_headers):
    order = _make_order_ready(client, db_session, jefe_headers)
    _change_status(client, jefe_headers, order["id"], "cancelado")

    body = _change_status(client, jefe_headers, order["id"], "completado", expect=409)
    assert "no permitida" in body["detail"]
    assert _get_state(db_session, order["id"]) == "cancelado"


def test_cancelado_cannot_deliver(client, db_session, jefe_headers):
    order = _make_order_ready(client, db_session, jefe_headers)
    _change_status(client, jefe_headers, order["id"], "cancelado")

    body = _change_status(client, jefe_headers, order["id"], "entregado", expect=409)
    assert "no permitida" in body["detail"]
    assert _get_state(db_session, order["id"]) == "cancelado"


def test_entregado_is_terminal_api(client, db_session, jefe_headers):
    order = _make_order_ready(client, db_session, jefe_headers)
    _change_status(client, jefe_headers, order["id"], "completado")
    _change_status(client, jefe_headers, order["id"], "entregado")

    body = _change_status(client, jefe_headers, order["id"], "completado", expect=409)
    assert "no permitida" in body["detail"]
    assert _get_state(db_session, order["id"]) == "entregado"


def test_pendiente_cannot_deliver_directly(client, db_session, jefe_headers):
    order = _make_order_ready(client, db_session, jefe_headers)

    body = _change_status(client, jefe_headers, order["id"], "entregado", expect=409)
    assert "no permitida" in body["detail"]
    assert _get_state(db_session, order["id"]) == "pendiente"


def test_happy_path_to_entregado(client, db_session, jefe_headers):
    order = _make_order_ready(client, db_session, jefe_headers)
    for state in ("en_progreso", "completado", "entregado"):
        _change_status(client, jefe_headers, order["id"], state)
    assert _get_state(db_session, order["id"]) == "entregado"


def test_cancelado_can_resume_to_pendiente(client, db_session, jefe_headers):
    order = _make_order_ready(client, db_session, jefe_headers)
    _change_status(client, jefe_headers, order["id"], "cancelado")
    _change_status(client, jefe_headers, order["id"], "pendiente")
    assert _get_state(db_session, order["id"]) == "pendiente"
