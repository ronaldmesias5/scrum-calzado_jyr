"""Tests de integración del flujo pedidos + inventario contra BD aislada.

Incluye la regresión del bug de colour: los lookups de inventario NO deben
filtrar por colour (el inventario guarda colour="" y los detalles de pedido
guardan el colour completo, ej. "negro x blanco").
"""

import uuid

import pytest
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models.category import Category
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.role import Role
from app.models.style import Style
from app.models.user import User
from app.utils.security import hash_password


def _first_product(db_session) -> Product:
    """Crea un producto de prueba (el seed no crea products por diseño)."""
    style = db_session.execute(select(Style).limit(1)).scalar_one()
    category = db_session.execute(select(Category).limit(1)).scalar_one()
    product = Product(
        style_id=style.id,
        brand_id=style.brand_id,
        category_id=category.id,
        name_product="Producto Test",
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
        hashed_password=hash_password("Cliente123!"),
        name_user="Cliente",
        last_name="Test",
        role_id=role.id,
        is_active=True,
        is_validated=True,
    )
    db_session.add(user)
    db_session.flush()
    return user


def _csrf_headers(client, base_headers: dict) -> dict:
    token = client.cookies.get("csrf_token")
    if token:
        return {**base_headers, "X-CSRF-Token": token}
    return base_headers


def _create_order(client, jefe_headers, customer_id, product_id, size, amount) -> dict:
    response = client.post(
        "/api/v1/admin/orders",
        headers=_csrf_headers(client, jefe_headers),
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


def _change_status(client, jefe_headers, order_id, state) -> dict:
    response = client.patch(
        f"/api/v1/admin/orders/{order_id}/status",
        headers=_csrf_headers(client, jefe_headers),
        json={"state": state},
    )
    assert response.status_code == 200, response.text
    return response.json()


def _inventory_for(db_session, product_id, size) -> list[Inventory]:
    return (
        db_session.execute(
            select(Inventory).where(
                Inventory.product_id == product_id,
                Inventory.size == size,
                Inventory.deleted_at.is_(None),
            )
        )
        .scalars()
        .all()
    )


def test_order_flow_completado_entregado_updates_reserved(db_session, client, jefe_headers):
    product = _first_product(db_session)
    customer = _create_client_user(db_session)

    order = _create_order(client, jefe_headers, customer.id, product.id, size="38", amount=2)
    order_id = order["id"]

    _change_status(client, jefe_headers, order_id, "completado")
    db_session.expire_all()
    inv = _inventory_for(db_session, product.id, "38")
    assert inv, "Completar el pedido debe crear/actualizar el inventario"
    assert float(inv[0].reserved) == 2

    _change_status(client, jefe_headers, order_id, "entregado")
    db_session.expire_all()
    inv = _inventory_for(db_session, product.id, "38")
    assert float(inv[0].reserved) == 0


def test_revert_from_completado_releases_reserved_colour_regression(
    db_session, client, jefe_headers
):
    """Regresión: con inventario preexistente de colour="" (como lo crea el panel
    admin), revertir el pedido de completado a pendiente debe liberar la reserva.
    Antes del fix el lookup filtraba por colour y la reserva quedaba colgada.
    """
    product = _first_product(db_session)
    customer = _create_client_user(db_session)

    existing = Inventory(product_id=product.id, size="40", colour="", amount=10, reserved=0)
    db_session.add(existing)
    db_session.flush()

    order = _create_order(client, jefe_headers, customer.id, product.id, size="40", amount=3)
    order_id = order["id"]

    _change_status(client, jefe_headers, order_id, "completado")
    db_session.expire_all()
    inv = _inventory_for(db_session, product.id, "40")
    assert len(inv) == 1, "No debe duplicarse el inventario al completar"
    assert float(inv[0].reserved) == 3

    _change_status(client, jefe_headers, order_id, "pendiente")
    db_session.expire_all()
    inv = _inventory_for(db_session, product.id, "40")
    assert float(inv[0].reserved) == 0, "Revertir a pendiente debe liberar la reserva"


def test_inventory_unique_constraint_product_size_colour(db_session):
    product = _first_product(db_session)

    db_session.add(Inventory(product_id=product.id, size="41", colour="", amount=1))
    db_session.flush()

    db_session.add(Inventory(product_id=product.id, size="41", colour="", amount=2))
    with pytest.raises(IntegrityError):
        db_session.flush()

    db_session.rollback()


def test_non_jefe_cannot_update_order_status(db_session, client, jefe_headers):
    role = db_session.execute(select(Role).where(Role.name_role == "employee")).scalar_one()
    employee = User(
        email=f"empleado.{uuid.uuid4().hex[:8]}@test.com",
        hashed_password=hash_password("Empleado123!"),
        name_user="Empleado",
        last_name="Test",
        role_id=role.id,
        occupation="cortador",
        is_active=True,
        is_validated=True,
    )
    db_session.add(employee)
    db_session.flush()

    product = _first_product(db_session)
    customer = _create_client_user(db_session)
    order = _create_order(client, jefe_headers, customer.id, product.id, size="37", amount=1)

    login = client.post(
        "/api/v1/auth/login",
        json={"email": employee.email, "password": "Empleado123!"},
    )
    assert login.status_code == 200, login.text
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    headers = _csrf_headers(client, headers)

    response = client.patch(
        f"/api/v1/admin/orders/{order['id']}/status",
        headers=headers,
        json={"state": "completado"},
    )
    assert response.status_code == 403
