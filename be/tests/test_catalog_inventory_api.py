"""Tests del catálogo admin e inventario (routers/catalog_products.py,
routers/catalog_inventory.py): CRUD de productos, bulk de inventario,
pares fabricados e inventario por talla.
"""

import uuid

from sqlalchemy import select

from app.models.category import Category
from app.models.inventory import Inventory
from app.models.style import Style


def _csrf(client, base: dict) -> dict:
    token = client.cookies.get("csrf_token")
    return {**base, "X-CSRF-Token": token} if token else base


def _catalog_ids(db_session):
    style = db_session.execute(select(Style).limit(1)).scalar_one()
    category = db_session.execute(select(Category).limit(1)).scalar_one()
    return str(style.brand_id), str(style.id), str(category.id)


def _create_product(client, jefe_headers, db_session, name=None, color="negro") -> dict:
    brand_id, style_id, category_id = _catalog_ids(db_session)
    response = client.post(
        "/api/v1/admin/catalog/products",
        headers=_csrf(client, jefe_headers),
        json={
            "name": name or f"Prod Test {uuid.uuid4().hex[:8]}",
            "brand_id": brand_id,
            "style_id": style_id,
            "category_id": category_id,
            "color": color,
        },
    )
    assert response.status_code == 200, response.text
    return response.json()


def test_create_product_ok(client, jefe_headers, db_session):
    body = _create_product(client, jefe_headers, db_session)
    assert body["id"]
    assert body["is_active"] is True


def test_create_product_duplicate_name_conflict(client, jefe_headers, db_session):
    brand_id, style_id, category_id = _catalog_ids(db_session)
    payload = {
        "name": f"Dup {uuid.uuid4().hex[:8]}",
        "brand_id": brand_id,
        "style_id": style_id,
        "category_id": category_id,
        "color": "blanco",
    }
    first = client.post(
        "/api/v1/admin/catalog/products",
        headers=_csrf(client, jefe_headers),
        json=payload,
    )
    assert first.status_code == 200, first.text

    retry = client.post(
        "/api/v1/admin/catalog/products",
        headers=_csrf(client, jefe_headers),
        json=payload,
    )
    assert retry.status_code == 409, retry.text


def test_toggle_product_state(client, jefe_headers, db_session):
    product = _create_product(client, jefe_headers, db_session)
    response = client.put(
        f"/api/v1/admin/catalog/products/{product['id']}/toggle-state",
        headers=_csrf(client, jefe_headers),
    )
    assert response.status_code == 200, response.text


def test_bulk_inventory_update(client, jefe_headers, db_session):
    product = _create_product(client, jefe_headers, db_session)
    response = client.post(
        "/api/v1/admin/catalog/inventory/bulk",
        headers=_csrf(client, jefe_headers),
        json={"product_id": product["id"], "quantities": {"38": 5, "39": 7}},
    )
    assert response.status_code == 200, response.text

    db_session.expire_all()
    rows = (
        db_session.execute(
            select(Inventory).where(
                Inventory.product_id == product["id"],
                Inventory.deleted_at.is_(None),
            )
        )
        .scalars()
        .all()
    )
    by_size = {r.size: float(r.amount) for r in rows}
    assert by_size.get("38") == 5
    assert by_size.get("39") == 7


def test_update_manufactured_pairs(client, jefe_headers, db_session):
    product = _create_product(client, jefe_headers, db_session)
    response = client.patch(
        f"/api/v1/admin/catalog/products/{product['id']}/manufactured-pairs",
        headers=_csrf(client, jefe_headers),
        json={"quantity": 12},
    )
    assert response.status_code == 200, response.text
    assert response.json()["manufactured_pairs"] == 12


def test_inventory_by_size(client, jefe_headers, db_session):
    product = _create_product(client, jefe_headers, db_session)
    client.post(
        "/api/v1/admin/catalog/inventory/bulk",
        headers=_csrf(client, jefe_headers),
        json={"product_id": product["id"], "quantities": {"40": 3}},
    )
    response = client.get(
        f"/api/v1/admin/catalog/products/{product['id']}/inventory-by-size",
        headers=jefe_headers,
    )
    assert response.status_code == 200, response.text
