"""
Módulo: router.py (Orders)
Descripción: Rutas API para gestión de órdenes en el dashboard del jefe.
¿Para qué? Endpoints GET/POST/PATCH para órdenes: listar, obtener detalle, crear, actualizar estado.
¿Nota? Actualmente retorna respuestas vacías hasta que se migre completa la estructura.
"""

import uuid
from typing import Annotated
from datetime import datetime, timezone
from decimal import Decimal
import traceback

from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy import func, desc, select, delete as sa_delete, update as sa_update, and_
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.config import settings
from app.core.dependencies import get_db, get_current_user, _require_jefe
from app.models.order import Order, OrderStatus, OrderDetail
from app.models.user import User
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement, InventoryMovementType
from app.models.tasks import Task
from app.modules.orders.schemas import (
    OrderResponse,
    OrderListResponse,
    OrderDetailResponse,
    OrderDetailItemResponse,
    OrderCreateRequest,
    OrderUpdateStatusRequest,
    OrderUpdateDetailsRequest,
    ProductionBatchTasksRequest,
    ProductionTaskResponse,
    TaskStatusUpdateRequest,
    AssignTaskEmployeeRequest,
)
from app.modules.supplies.service import deduct_supplies_for_production

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
                colour=d.colour or (d.product.color if d.product else None),
                amount=d.amount,
                line_group=d.line_group,
                stock_available=float(
                    sum(
                        inv.amount for inv in d.product.inventory 
                        if inv.size == d.size
                    )
                ) if d.product else 0.0,
                state=d.state,
                order_date=d.order_date,
                observations=d.observations,
            )
            for d in order.details
        ],
    )


router = APIRouter(
    prefix="/api/v1/admin/orders",
    tags=["orders"],
)


@router.get("/tasks/next-number", summary="Obtener el siguiente número de vale")
def get_next_vale_number(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    try:
        max_vale = db.execute(select(func.max(Task.vale_number))).scalar() or 0
        return {"next_number": int(max_vale) + 1}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al calcular número de vale: {str(e)}")


@router.get("/tasks/all", response_model=list[ProductionTaskResponse])
def list_all_production_tasks(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    status: str | None = Query(None, description="Filtrar por estado"),
    type: str | None = Query(None, description="Filtrar por tipo/cargo"),
    assigned_to: uuid.UUID | None = Query(None, description="Filtrar por empleado"),
) -> list[ProductionTaskResponse]:
    """
    Lista TODAS las tareas de producción del sistema con filtros.
    """
    try:
        # Subconsulta para obtener el total de pares por orden y producto
        pairs_subquery = (
            select(OrderDetail.order_id, OrderDetail.product_id, func.sum(OrderDetail.amount).label("total"))
            .where(OrderDetail.deleted_at == None)
            .group_by(OrderDetail.order_id, OrderDetail.product_id)
            .subquery()
        )

        query = select(Task, pairs_subquery.c.total).outerjoin(
            pairs_subquery,
            and_(Task.order_id == pairs_subquery.c.order_id, Task.product_id == pairs_subquery.c.product_id)
        ).options(joinedload(Task.product)).where(Task.deleted_at == None)

        if status:
            query = query.where(Task.status == status)
        if type:
            query = query.where(Task.type == type)
        if assigned_to:
            query = query.where(Task.assigned_to == assigned_to)
        
        query = query.order_by(desc(Task.created_at))
        result = db.execute(query)
        tasks_data = result.all()  # Retorna tuplas (Task, total)
        
        tasks_list = []
        for t, total in tasks_data:
            try:
                tasks_list.append(ProductionTaskResponse(
                    id=t.id,
                    order_id=t.order_id,
                    product_id=t.product_id,
                    assigned_to=t.assigned_to,
                    assigned_user_name=t.assigned_user.name_user + " " + t.assigned_user.last_name if t.assigned_user else "Sin asignar",
                    assigned_user_occupation=t.assigned_user.occupation if t.assigned_user else None,
                    type=t.type,
                    status=t.status,
                    vale_number=t.vale_number,
                    observation=t.observation,
                    created_at=t.created_at,
                    task_prices=t.product.task_prices if t.product else {},
                    total_pairs=t.amount if t.amount > 0 else int(total or 0),
                    amount=t.amount if t.amount > 0 else int(total or 0),
                    description_task=t.description_task,
                    product_name=t.product.name_product if t.product else None,
                    product_category=t.product.category.name_category if t.product and t.product.category else None,
                    product_image=t.product.image_url if t.product else None
                ))
            except Exception as e:
                traceback.print_exc()
                continue
        
        return tasks_list

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al listar tareas: {str(e)}")


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
    except Exception as e:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al obtener la orden")


def _trigger_notifications(*, db: Session, new_order, customer_check, settings) -> None:
    """
    Fire-and-forget vía thread para no bloquear la respuesta HTTP.
    Crea notificaciones en BD (síncrono, hecho en esta misma transacción),
    y lanza WebSocket + emails en un thread separado con su propio event loop.
    """
    import asyncio
    import threading

    from app.modules.notifications.service import create_notification, get_jefes
    from app.modules.notifications.ws_manager import ws_manager
    from app.models.notifications import NotificationType
    from app.utils.email import send_order_notification_email, send_order_confirmation_email

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
        
        # Agregar líneas de pedido (SIN descontar stock físico)
        for detail_data in order_data.details:
            detail = OrderDetail(
                product_id=detail_data.product_id,
                size=detail_data.size,
                colour=detail_data.colour,
                amount=detail_data.amount,
                state=OrderStatus.pendiente,
                order_date=datetime.now(timezone.utc),
                created_by=current_user.id,
                line_group=detail_data.line_group,
                observations=detail_data.observations,
            )
            new_order.details.append(detail)
        
        db.add(new_order)
        db.commit()
        db.refresh(new_order)

        # ─── NOTIFICACIONES: notificar al jefe + email (fire-and-forget vía thread) ───
        _trigger_notifications(
            db=db,
            new_order=new_order,
            customer_check=customer_check,
            settings=settings,
        )

        return _order_to_detail_response(new_order)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear la orden: {str(e)}")


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

        # --- Lógica de Inventario Segura con Reservas ---
        # FLUJO:
        # - Pedido 'completado' -> SUMAR a reserved (entrada de pares fabricados)
        # - Pedido 'entregado' -> RESTAR de reserved (salida de pares fabricados)
        
        # 1. Caso: El pedido pasa a 'completado' -> SUMAR A RESERVED (entrada de pares fabricados)
        if order_update.state == OrderStatus.completado and order.state != OrderStatus.completado:
            for detail in order.details:
                stmt = select(Inventory).where(
                    (Inventory.product_id == detail.product_id) &
                    (Inventory.size == detail.size) &
                    (Inventory.colour == detail.colour) &
                    (Inventory.deleted_at == None)
                )
                inventory_item = db.execute(stmt).scalar_one_or_none()
                
                quantity = Decimal(detail.amount)
                
                if inventory_item:
                    # SUMAR a reserved (entrada de pares fabricados del pedido)
                    inventory_item.reserved += quantity
                    db.add(inventory_item)
                else:
                    # Crear nuevo registro si no existe
                    inventory_item = Inventory(
                        id=uuid.uuid4(),
                        product_id=detail.product_id,
                        size=detail.size,
                        colour=detail.colour,
                        amount=0,  # Stock bodega se mantiene en 0, solo reserved tiene los del pedido
                        reserved=quantity,
                        minimum_stock=0
                    )
                    db.add(inventory_item)
                
                # Registrar la entrada de pares fabricados
                db.add(InventoryMovement(
                    id=uuid.uuid4(),
                    product_id=detail.product_id,
                    user_id=current_user.id,
                    type_of_movement=InventoryMovementType.entrada,
                    size=detail.size,
                    colour=detail.colour,
                    amount=quantity,
                    reason=f"Entrada de pares fabricados - Pedido {order.id}",
                    movement_date=datetime.now(timezone.utc)
                ))
        
        # 2. Caso: El pedido pasa a 'entregado' -> RESTAR DE RESERVED (salida de pares fabricados)
        elif order_update.state == OrderStatus.entregado and order.state != OrderStatus.entregado:
            for detail in order.details:
                stmt = select(Inventory).where(
                    (Inventory.product_id == detail.product_id) &
                    (Inventory.size == detail.size) &
                    (Inventory.colour == detail.colour) &
                    (Inventory.deleted_at == None)
                )
                inventory_item = db.execute(stmt).scalar_one_or_none()
                
                if inventory_item:
                    quantity = Decimal(detail.amount)
                    
                    # RESTAR de reserved (salida de pares fabricados que se entregan)
                    if inventory_item.reserved >= quantity:
                        inventory_item.reserved -= quantity
                        db.add(inventory_item)

                    # Registrar la salida de pares al cliente
                    db.add(InventoryMovement(
                        id=uuid.uuid4(),
                        product_id=detail.product_id,
                        user_id=current_user.id,
                        type_of_movement=InventoryMovementType.salida,
                        size=detail.size,
                        colour=detail.colour,
                        amount=quantity,
                        reason=f"Entrega al cliente - Pedido {order.id}",
                        movement_date=datetime.now(timezone.utc)
                    ))
        
        # 3. Caso: El pedido vuelve atrás desde 'completado' a otro estado
        # Revertir: RESTAR de reserved lo que se había sumado
        elif order.state == OrderStatus.completado and order_update.state not in (OrderStatus.completado, OrderStatus.entregado):
            for detail in order.details:
                stmt = select(Inventory).where(
                    (Inventory.product_id == detail.product_id) &
                    (Inventory.colour == detail.colour) &
                    (Inventory.size == detail.size) &
                    (Inventory.deleted_at == None)
                )
                inventory_item = db.execute(stmt).scalar_one_or_none()
                
                if inventory_item:
                    quantity = Decimal(detail.amount)
                    
                    # Restaurar a RESERVED si vuelve atrás
                    inventory_item.reserved -= quantity
                    db.add(inventory_item)
                    
                    # Registrar devolución
                    db.add(InventoryMovement(
                        id=uuid.uuid4(),
                        product_id=detail.product_id,
                        user_id=current_user.id,
                        type_of_movement=InventoryMovementType.entrada,
                        size=detail.size,
                        colour=detail.colour,
                        amount=quantity,
                        reason=f"Devolución: Pedido #{order.id} cambió de completado a {order_update.state.value}",
                        movement_date=datetime.now(timezone.utc)
                    ))
        
        # Actualizar estado de la orden
        order.state = order_update.state
        
        # Si la orden pasa a 'entregado', actualizar TODOS los detalles a 'entregado' con UPDATE SQL explícito
        if order_update.state == OrderStatus.entregado:
            db.execute(
                sa_update(OrderDetail).where(
                    OrderDetail.order_id == order_id
                ).values(state=OrderStatus.entregado)
            )
        
        db.commit()
        db.refresh(order)
        # Refrescar explícitamente los detalles después del commit
        for detail in order.details:
            db.refresh(detail)

        return _order_to_detail_response(order)
    except HTTPException:
        raise
    except Exception as e:
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
    if current_user.occupation != "jefe":
        raise HTTPException(
            status_code=403,
            detail="Solo el jefe puede editar órdenes",
        )

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
                order_date=datetime.now(timezone.utc),
                created_by=current_user.id
            )
            db.add(detail)
            total_pairs += detail_data.amount
            
            # 2.1 LÓGICA DE INVENTARIO: Si un producto pasa a "entregado"
            old_detail = old_details_map.get((detail_data.product_id, detail_data.size, detail_data.colour or ""))
            if old_detail and old_detail.state != OrderStatus.entregado and detail_data.state == OrderStatus.entregado:
                # Pasar de completado -> entregado: RESTAR de reserved
                stmt = select(Inventory).where(
                    (Inventory.product_id == detail_data.product_id) &
                    (Inventory.size == detail_data.size) &
                    (Inventory.deleted_at == None)
                ).limit(1)
                inventory_item = db.execute(stmt).scalar_one_or_none()
                
                if inventory_item:
                    quantity = Decimal(detail_data.amount)
                    
                    # RESTAR de reserved (salida de pares fabricados que se entregan)
                    if inventory_item.reserved >= quantity:
                        inventory_item.reserved -= quantity
                        db.add(inventory_item)

                    # Registrar la salida de pares al cliente
                    db.add(InventoryMovement(
                        id=uuid.uuid4(),
                        product_id=detail_data.product_id,
                        user_id=current_user.id,
                        type_of_movement=InventoryMovementType.salida,
                        size=detail_data.size,
                        colour=detail_data.colour,
                        amount=quantity,
                        reason=f"Entrega al cliente - Pedido {order.id}",
                        movement_date=datetime.now(timezone.utc)
                    ))
            
            # 2.2 LÓGICA DE INVENTARIO: Si un producto pasa a "completado" (desde otro estado que no sea completado/entregado)
            elif old_detail and old_detail.state not in (OrderStatus.completado, OrderStatus.entregado) and detail_data.state == OrderStatus.completado:
                # Determinar si es "Completado desde bodega" (stock existente) o fabricación real
                is_from_warehouse = detail_data.observations and "Completado desde bodega" in (detail_data.observations or "")

                stmt = select(Inventory).where(
                    (Inventory.product_id == detail_data.product_id) &
                    (Inventory.size == detail_data.size) &
                    (Inventory.deleted_at == None)
                ).limit(1)
                inventory_item = db.execute(stmt).scalar_one_or_none()

                quantity = Decimal(detail_data.amount)

                if is_from_warehouse:
                    # ─── CASO "COMPLETADO DESDE BODEGA": descontar del stock (amount) ───
                    if inventory_item:
                        inventory_item.amount -= quantity
                        inventory_item.reserved += quantity
                        db.add(inventory_item)
                    else:
                        # Crear registro si no existe (con saldo negativo)
                        inventory_item = Inventory(
                            id=uuid.uuid4(),
                            product_id=detail_data.product_id,
                            size=detail_data.size,
                            colour=detail_data.colour,
                            amount=-quantity,
                            reserved=Decimal(0),
                            minimum_stock=0
                        )
                        db.add(inventory_item)

                    # Registrar movimiento de salida (stock sale de bodega)
                    db.add(InventoryMovement(
                        id=uuid.uuid4(),
                        product_id=detail_data.product_id,
                        user_id=current_user.id,
                        type_of_movement=InventoryMovementType.salida,
                        size=detail_data.size,
                        colour=detail_data.colour,
                        amount=quantity,
                        reason=f"Despacho desde bodega - Pedido {order.id}",
                        movement_date=datetime.now(timezone.utc)
                    ))
                else:
                    # ─── CASO FABRICACIÓN: sumar a reserved (pares fabricados) ───
                    if inventory_item:
                        inventory_item.reserved += quantity
                        db.add(inventory_item)
                    else:
                        inventory_item = Inventory(
                            id=uuid.uuid4(),
                            product_id=detail_data.product_id,
                            size=detail_data.size,
                            colour=detail_data.colour,
                            amount=0,
                            reserved=quantity,
                            minimum_stock=0
                        )
                        db.add(inventory_item)

                    # Registrar la entrada de pares fabricados
                    db.add(InventoryMovement(
                        id=uuid.uuid4(),
                        product_id=detail_data.product_id,
                        user_id=current_user.id,
                        type_of_movement=InventoryMovementType.entrada,
                        size=detail_data.size,
                        colour=detail_data.colour,
                        amount=quantity,
                        reason=f"Entrada de pares fabricados - Pedido {order.id}",
                        movement_date=datetime.now(timezone.utc)
                    ))

        # 4. Actualizar cabecera del pedido
        order.total_pairs = total_pairs
        if order_data.delivery_date is not None:
            order.delivery_date = order_data.delivery_date

        # 5. Determinar automáticamente el nuevo estado de la orden
        # Calculado directamente desde order_data.details (evita problema con autoflush=False)
        detail_states = [
            d.state if d.state is not None else OrderStatus.pendiente
            for d in order_data.details
        ]
        if detail_states:
            # Si TODOS están entregado -> entregado
            if all(s == OrderStatus.entregado for s in detail_states):
                order.state = OrderStatus.entregado
            # Si TODOS están completado o entregado (pero no todos entregado) -> completado
            elif all(s in (OrderStatus.completado, OrderStatus.entregado) for s in detail_states):
                order.state = OrderStatus.completado
            # Si alguno está en_progreso -> en_progreso
            elif any(s == OrderStatus.en_progreso for s in detail_states):
                order.state = OrderStatus.en_progreso
            # Si todos están pendiente -> pendiente
            elif all(s == OrderStatus.pendiente for s in detail_states):
                order.state = OrderStatus.pendiente
            # Else: mantener estado actual

        order.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(order)
        return _order_to_detail_response(order)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar la orden: {str(e)}")


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
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar la orden")

@router.post("/{order_id}/tasks", response_model=list[ProductionTaskResponse])
def create_production_tasks(
    order_id: uuid.UUID,
    request: ProductionBatchTasksRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ProductionTaskResponse]:
    """
    Crea un conjunto de tareas de producción para una orden.
    Los pares se reservarán en inventario cuando se completa la etapa final (emplantillado).
    """
    try:
        if current_user.occupation != "jefe":
            raise HTTPException(status_code=403, detail="Solo el jefe puede asignar tareas")
        
        # Verificar orden
        order = db.execute(select(Order).where(Order.id == order_id)).scalar_one_or_none()
        if not order:
            raise HTTPException(status_code=404, detail="Orden no encontrada")

        # NO reservar pares aquí - se reservarán cuando se complete emplantillado
        # Así evitamos contar los pares múltiples veces

        # Calcular siguiente vale_number global (solo si no existe ya para este order+product)
        max_vale = db.execute(select(func.max(Task.vale_number))).scalar() or 0
        next_vale = int(max_vale) + 1

        new_tasks = []
        now = datetime.now(timezone.utc)
        
        for t_data in request.tasks:
            # 1. Verificar si ya existe una tarea ACTIVA de este tipo para este order+product+line_group
            # (Evitar duplicados si el usuario hace clic varias veces)
            # Solo consideramos activas las que NO están canceladas
            existing_task = db.execute(
                select(Task).where(
                    Task.order_id == order_id,
                    Task.product_id == t_data.product_id,
                    Task.line_group == t_data.line_group,
                    Task.type == t_data.type,
                    Task.status != 'cancelado',
                    Task.deleted_at == None,
                )
            ).scalar_one_or_none()
            
            if existing_task:
                # Ya existe una tarea activa: actualizamos el assigned_to si cambió,
                # pero NO creamos un duplicado (solo si ambos tienen valor)
                if t_data.assigned_to is not None and str(existing_task.assigned_to or '') != str(t_data.assigned_to):
                    existing_task.assigned_to = t_data.assigned_to
                    db.add(existing_task)
                new_tasks.append(existing_task)
                continue

            # 2. Reutilizar el vale_number si ya existe una tarea para el mismo order+product
            existing_vale = db.execute(
                select(func.min(Task.vale_number)).where(
                    Task.order_id == order_id,
                    Task.product_id == t_data.product_id,
                    Task.line_group == t_data.line_group,
                    Task.vale_number.isnot(None)
                )
            ).scalar()
            task_vale = int(existing_vale) if existing_vale is not None else next_vale

            task = Task(
                id=uuid.uuid4(),
                assigned_to=t_data.assigned_to,
                order_id=order_id,
                product_id=t_data.product_id,
                line_group=t_data.line_group,
                vale_number=task_vale,
                amount=t_data.amount,
                type=t_data.type,
                description_task=t_data.description or f"Tarea de {t_data.type} para la orden {order_id}",
                priority=t_data.priority,
                assignment_date=now,
                created_by=current_user.id
            )
            db.add(task)
            # Si se asignó empleado, la tarea arranca en progreso
            if t_data.assigned_to is not None:
                task.status = 'en_progreso'
            new_tasks.append(task)
        
        # Deducir insumos para tareas de corte (todos los insumos se descuentan al iniciar corte)
        for t_data in request.tasks:
            if t_data.type == "corte" and t_data.breakdown:
                deduct_supplies_for_production(
                    product_id=t_data.product_id,
                    breakdown=t_data.breakdown,
                    current_user_id=current_user.id,
                    db=db,
                )

        db.commit()
        
        # Recargar tareas con producto para devolver task_prices y total_pairs
        task_ids = [t.id for t in new_tasks]
        
        pairs_subquery = (
            select(OrderDetail.order_id, OrderDetail.product_id, func.sum(OrderDetail.amount).label("total"))
            .group_by(OrderDetail.order_id, OrderDetail.product_id)
            .subquery()
        )

        query = select(Task, pairs_subquery.c.total).outerjoin(
            pairs_subquery,
            and_(Task.order_id == pairs_subquery.c.order_id, Task.product_id == pairs_subquery.c.product_id)
        ).options(joinedload(Task.product), joinedload(Task.assigned_user)).where(Task.id.in_(task_ids))
        
        reloaded_data = db.execute(query).unique().all()
        
        results = []
        for t, total in reloaded_data:
            results.append(ProductionTaskResponse(
                id=t.id,
                order_id=t.order_id,
                product_id=t.product_id,
                line_group=t.line_group,
                assigned_to=t.assigned_to,
                assigned_user_name=(t.assigned_user.name_user + " " + t.assigned_user.last_name) if t.assigned_user else "Sin asignar",
                assigned_user_occupation=t.assigned_user.occupation if t.assigned_user else None,
                type=t.type,
                status=t.status,
                vale_number=t.vale_number,
                created_at=t.created_at,
                observation=t.observation,
                task_prices=t.product.task_prices if t.product else {},
                total_pairs=t.amount if t.amount > 0 else int(total or 0),
                amount=t.amount if t.amount > 0 else int(total or 0),
                description_task=t.description_task,
                product_name=t.product.name_product if t.product else None,
                product_category=t.product.category.name_category if t.product and t.product.category else None,
                product_image=t.product.image_url if t.product else None

            ))
        
        return results
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al crear tareas: {str(e)}")

@router.patch("/tasks/{task_id}/assign", response_model=ProductionTaskResponse)
def assign_task_employee(
    task_id: uuid.UUID,
    request: AssignTaskEmployeeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ProductionTaskResponse:
    """Asigna un empleado a una tarea pendiente (sin empleado asignado aún)."""
    if current_user.occupation != "jefe":
        raise HTTPException(status_code=403, detail="Solo el jefe puede asignar empleados a tareas")
    
    # Obtener tarea
    query = select(Task).options(joinedload(Task.product)).where(Task.id == task_id)
    task = db.execute(query).unique().scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    # Verificar que el empleado existe
    employee = db.query(User).filter(User.id == request.assigned_to).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    
    # Asignar empleado
    task.assigned_to = request.assigned_to
    # Si estaba pendiente sin empleado, pasar a en_progreso automáticamente
    if task.status == 'pendiente':
        task.status = 'en_progreso'
    
    db.commit()
    
    user_name = f"{employee.name_user} {employee.last_name}"
    
    return ProductionTaskResponse(
        id=task.id,
        order_id=task.order_id,
        product_id=task.product_id,
        assigned_to=task.assigned_to,
        assigned_user_name=user_name,
        assigned_user_occupation=employee.occupation,
        type=task.type,
        status=task.status,
        description_task=task.description_task,
        vale_number=task.vale_number,
        created_at=task.created_at,
        observation=task.observation,
        task_prices=task.product.task_prices if task.product else {}
    )


@router.get("/{order_id}/tasks", response_model=list[ProductionTaskResponse])
def get_order_tasks(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    product_id: uuid.UUID | None = None,
) -> list[ProductionTaskResponse]:
    """
    Lista las tareas de producción de una orden.
    Si se pasa product_id, filtra al nivel del servidor (más preciso que filtrar en frontend).
    """
    try:
        pairs_subquery = (
            select(OrderDetail.order_id, OrderDetail.product_id, func.sum(OrderDetail.amount).label("total"))
            .group_by(OrderDetail.order_id, OrderDetail.product_id)
            .subquery()
        )

        query = select(Task, pairs_subquery.c.total).outerjoin(
            pairs_subquery,
            and_(Task.order_id == pairs_subquery.c.order_id, Task.product_id == pairs_subquery.c.product_id)
        ).options(joinedload(Task.product)).where(Task.order_id == order_id, Task.deleted_at == None)
        
        if product_id:
            query = query.where(Task.product_id == product_id)
        
        tasks_data = db.execute(query).all()
        
        return [
            ProductionTaskResponse(
                id=t.id,
                order_id=t.order_id,
                product_id=t.product_id,
                line_group=t.line_group,
                assigned_to=t.assigned_to,
                assigned_user_name=(t.assigned_user.name_user + " " + t.assigned_user.last_name) if t.assigned_user else "Sin asignar",
                assigned_user_occupation=t.assigned_user.occupation if t.assigned_user else None,
                type=t.type,
                status=t.status,
                vale_number=t.vale_number,
                created_at=t.created_at,
                observation=t.observation,
                task_prices=t.product.task_prices if t.product else {},
                total_pairs=t.amount if t.amount > 0 else int(total or 0),
                amount=t.amount if t.amount > 0 else int(total or 0),
                description_task=t.description_task,
                product_name=t.product.name_product if t.product else None,
                product_category=t.product.category.name_category if t.product and t.product.category else None,
                product_image=t.product.image_url if t.product else None
            ) for t, total in tasks_data
        ]
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al listar tareas: {str(e)}")

@router.patch("/tasks/{task_id}/status", response_model=ProductionTaskResponse)
def update_task_status(
    task_id: uuid.UUID,
    request: TaskStatusUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ProductionTaskResponse:
    """Actualiza el estado de una tarea de producción.
    Permite: jefe (cualquier tarea) o el empleado asignado (su propia tarea)."""
    # Obtener tarea con producto cargado
    query = select(Task).options(joinedload(Task.product)).where(Task.id == task_id)
    task = db.execute(query).unique().scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    # Verificar permiso: jefe o el empleado asignado
    if current_user.occupation != "jefe" and current_user.id != task.assigned_to:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar esta tarea")
    
    # Si la tarea estaba pendiente y se le asigna un employee por este endpoint,
    # y el request.status sigue siendo pendiente, pasarlo a en_progreso automáticamente
    # (esto ocurre cuando se asigna employee desde TasksPage)
    
    # Actualizar el status
    task.status = request.status
    
    # Asignar fecha de completado si se marca como completado por primera vez o si se marca como pagado
    if request.status in ["completado", "pagado"] and not task.completed_at:
        task.completed_at = datetime.now(timezone.utc)
    elif request.status in ["por_liquidar", "en_progreso"]:
        task.completed_at = None
    
    # ─── AUTO-CREAR SIGUIENTE ETAPA ───
    # Cuando una tarea se completa, crear automáticamente la siguiente etapa como pendiente
    STAGE_ORDER = ['corte', 'guarnicion', 'soladura', 'emplantillado']
    if request.status == 'completado':
        current_index = STAGE_ORDER.index(task.type) if task.type in STAGE_ORDER else -1
        if current_index >= 0 and current_index < len(STAGE_ORDER) - 1:
            next_type = STAGE_ORDER[current_index + 1]
            # Verificar si ya existe una tarea para la siguiente etapa
            existing_next = db.execute(
                select(Task).where(
                    Task.order_id == task.order_id,
                    Task.product_id == task.product_id,
                    Task.line_group == task.line_group,
                    Task.type == next_type,
                    Task.status != 'cancelado',
                    Task.deleted_at == None,
                )
            ).scalar_one_or_none()
            
            if existing_next is None:
                # Reutilizar el vale_number de la tarea actual
                now2 = datetime.now(timezone.utc)
                next_task = Task(
                    id=uuid.uuid4(),
                    assigned_to=None,  # pendiente, sin empleado
                    order_id=task.order_id,
                    product_id=task.product_id,
                    line_group=task.line_group,
                    vale_number=task.vale_number,
                    amount=task.amount,
                    type=next_type,
                    description_task=f"Tarea de {next_type} para la orden {task.order_id} (auto-generada)",
                    priority=task.priority,
                    assignment_date=now2,
                    created_by=current_user.id,
                    status='pendiente'
                )
                db.add(next_task)
    
    # Si es emplantillado + completado, actualizar OrderDetails y crear ENTRADA a inventario
    if task.type == "emplantillado" and request.status == "completado":
        if task.product_id and task.order_id:
            # Obtener orden para detalles
            order = db.query(Order).filter(Order.id == task.order_id).first()
            if order:
                # Actualizar OrderDetails — filtrar también por line_group
                details = db.query(OrderDetail).filter(
                    OrderDetail.order_id == task.order_id,
                    OrderDetail.product_id == task.product_id,
                    OrderDetail.line_group == task.line_group
                ).all()
                
                for detail in details:
                    detail.state = "completado"
                    
                    # NUEVA: Agregar ENTRADA al inventario (pares fabricados)
                    stmt = select(Inventory).where(
                        (Inventory.product_id == detail.product_id) &
                        (Inventory.size == detail.size) &
                        (Inventory.colour == detail.colour) &
                        (Inventory.deleted_at == None)
                    )
                    inventory_item = db.execute(stmt).scalar_one_or_none()
                    
                    if inventory_item:
                        # Agregar los pares fabricados a RESERVED (pares fabricados en producción)
                        quantity = Decimal(detail.amount)
                        inventory_item.reserved = inventory_item.reserved + quantity
                        db.add(inventory_item)  # Marcar como actualizado
                        
                        # Registrar ENTRADA en movimientos
                        db.add(InventoryMovement(
                            id=uuid.uuid4(),
                            product_id=detail.product_id,
                            user_id=current_user.id,
                            type_of_movement=InventoryMovementType.entrada,
                            size=detail.size,
                            colour=detail.colour,
                            amount=quantity,
                            reason=f"Entrada por producción completada - Vale #{task.vale_number}",
                            movement_date=datetime.now(timezone.utc)
                        ))
                    else:
                        # Crear registro de inventario si no existe
                        quantity = Decimal(detail.amount)
                        new_inventory = Inventory(
                            id=uuid.uuid4(),
                            product_id=detail.product_id,
                            size=detail.size,
                            colour=detail.colour,
                            amount=Decimal(0),
                            reserved=quantity,
                            minimum_stock=0,
                        )
                        db.add(new_inventory)
                        
                        # Registrar ENTRADA
                        db.add(InventoryMovement(
                            id=uuid.uuid4(),
                            product_id=detail.product_id,
                            user_id=current_user.id,
                            type_of_movement=InventoryMovementType.entrada,
                            size=detail.size,
                            colour=detail.colour,
                            amount=quantity,
                            reason=f"Entrada por producción completada - Vale #{task.vale_number}",
                            movement_date=datetime.now(timezone.utc)
                        ))
    
    # Commit una sola vez
    db.commit()
    
    # Obtener usuario (puede ser None si assigned_to es None)
    user = None
    user_name = "Sin asignar"
    user_occupation = None
    if task.assigned_to:
        user = db.query(User).filter(User.id == task.assigned_to).first()
        if user:
            user_name = f"{user.name_user} {user.last_name}"
            user_occupation = user.occupation
    
    return ProductionTaskResponse(
        id=task.id,
        order_id=task.order_id,
        product_id=task.product_id,
        assigned_to=task.assigned_to,
        assigned_user_name=user_name,
        assigned_user_occupation=user_occupation,
        type=task.type,
        status=task.status,
        description_task=task.description_task,
        vale_number=task.vale_number,
        created_at=task.created_at,
        observation=task.observation,
        task_prices=task.product.task_prices if task.product else {}
    )

