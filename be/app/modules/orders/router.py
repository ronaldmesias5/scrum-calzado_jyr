"""
Módulo: router.py (Orders)
Descripción: Rutas API para gestión de órdenes en el dashboard del jefe.
¿Para qué? Endpoints GET/POST/PATCH para órdenes: listar, obtener detalle, crear, actualizar estado.
¿Nota? Actualmente retorna respuestas vacías hasta que se migre completa la estructura.
"""

from typing import Annotated
from uuid import UUID
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import func, desc, select, delete as sa_delete
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.order import Order, OrderStatus, OrderDetail
from app.models.user import User
from app.models.product import Product
from app.modules.orders.schemas import (
    OrderResponse,
    OrderListResponse,
    OrderDetailResponse,
    OrderDetailItemResponse,
    OrderCreateRequest,
    OrderUpdateStatusRequest,
    OrderUpdateDetailsRequest,
)

def _order_to_response(order: Order) -> OrderResponse:
    """Serializa una Order incluyendo datos del cliente."""
    customer = order.customer
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=customer.name_user if customer else None,
        customer_last_name=customer.last_name if customer else None,
        customer_email=customer.email if customer else None,
        customer_phone=customer.phone if customer else None,
        total_pairs=order.total_pairs,
        state=order.state,
        creation_date=order.creation_date,
        created_at=order.created_at,
    )


def _order_to_detail_response(order: Order) -> OrderDetailResponse:
    """Serializa una Order con detalles e info del cliente."""
    customer = order.customer
    return OrderDetailResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=customer.name_user if customer else None,
        customer_last_name=customer.last_name if customer else None,
        customer_email=customer.email if customer else None,
        customer_phone=customer.phone if customer else None,
        total_pairs=order.total_pairs,
        state=order.state,
        creation_date=order.creation_date,
        delivery_date=order.delivery_date,
        created_at=order.created_at,
        updated_at=order.updated_at,
        deleted_at=order.deleted_at,
        details=[
            OrderDetailItemResponse(
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
                order_date=d.order_date,
            )
            for d in order.details
        ],
    )


router = APIRouter(
    prefix="/api/v1/admin/orders",
    tags=["orders"],
)


@router.get("", response_model=OrderListResponse)
def list_orders(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1, description="Página (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Elementos por página"),
    state: OrderStatus | None = Query(None, description="Filtrar por estado"),
    customer_name: str | None = Query(None, description="Filtrar por nombre/apellido del cliente"),
) -> OrderListResponse:
    """
    Obtiene listado paginado de órdenes.
    """
    try:
        query = select(Order)

        if state:
            query = query.where(Order.state == state)

        if customer_name:
            name_filter = f"%{customer_name.strip()}%"
            query = query.join(User, Order.customer_id == User.id).where(
                (User.name_user.ilike(name_filter)) | (User.last_name.ilike(name_filter))
            )

        # Contar total
        count_query = select(func.count(Order.id)).select_from(Order)
        if state:
            count_query = count_query.where(Order.state == state)
        if customer_name:
            name_filter = f"%{customer_name.strip()}%"
            count_query = count_query.join(User, Order.customer_id == User.id).where(
                (User.name_user.ilike(name_filter)) | (User.last_name.ilike(name_filter))
            )

        total = db.execute(count_query).scalar() or 0

        # Aplicar paginación
        offset = (page - 1) * page_size
        query = query.order_by(desc(Order.created_at)).offset(offset).limit(page_size)

        result = db.execute(query)
        orders = result.scalars().all()

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        return OrderListResponse(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            items=[_order_to_response(order) for order in orders],
        )
    except Exception as e:
        print(f"Error en list_orders: {e}")
        # Retornar respuesta vacía en caso de error
        return OrderListResponse(total=0, page=page, page_size=page_size, total_pages=0, items=[])


@router.get("/{order_id}", response_model=OrderDetailResponse)
def get_order_detail(
    order_id: UUID,
    db: Annotated[Session, Depends(get_db)],
) -> OrderDetailResponse:
    """
    Obtiene detalle completo de una orden.
    """
    try:
        result = db.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(status_code=404, detail="Orden no encontrada")

        return _order_to_detail_response(order)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error en get_order_detail: {e}")
        raise HTTPException(status_code=500, detail="Error al obtener la orden")


@router.post("", response_model=OrderDetailResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderDetailResponse:
    """
    Crea una nueva orden mayorista.
    Solo el jefe (ocupación='jefe') puede crear órdenes.
    """
    try:
        # Verificar que el usuario sea jefe
        if current_user.occupation != "jefe":
            raise HTTPException(
                status_code=403,
                detail="Solo el jefe puede crear órdenes"
            )
        
        # Verificar que el cliente existe
        customer_check = db.execute(
            select(User).where(User.id == order_data.customer_id)
        ).scalar_one_or_none()
        
        if not customer_check:
            raise HTTPException(
                status_code=404,
                detail="Cliente no encontrado"
            )
        
        # Crear orden
        new_order = Order(
            customer_id=order_data.customer_id,
            total_pairs=order_data.total_pairs,
            state=OrderStatus.pendiente,
            delivery_date=order_data.delivery_date,
            creation_date=datetime.now(timezone.utc),
        )
        
        # Agregar líneas de pedido
        for detail_data in order_data.details:
            detail = OrderDetail(
                product_id=detail_data.product_id,
                size=detail_data.size,
                colour=detail_data.colour,
                amount=detail_data.amount,
                state=OrderStatus.pendiente,
                order_date=datetime.now(timezone.utc),
            )
            new_order.details.append(detail)
        
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        
        return _order_to_detail_response(new_order)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error en create_order: {e}")
        raise HTTPException(status_code=500, detail=f"Error al crear la orden: {str(e)}")


@router.patch("/{order_id}/status", response_model=OrderDetailResponse)
def update_order_status(
    order_id: UUID,
    order_update: OrderUpdateStatusRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderDetailResponse:
    """
    Actualiza el estado de una orden.
    """
    try:
        # Verificar que el usuario sea jefe
        if current_user.occupation != "jefe":
            raise HTTPException(
                status_code=403,
                detail="Solo el jefe puede actualizar órdenes"
            )
        
        result = db.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(status_code=404, detail="Orden no encontrada")

        # Actualizar con el campo correcto 'state'
        order.state = order_update.state
        db.commit()
        db.refresh(order)

        return _order_to_detail_response(order)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error en update_order_status: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar el estado")


@router.put("/{order_id}", response_model=OrderDetailResponse)
def update_order_details(
    order_id: UUID,
    order_data: OrderUpdateDetailsRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderDetailResponse:
    """
    Actualiza los detalles (líneas de producto) de una orden pendiente o en producción.
    Reemplaza todos los detalles existentes con los nuevos proporcionados.
    """
    if current_user.occupation != "jefe":
        raise HTTPException(
            status_code=403,
            detail="Solo el jefe puede editar órdenes",
        )

    result = db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    if order.state in (OrderStatus.cancelado, OrderStatus.completado):
        raise HTTPException(
            status_code=400,
            detail="No se pueden editar pedidos cancelados o completados",
        )

    if not order_data.details:
        raise HTTPException(
            status_code=400,
            detail="El pedido debe tener al menos una línea de detalle",
        )

    try:
        db.execute(sa_delete(OrderDetail).where(OrderDetail.order_id == order.id))

        total_pairs = 0
        for detail_data in order_data.details:
            detail = OrderDetail(
                order_id=order.id,
                product_id=detail_data.product_id,
                size=detail_data.size,
                colour=detail_data.colour,
                amount=detail_data.amount,
                state=order.state,
                order_date=datetime.now(timezone.utc),
            )
            db.add(detail)
            total_pairs += detail_data.amount

        order.total_pairs = total_pairs
        if order_data.delivery_date is not None:
            order.delivery_date = order_data.delivery_date

        db.commit()
        db.refresh(order)
        return _order_to_detail_response(order)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error en update_order_details: {e}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar la orden: {str(e)}")


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> None:
    """
    Elimina permanentemente una orden cancelada.
    Solo se permite eliminar pedidos en estado 'cancelado'.
    """
    if current_user.occupation != "jefe":
        raise HTTPException(
            status_code=403,
            detail="Solo el jefe puede eliminar órdenes",
        )

    result = db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    if order.state != OrderStatus.cancelado:
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden eliminar pedidos en estado cancelado",
        )

    try:
        # Eliminar los detalles primero y luego la orden
        db.execute(sa_delete(OrderDetail).where(OrderDetail.order_id == order.id))
        db.delete(order)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error al eliminar orden: {e}")
        raise HTTPException(status_code=500, detail="Error al eliminar la orden")

