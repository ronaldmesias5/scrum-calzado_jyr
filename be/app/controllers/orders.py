"""Controlador de órdenes (wrappers hacia `services.orders`).

Incluye adaptadores que los routers pueden invocar. Añadir funciones
concreta según necesidad al migrar cada endpoint desde `routers/orders.py`.
"""

from typing import Annotated
from sqlalchemy.orm import Session
import uuid

from app.models.order import Order
from app.services import orders as orders_service


# Expose same names as service for backward compatibility with routers
def _order_to_response(order: Order):
    return orders_service._order_to_response(order)


def _order_to_detail_response(order: Order):
    return orders_service._order_to_detail_response(order)


def apply_order_state_inventory(
    db: Annotated[Session, ...], current_user_id: uuid.UUID, order: Order, new_state
):
    return orders_service.apply_order_state_inventory(
        db=db, current_user_id=current_user_id, order=order, new_state=new_state
    )


def apply_detail_state_inventory(
    db: Annotated[Session, ...],
    current_user_id: uuid.UUID,
    order: Order,
    detail_data,
    old_detail,
):
    """Forward the signature expected by routers to the service implementation."""
    return orders_service.apply_detail_state_inventory(
        db=db,
        current_user_id=current_user_id,
        order=order,
        detail_data=detail_data,
        old_detail=old_detail,
    )


def resolve_order_state_from_details(details):
    return orders_service.resolve_order_state_from_details(details)


def complete_emplantillado(db: Annotated[Session, ...], current_user_id: uuid.UUID, task):
    """Wrapper for service complete_emplantillado used by `routers/orders_tasks.py`."""
    return orders_service.complete_emplantillado(db=db, current_user_id=current_user_id, task=task)


def create_order(
    *,
    db: Annotated[Session, ...],
    customer_id: uuid.UUID,
    total_pairs: int,
    delivery_date,
    details,
    created_by: uuid.UUID,
):
    return orders_service.create_order(
        db=db,
        customer_id=customer_id,
        total_pairs=total_pairs,
        delivery_date=delivery_date,
        details=details,
        created_by=created_by,
    )
