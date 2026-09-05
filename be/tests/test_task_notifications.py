"""Tests de notificaciones de tareas (routers/orders_tasks.py).

- Al asignar una tarea (PATCH /tasks/{id}/assign) se notifica al empleado.
- Al completar una tarea (PATCH /tasks/{id}/status → completado) se notifica
  a los jefes.
"""

import uuid

from sqlalchemy import select

from app.models.category import Category
from app.models.notifications import Notification
from app.models.product import Product
from app.models.role import Role
from app.models.style import Style
from app.models.user import User
from app.utils.security import hash_password


def _csrf(client, base: dict) -> dict:
    token = client.cookies.get("csrf_token")
    return {**base, "X-CSRF-Token": token} if token else base


def _product(db_session) -> Product:
    style = db_session.execute(select(Style).limit(1)).scalar_one()
    category = db_session.execute(select(Category).limit(1)).scalar_one()
    product = Product(
        style_id=style.id,
        brand_id=style.brand_id,
        category_id=category.id,
        name_product=f"Prod Notif {uuid.uuid4().hex[:8]}",
        color="negro",
        task_prices={},
    )
    db_session.add(product)
    db_session.flush()
    return product


def _user(db_session, role_name: str, occupation: str | None = None) -> tuple[User, str]:
    role = db_session.execute(select(Role).where(Role.name_role == role_name)).scalar_one()
    password = "Test123456!"
    user = User(
        email=f"{role_name}.{uuid.uuid4().hex[:8]}@test.com",
        hashed_password=hash_password(password),
        name_user=role_name.capitalize(),
        last_name="Test",
        role_id=role.id,
        occupation=occupation,
        is_active=True,
        is_validated=True,
        must_change_password=False,
    )
    db_session.add(user)
    db_session.flush()
    return user, password


def _order_and_task(client, jefe_headers, db_session, product) -> dict:
    customer, _ = _user(db_session, "client")
    order = client.post(
        "/api/v1/admin/orders",
        headers=_csrf(client, jefe_headers),
        json={
            "customer_id": str(customer.id),
            "total_pairs": 2,
            "details": [
                {
                    "product_id": str(product.id),
                    "size": "38",
                    "colour": "negro x blanco",
                    "amount": 2,
                    "line_group": 1,
                }
            ],
        },
    )
    assert order.status_code == 201, order.text

    tasks = client.post(
        f"/api/v1/admin/orders/{order.json()['id']}/tasks",
        headers=_csrf(client, jefe_headers),
        json={
            "tasks": [
                {
                    "product_id": str(product.id),
                    "type": "corte",
                    "amount": 2,
                    "line_group": 1,
                }
            ]
        },
    )
    assert tasks.status_code in (200, 201), tasks.text
    return tasks.json()[0]


def _notifications_for(db_session, user_id) -> list[Notification]:
    db_session.expire_all()
    return (
        db_session.execute(
            select(Notification).where(
                Notification.user_id == user_id,
                Notification.deleted_at.is_(None),
            )
        )
        .scalars()
        .all()
    )


def test_assign_task_notifies_employee(client, jefe_headers, db_session):
    product = _product(db_session)
    employee, _ = _user(db_session, "employee", occupation="cortador")
    task = _order_and_task(client, jefe_headers, db_session, product)

    response = client.patch(
        f"/api/v1/admin/orders/tasks/{task['id']}/assign",
        headers=_csrf(client, jefe_headers),
        json={"assigned_to": str(employee.id)},
    )
    assert response.status_code == 200, response.text

    notifs = _notifications_for(db_session, employee.id)
    assert any("asignada" in n.title_notification.lower() for n in notifs), (
        "El empleado debe recibir notificación de asignación"
    )


def test_complete_task_notifies_jefes(client, jefe_headers, db_session):
    product = _product(db_session)
    employee, _ = _user(db_session, "employee", occupation="cortador")
    task = _order_and_task(client, jefe_headers, db_session, product)

    client.patch(
        f"/api/v1/admin/orders/tasks/{task['id']}/assign",
        headers=_csrf(client, jefe_headers),
        json={"assigned_to": str(employee.id)},
    )

    me = client.get("/api/v1/users/me", headers=jefe_headers)
    assert me.status_code == 200, me.text
    jefe_id = me.json()["id"]
    before = len(_notifications_for(db_session, jefe_id))

    response = client.patch(
        f"/api/v1/admin/orders/tasks/{task['id']}/status",
        headers=_csrf(client, jefe_headers),
        json={"status": "completado"},
    )
    assert response.status_code == 200, response.text

    after = _notifications_for(db_session, jefe_id)
    assert len(after) > before, "El jefe debe recibir notificación de tarea completada"
    assert any("completada" in n.title_notification.lower() for n in after)


def test_assign_task_requires_jefe(client, db_session):
    """Un empleado no puede asignar tareas (403)."""
    product = _product(db_session)
    employee, password = _user(db_session, "employee", occupation="cortador")

    login = client.post(
        "/api/v1/auth/login", json={"email": employee.email, "password": password}
    )
    assert login.status_code == 200, login.text
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    headers = _csrf(client, headers)

    response = client.patch(
        f"/api/v1/admin/orders/tasks/{uuid.uuid4()}/assign",
        headers=headers,
        json={"assigned_to": str(employee.id)},
    )
    assert response.status_code == 403, response.text
