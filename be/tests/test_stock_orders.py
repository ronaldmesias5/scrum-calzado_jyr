"""Tests de pedidos para stock/bodega (customer_id NULL).

Un pedido sin cliente representa producción para stock: al completarse
suma a `amount` (bodega) en vez de `reserved`, nunca puede pasar a
'entregado', y queda fuera de los reportes de clientes y de ventas.
"""

import uuid
from datetime import datetime

from sqlalchemy import select

from app.models.category import Category
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.role import Role
from app.models.style import Style
from app.models.tasks import Task
from app.models.user import User
from app.services.orders import complete_emplantillado
from app.utils.security import hash_password


def _first_product(db_session) -> Product:
    style = db_session.execute(select(Style).limit(1)).scalar_one()
    category = db_session.execute(select(Category).limit(1)).scalar_one()
    product = Product(
        style_id=style.id,
        brand_id=style.brand_id,
        category_id=category.id,
        name_product="Producto Stock Test",
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
            "customer_id": str(customer_id) if customer_id else None,
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
        headers=_csrf_headers(client, jefe_headers),
        json={"state": state},
    )
    assert response.status_code == expect, response.text
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


def test_create_stock_order_without_customer(db_session, client, jefe_headers):
    product = _first_product(db_session)

    order = _create_order(client, jefe_headers, None, product.id, size="38", amount=4)

    assert order["customer_id"] is None
    assert order["state"] == "pendiente"


def test_stock_order_completado_increases_amount_not_reserved(db_session, client, jefe_headers):
    product = _first_product(db_session)
    order = _create_order(client, jefe_headers, None, product.id, size="38", amount=4)

    _change_status(client, jefe_headers, order["id"], "completado")
    db_session.expire_all()

    inv = _inventory_for(db_session, product.id, "38")
    assert inv, "Completar un pedido para stock debe crear/actualizar el inventario"
    assert float(inv[0].amount) == 4, "Stock debe sumar a bodega (amount)"
    assert float(inv[0].reserved) == 0, "Stock no debe tocar reserved"


def test_stock_order_cannot_be_delivered(db_session, client, jefe_headers):
    product = _first_product(db_session)
    order = _create_order(client, jefe_headers, None, product.id, size="38", amount=2)
    _change_status(client, jefe_headers, order["id"], "completado")

    _change_status(client, jefe_headers, order["id"], "entregado", expect=400)


def test_stock_order_revert_from_completado_decreases_amount(db_session, client, jefe_headers):
    product = _first_product(db_session)
    order = _create_order(client, jefe_headers, None, product.id, size="38", amount=3)
    _change_status(client, jefe_headers, order["id"], "completado")

    _change_status(client, jefe_headers, order["id"], "pendiente")
    db_session.expire_all()

    inv = _inventory_for(db_session, product.id, "38")
    assert float(inv[0].amount) == 0, "Revertir debe restar de bodega lo sumado"
    assert float(inv[0].reserved) == 0


def test_stock_orders_excluded_from_customer_report(db_session, client, jefe_headers):
    product = _first_product(db_session)
    customer = _create_client_user(db_session)

    client_order = _create_order(client, jefe_headers, customer.id, product.id, size="38", amount=2)
    stock_order = _create_order(client, jefe_headers, None, product.id, size="38", amount=5)

    response = client.get(
        "/api/v1/admin/reports/customer/all/orders",
        headers=_csrf_headers(client, jefe_headers),
    )
    assert response.status_code == 200, response.text
    order_ids = [o["id"] for o in response.json()["orders"]]

    assert client_order["id"] in order_ids
    assert stock_order["id"] not in order_ids, "Pedidos para stock fuera de reportes"


def test_stock_order_rejects_complete_from_warehouse(db_session, client, jefe_headers):
    product = _first_product(db_session)
    order = _create_order(client, jefe_headers, None, product.id, size="38", amount=2)

    response = client.put(
        f"/api/v1/admin/orders/{order['id']}",
        headers=_csrf_headers(client, jefe_headers),
        json={
            "details": [
                {
                    "product_id": str(product.id),
                    "size": "38",
                    "colour": "negro x blanco",
                    "amount": 2,
                    "state": "completado",
                    "observations": "✓ Completado desde bodega",
                    "line_group": 1,
                }
            ]
        },
    )
    assert response.status_code == 400, response.text
    assert "bodega" in response.json()["detail"].lower()


def test_stock_order_detail_completado_increases_amount_not_reserved(
    db_session, client, jefe_headers
):
    """Vía PUT de detalles: completar la fabricación de un pedido para
    stock debe sumar a bodega (amount), no a pares fabricados (reserved)."""
    product = _first_product(db_session)
    order = _create_order(client, jefe_headers, None, product.id, size="38", amount=4)

    response = client.put(
        f"/api/v1/admin/orders/{order['id']}",
        headers=_csrf_headers(client, jefe_headers),
        json={
            "details": [
                {
                    "product_id": str(product.id),
                    "size": "38",
                    "colour": "negro x blanco",
                    "amount": 4,
                    "state": "completado",
                    "line_group": 1,
                }
            ]
        },
    )
    assert response.status_code == 200, response.text
    db_session.expire_all()

    inv = _inventory_for(db_session, product.id, "38")
    assert inv, "Completar el detalle debe crear/actualizar el inventario"
    assert float(inv[0].amount) == 4, "Stock debe sumar a bodega (amount)"
    assert float(inv[0].reserved) == 0, "Stock no debe tocar reserved"


def _finish_emplantillado(db_session, order_id, product_id, line_group=1) -> None:
    """Simula el fin del vale: tarea de emplantillado completada."""
    jefe = db_session.execute(
        select(User).where(User.email == "ronald.jefe@gmail.com")
    ).scalar_one()
    task = Task(
        order_id=uuid.UUID(order_id),
        product_id=product_id,
        line_group=line_group,
        vale_number=99,
        amount=4,
        description_task="Emplantillado test",
        priority="baja",
        type="emplantillado",
        status="completado",
        assignment_date=datetime.now(),
    )
    db_session.add(task)
    db_session.flush()
    complete_emplantillado(db_session, jefe.id, task)
    db_session.flush()


def test_emplantillado_stock_order_increases_amount_not_reserved(db_session, client, jefe_headers):
    """Vía vale (complete_emplantillado): pedido para stock debe sumar a
    bodega (amount), no a pares fabricados (reserved)."""
    product = _first_product(db_session)
    order = _create_order(client, jefe_headers, None, product.id, size="38", amount=4)

    _finish_emplantillado(db_session, order["id"], product.id)
    db_session.expire_all()

    inv = _inventory_for(db_session, product.id, "38")
    assert inv, "Terminar el vale debe crear/actualizar el inventario"
    assert float(inv[0].amount) == 4, "Stock debe sumar a bodega (amount)"
    assert float(inv[0].reserved) == 0, "Stock no debe tocar reserved"


def test_emplantillado_client_order_increases_reserved_not_amount(db_session, client, jefe_headers):
    """Vía vale (complete_emplantillado): pedido CON cliente debe seguir
    sumando a pares fabricados (reserved), no a bodega."""
    product = _first_product(db_session)
    customer = _create_client_user(db_session)
    order = _create_order(client, jefe_headers, customer.id, product.id, size="38", amount=4)

    _finish_emplantillado(db_session, order["id"], product.id)
    db_session.expire_all()

    inv = _inventory_for(db_session, product.id, "38")
    assert inv, "Terminar el vale debe crear/actualizar el inventario"
    assert float(inv[0].amount) == 0, "Pedido con cliente no debe tocar bodega"
    assert float(inv[0].reserved) == 4, "Pedido con cliente suma a fabricados"
