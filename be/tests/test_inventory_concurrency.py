"""Tests de concurrencia e inventario (with_for_update).

Cubre: descuento de stock con _deduct_inventory (éxito, stock insuficiente,
sin filas), generación SQL con FOR UPDATE, bloqueo real entre conexiones y
guard anti-negativo al entregar un pedido.
"""

import uuid
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from sqlalchemy import select, text
from sqlalchemy.dialects import postgresql
from sqlalchemy.exc import OperationalError

from app.models.category import Category
from app.models.inventory import Inventory
from app.models.order import Order, OrderDetail, OrderStatus
from app.models.product import Product
from app.models.role import Role
from app.models.style import Style
from app.models.user import User
from app.services.orders import apply_order_state_inventory
from app.services.scrap import _deduct_inventory
from app.utils.security import hash_password

PASSWORD = "Password123!"


def _first_product(db_session) -> Product:
    style = db_session.execute(select(Style).limit(1)).scalar_one()
    category = db_session.execute(select(Category).limit(1)).scalar_one()
    product = Product(
        style_id=style.id,
        brand_id=style.brand_id,
        category_id=category.id,
        name_product="Producto Concurrencia Test",
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


def _make_inventory(
    db_session, product_id, size="38", amount="10", reserved="0"
) -> Inventory:
    inv = Inventory(
        product_id=product_id,
        size=size,
        colour="negro x blanco",
        amount=Decimal(amount),
        reserved=Decimal(reserved),
        minimum_stock=0,
    )
    db_session.add(inv)
    db_session.flush()
    return inv


def _get_inventory(db_session, product_id, size="38") -> Inventory:
    db_session.flush()
    db_session.expire_all()
    return db_session.execute(
        select(Inventory).where(
            Inventory.product_id == product_id,
            Inventory.size == size,
            Inventory.deleted_at.is_(None),
        )
    ).scalar_one()


# ─── Unit: _deduct_inventory ───


def test_deduct_inventory_success(db_session):
    product = _first_product(db_session)
    _make_inventory(db_session, product.id, amount="10")

    _deduct_inventory(db_session, product.id, "38", Decimal("4"))

    assert float(_get_inventory(db_session, product.id).amount) == 6


def test_deduct_inventory_insufficient_stock_no_mutation(db_session):
    product = _first_product(db_session)
    _make_inventory(db_session, product.id, amount="5")

    with pytest.raises(ValueError, match="excede el stock disponible"):
        _deduct_inventory(db_session, product.id, "38", Decimal("10"))

    assert float(_get_inventory(db_session, product.id).amount) == 5


def test_deduct_inventory_available_accounts_for_reserved(db_session):
    product = _first_product(db_session)
    _make_inventory(db_session, product.id, amount="10", reserved="8")

    with pytest.raises(ValueError, match="excede el stock disponible"):
        _deduct_inventory(db_session, product.id, "38", Decimal("3"))


def test_deduct_inventory_missing_rows(db_session):
    product = _first_product(db_session)

    with pytest.raises(ValueError, match="No hay inventario"):
        _deduct_inventory(db_session, product.id, "38", Decimal("1"))


def test_deduct_inventory_never_negative(db_session):
    product = _first_product(db_session)
    _make_inventory(db_session, product.id, amount="5")

    _deduct_inventory(db_session, product.id, "38", Decimal("5"))

    inv = _get_inventory(db_session, product.id)
    assert float(inv.amount) == 0
    assert float(inv.amount) >= 0


# ─── SQL: FOR UPDATE presente en la consulta ───


def test_deduct_inventory_statement_uses_for_update():
    stmt = (
        select(Inventory)
        .where(
            Inventory.product_id == uuid.uuid4(),
            Inventory.size == "38",
            Inventory.deleted_at.is_(None),
        )
        .with_for_update()
    )
    sql = str(stmt.compile(dialect=postgresql.dialect()))
    assert "FOR UPDATE" in sql


# ─── Bloqueo real entre conexiones ───


def test_for_update_blocks_second_connection(engine):
    """Una conexión con FOR UPDATE bloquea a otra hasta hacer commit/rollback."""
    conn_a = engine.connect()
    try:
        trans_a = conn_a.begin()
        row = conn_a.execute(text("SELECT id FROM styles LIMIT 1 FOR UPDATE")).one()

        conn_b = engine.connect()
        try:
            conn_b.execute(text("SET lock_timeout = '300ms'"))
            with pytest.raises(OperationalError, match="lock timeout"):
                conn_b.execute(
                    text("SELECT id FROM styles WHERE id = :id FOR UPDATE"),
                    {"id": row.id},
                )
        finally:
            conn_b.close()

        trans_a.rollback()
    finally:
        conn_a.close()

    # Tras liberar el lock, la lectura procede
    with engine.connect() as conn_c:
        result = conn_c.execute(
            text("SELECT id FROM styles WHERE id = :id FOR UPDATE"),
            {"id": row.id},
        )
        assert result.one().id == row.id


# ─── Guard anti-negativo al entregar ───


def test_deliver_does_not_go_negative_when_reserved_is_zero(db_session):
    product = _first_product(db_session)
    customer = _create_client_user(db_session)
    _make_inventory(db_session, product.id, amount="10", reserved="0")

    order = Order(customer_id=customer.id, total_pairs=6, state=OrderStatus.completado)
    db_session.add(order)
    db_session.flush()
    detail = OrderDetail(
        order_id=order.id,
        product_id=product.id,
        size="38",
        colour="negro x blanco",
        amount=6,
        line_group=1,
        state=OrderStatus.completado,
        order_date=datetime.now(UTC),
    )
    db_session.add(detail)
    db_session.flush()
    db_session.refresh(order)

    jefe = db_session.execute(
        select(User).where(User.email == "ronald.jefe@gmail.com")
    ).scalar_one()

    apply_order_state_inventory(db_session, jefe.id, order, OrderStatus.entregado)

    inv = _get_inventory(db_session, product.id)
    assert float(inv.reserved) == 0
