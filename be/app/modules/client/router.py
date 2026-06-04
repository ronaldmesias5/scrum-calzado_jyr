import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc, func
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import get_db, get_current_user
from app.models.order import Order, OrderDetail
from app.models.user import User
from app.models.product import Product
from app.modules.client.schemas import (
    ClientOrderResponse,
    ClientOrderListResponse,
    ClientOrderDetailItem,
)

router = APIRouter(
    prefix="/api/v1/client",
    tags=["client"],
)


def _order_to_client_response(order: Order) -> ClientOrderResponse:
    return ClientOrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        total_pairs=order.total_pairs,
        state=order.state,
        creation_date=order.creation_date,
        delivery_date=order.delivery_date,
        created_at=order.created_at,
        updated_at=order.updated_at,
        details=[
            ClientOrderDetailItem(
                id=d.id,
                product_id=d.product_id,
                product_name=d.product.name_product if d.product else None,
                style_name=d.product.style.name_style if (d.product and d.product.style) else None,
                category_name=d.product.category.name_category if (d.product and d.product.category) else None,
                brand_name=d.product.brand.name_brand if (d.product and d.product.brand) else None,
                image_url=d.product.image_url if d.product else None,
                size=d.size,
                colour=d.colour,
                amount=d.amount,
                state=d.state,
            )
            for d in order.details
        ],
    )


@router.get("/orders", response_model=ClientOrderListResponse)
def list_my_orders(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientOrderListResponse:
    """Lista los pedidos del cliente autenticado."""
    query = (
        select(Order)
        .options(
            selectinload(Order.details).selectinload(OrderDetail.product).selectinload(Product.inventory)
        )
        .where(Order.customer_id == current_user.id)
        .order_by(desc(Order.created_at))
    )
    result = db.execute(query)
    orders = result.scalars().all()

    total_query = select(func.count(Order.id)).where(Order.customer_id == current_user.id)
    total = db.execute(total_query).scalar() or 0

    return ClientOrderListResponse(
        total=total,
        items=[_order_to_client_response(o) for o in orders],
    )


@router.get("/orders/{order_id}", response_model=ClientOrderResponse)
def get_my_order(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientOrderResponse:
    """Obtiene detalle de un pedido específico del cliente autenticado."""
    query = (
        select(Order)
        .options(
            selectinload(Order.details).selectinload(OrderDetail.product).selectinload(Product.inventory)
        )
        .where(Order.id == order_id, Order.customer_id == current_user.id)
    )
    result = db.execute(query)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    return _order_to_client_response(order)
