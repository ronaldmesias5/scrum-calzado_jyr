"""
Módulo: router.py (Orders)
Descripción: Rutas CRUD de órdenes en el dashboard del jefe.
¿Para qué? Endpoints GET/POST/PATCH/PUT/DELETE para órdenes: listar, obtener detalle,
crear, actualizar estado/detalles, eliminar.
¿Nota? La serialización y la lógica de reservas de inventario viven en service.py.
Las tareas de producción viven en tasks.py (mismo prefix y tag).
"""

import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import delete as sa_delete
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session, selectinload

from app.config import settings
from app.dependencies import _require_jefe, get_current_user, get_db
from app.models.order import Order, OrderDetail, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.orders import (
    OrderCreateRequest,
    OrderDetailResponse,
    OrderListResponse,
    OrderUpdateDetailsRequest,
    OrderUpdateStatusRequest,
)
from app.controllers.orders import (
    _order_to_detail_response,
    _order_to_response,
    apply_detail_state_inventory,
    apply_order_state_inventory,
    resolve_order_state_from_details,
)

router = APIRouter(
    prefix="/api/v1/admin/orders",
    tags=["orders"],
)


def _trigger_notifications(*, db: Session, new_order, customer_check, settings) -> None:
    """
    Fire-and-forget vía thread para no bloquear la respuesta HTTP.
    Crea notificaciones en BD (síncrono, hecho en esta misma transacción),
    y lanza WebSocket + emails en un thread separado con su propio event loop.
    """
    import asyncio
    import threading

    from app.models.notifications import NotificationType
    from app.controllers.notifications import create_notification, get_jefes
    from app.utils.ws_manager import ws_manager
    from app.utils.email import send_order_confirmation_email, send_order_notification_email

    client_full = (
        f"{customer_check.name_user} {customer_check.last_name}".strip()
        or customer_check.email
    )
    order_date_str = (
        new_order.creation_date.strftime("%d/%m/%Y %H:%M")
        if new_order.creation_date else ""
    )
    delivery_str = (
        new_order.delivery_date.strftime("%d/%m/%Y")
        if new_order.delivery_date else "Por definir"
    )

    # ── Síncrono: crear notificaciones en BD ──
    jefes = get_jefes(db)
    link = f"{settings.FRONTEND_URL}/dashboard/admin/orders"
    notifications_data: list[dict] = []
    for jefe in jefes:
        notif = create_notification(
            db=db,
            user_id=jefe.id,
            title="Nuevo Pedido Mayorista",
            message=f"{client_full} ha realizado un pedido de {new_order.total_pairs} pares",
            type_=NotificationType.info,
            order_id=new_order.id,
            link_url=link,
            created_by=customer_check.id,
        )
        notifications_data.append({
            "jefe_id": str(jefe.id),
            "jefe_email": jefe.email,
            "jefe_name": jefe.name_user or jefe.email,
            "notif_id": str(notif.id),
            "notif_title": notif.title_notification,
            "notif_message": notif.message_notification,
            "notif_created_at": notif.created_at.isoformat(),
            "order_id": str(new_order.id),
            "link_url": link,
        })

    # ── Async fire-and-forget en thread separado ──
    client_email = customer_check.email
    client_name = customer_check.name_user or customer_check.email
    total_pairs = new_order.total_pairs

    def _run_async_tasks() -> None:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            async def _tasks():
                tasks = []
                # WebSocket broadcast a cada jefe
                for nd in notifications_data:
                    tasks.append(ws_manager.broadcast_to_user(nd["jefe_id"], {
                        "type": "new_order",
                        "notification": {
                            "id": nd["notif_id"],
                            "title": nd["notif_title"],
                            "message": nd["notif_message"],
                            "order_id": nd["order_id"],
                            "link_url": nd["link_url"],
                            "created_at": nd["notif_created_at"],
                        }
                    }))
                    # Email al jefe
                    tasks.append(send_order_notification_email(
                        jefe_email=nd["jefe_email"],
                        jefe_name=nd["jefe_name"],
                        order_id=nd["order_id"],
                        client_name=client_full,
                        total_pairs=total_pairs,
                        order_date=order_date_str,
                    ))
                # Email de confirmación al cliente
                tasks.append(send_order_confirmation_email(
                    client_email=client_email,
                    client_name=client_name,
                    order_id=notifications_data[0]["order_id"] if notifications_data else "",
                    total_pairs=total_pairs,
                    delivery_date=delivery_str,
                ))
                await asyncio.gather(*tasks, return_exceptions=True)
            loop.run_until_complete(_tasks())
        finally:
            loop.close()

    t = threading.Thread(target=_run_async_tasks, daemon=True)
    t.start()


@router.get("", response_model=OrderListResponse)
def list_orders(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1, description="Página (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Elementos por página"),
    state: OrderStatus | None = Query(None, description="Filtrar por estado"),
    customer_name: str | None = Query(None, description="Filtrar por nombre/apellido del cliente"),
) -> OrderListResponse:
    """
    Obtiene listado paginado de órdenes.
    """
    _require_jefe(current_user)
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
    except Exception:
        import traceback
        traceback.print_exc()
        # Retornar respuesta vacía en caso de error
        return OrderListResponse(total=0, page=page, page_size=page_size, total_pages=0, items=[])


@router.get("/{order_id}", response_model=OrderDetailResponse)
def get_order_detail(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderDetailResponse:
    """
    Obtiene detalle completo de una orden.
    """
    _require_jefe(current_user)
    try:
        result = db.execute(
            select(Order)
            .options(
                selectinload(Order.details)
                .selectinload(OrderDetail.product)
                .selectinload(Product.inventory)
            )
            .where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(status_code=404, detail="Orden no encontrada")

        return _order_to_detail_response(order)
    except HTTPException:
        raise
    except Exception:
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
        _require_jefe(current_user)

        from app.controllers.orders import create_order as _create_order

        new_order = _create_order(
            db=db,
            customer_id=order_data.customer_id,
            total_pairs=order_data.total_pairs,
            delivery_date=order_data.delivery_date,
            details=order_data.details,
            created_by=current_user.id,
        )

        # Verificar que el cliente existe (para notificaciones)
        customer_check = db.execute(
            select(User).where(User.id == order_data.customer_id)
        ).scalar_one_or_none()

        # ─── NOTIFICACIONES: notificar al jefe + email (fire-and-forget vía thread) ───
        _trigger_notifications(
            db=db,
            new_order=new_order,
            customer_check=customer_check,
            settings=settings,
        )

        return _order_to_detail_response(new_order)

    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear la orden: {e!s}")


@router.patch("/{order_id}/status", response_model=OrderDetailResponse)
def update_order_status(
    order_id: uuid.UUID,
    order_update: OrderUpdateStatusRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderDetailResponse:
    """
    Actualiza el estado de una orden.
    """
    try:
        _require_jefe(current_user)

        result = db.execute(select(Order).where(Order.id == order_id))
        order = result.scalar_one_or_none()

        if not order:
            raise HTTPException(status_code=404, detail="Orden no encontrada")

        # --- Lógica de Inventario Segura con Reservas ---
        # FLUJO:
        # - Pedido 'completado' -> SUMAR a reserved (entrada de pares fabricados)
        # - Pedido 'entregado' -> RESTAR de reserved (salida de pares fabricados)
        apply_order_state_inventory(
            db=db,
            current_user_id=current_user.id,
            order=order,
            new_state=order_update.state,
        )

        # Actualizar estado de la orden
        order.state = order_update.state

        db.commit()
        db.refresh(order)
        # Refrescar explícitamente los detalles después del commit
        for detail in order.details:
            db.refresh(detail)

        return _order_to_detail_response(order)
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar el estado")


@router.put("/{order_id}", response_model=OrderDetailResponse)
def update_order_details(
    order_id: uuid.UUID,
    order_data: OrderUpdateDetailsRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> OrderDetailResponse:
    """
    Actualiza los detalles (líneas de producto) de una orden pendiente o en producción.
    Reemplaza todos los detalles existentes con los nuevos proporcionados.
    """
    _require_jefe(current_user)

    result = db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    # Permitir cambios de estado en detalles incluso si la orden está completada,
    # pero bloquear ediciones de cantidades/datos en órdenes canceladas o completadas
    if order.state == OrderStatus.cancelado:
        raise HTTPException(
            status_code=400,
            detail="No se pueden editar pedidos cancelados",
        )

    if not order_data.details:
        raise HTTPException(
            status_code=400,
            detail="El pedido debe tener al menos una línea de detalle",
        )

    try:
        # 0. Primero, obtener los detalles ANTIGUOS para comparar estados
        old_details = db.query(OrderDetail).filter(OrderDetail.order_id == order.id).all()
        # Índice compuesto por (product_id, size, colour) para emparejar correctamente
        # cada línea antigua con su nueva versión, incluso cuando hay múltiples tallas/colores.
        old_details_map = {
            (d.product_id, d.size, d.colour or ""): d for d in old_details
        }

        # 1. Eliminar detalles antiguos
        db.execute(sa_delete(OrderDetail).where(OrderDetail.order_id == order.id))

        # 2. Crear los NUEVOS detalles
        total_pairs = 0
        for detail_data in order_data.details:
            detail = OrderDetail(
                order_id=order.id,
                product_id=detail_data.product_id,
                size=detail_data.size,
                colour=detail_data.colour,
                amount=detail_data.amount,
                state=detail_data.state or order.state,
                observations=detail_data.observations,
                line_group=detail_data.line_group,
                order_date=datetime.now(UTC),
                created_by=current_user.id
            )
            db.add(detail)
            total_pairs += detail_data.amount

            # 2.1/2.2 LÓGICA DE INVENTARIO: según el cambio de estado de la línea
            old_detail = old_details_map.get((detail_data.product_id, detail_data.size, detail_data.colour or ""))
            apply_detail_state_inventory(
                db=db,
                current_user_id=current_user.id,
                order=order,
                detail_data=detail_data,
                old_detail=old_detail,
            )

        # 4. Actualizar cabecera del pedido
        order.total_pairs = total_pairs
        if order_data.delivery_date is not None:
            order.delivery_date = order_data.delivery_date

        # 5. Determinar automáticamente el nuevo estado de la orden
        # Calculado directamente desde order_data.details (evita problema con autoflush=False)
        resolved_state = resolve_order_state_from_details(order_data.details)
        if resolved_state is not None:
            order.state = resolved_state

        order.updated_at = datetime.now(UTC)
        db.commit()
        db.refresh(order)
        return _order_to_detail_response(order)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar la orden: {e!s}")


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: uuid.UUID,
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
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar la orden")
