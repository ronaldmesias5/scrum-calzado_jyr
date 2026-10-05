"""
Módulo: service.py (Orders)
Descripción: Lógica de negocio reutilizada por los routers de órdenes.
¿Para qué? Centralizar la serialización de órdenes, la resolución de estados y
las transiciones de inventario (reservas) al cambiar estados de órdenes/detalles.
¿Nota? La lógica vive aquí para que router.py (CRUD) y tasks.py (producción) la compartan.
"""

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import and_, or_, select
from sqlalchemy import update as sa_update
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement, InventoryMovementType
from app.models.order import Order, OrderDetail, OrderStatus
from app.models.tasks import Task, TaskStatus
from app.models.user import User
from app.utils.task_priority import calculate_task_priority
from app.schemas.orders import (
    CalendarOrderItem,
    OrderDetailItemCreateRequest,
    OrderDetailItemResponse,
    OrderDetailResponse,
    OrderResponse,
)

# ────────────────────────────────────────────────
# Máquina de estados de un pedido (OrderStatus)
# ────────────────────────────────────────────────
# Transiciones permitidas desde cada estado. Cualquier otra combinación
# (p.ej. cancelado → completado, que sumaría reservas inexistentes) se
# rechaza con 409 en el endpoint PATCH /orders/{id}/status.
ALLOWED_ORDER_TRANSITIONS: dict[OrderStatus, frozenset[OrderStatus]] = {
    OrderStatus.pendiente: frozenset(
        {OrderStatus.en_progreso, OrderStatus.completado, OrderStatus.cancelado}
    ),
    OrderStatus.en_progreso: frozenset(
        {OrderStatus.pendiente, OrderStatus.completado, OrderStatus.cancelado}
    ),
    OrderStatus.completado: frozenset(
        {
            OrderStatus.entregado,
            OrderStatus.en_progreso,
            OrderStatus.pendiente,
            OrderStatus.cancelado,
        }
    ),
    OrderStatus.entregado: frozenset(),
    OrderStatus.cancelado: frozenset({OrderStatus.pendiente}),
}


def validate_order_transition(current_state: OrderStatus, new_state: OrderStatus) -> None:
    """Valida que `new_state` sea una transición permitida desde `current_state`.

    Raises:
        ValueError: si la transición no está permitida en la máquina de estados.
    """
    if current_state == new_state:
        return
    allowed = ALLOWED_ORDER_TRANSITIONS.get(current_state, frozenset())
    if new_state not in allowed:
        raise ValueError(
            f"Transición de estado no permitida: {current_state.value} → {new_state.value}"
        )


def _order_to_response(order: Order, db=None) -> OrderResponse:
    """Serializa una Order incluyendo datos del cliente y prioridad desde delivery_date."""
    customer = order.customer
    priority = calculate_task_priority(order.delivery_date)
    return OrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        customer_name=customer.name_user if customer else None,
        customer_last_name=customer.last_name if customer else None,
        customer_email=customer.email if customer else None,
        customer_phone=customer.phone if customer else None,
        total_pairs=order.total_pairs,
        state=order.state,
        priority=priority,
        delivery_date=order.delivery_date,
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
                category_name=d.product.category.name_category
                if (d.product and d.product.category)
                else None,
                brand_name=d.product.brand.name_brand if (d.product and d.product.brand) else None,
                image_url=d.product.image_url if d.product else None,
                size=d.size,
                colour=d.colour or (d.product.color if d.product else None),
                amount=d.amount,
                line_group=d.line_group,
                stock_available=float(
                    sum(inv.amount for inv in d.product.inventory if inv.size == d.size)
                )
                if d.product
                else 0.0,
                state=d.state,
                order_date=d.order_date,
                observations=d.observations,
                unit_price=float(d.unit_price) if d.unit_price else None,
                subtotal=float(d.unit_price * d.amount) if d.unit_price else None,
            )
            for d in order.details
        ],
    )


def get_orders_for_calendar(
    db: Session,
    start: datetime,
    end: datetime,
) -> list[CalendarOrderItem]:
    """Pedidos con entrega en [start, end) más los que no tienen fecha de entrega.

    La agregación de producción (tareas/vales) se hace en una segunda query
    agrupada por order_id, evitando N+1 al renderizar el calendario.
    """
    range_cond = and_(
        Order.delivery_date.is_not(None),
        Order.delivery_date >= start,
        Order.delivery_date < end,
    )
    orders = (
        db.execute(
            select(Order)
            .where(
                Order.deleted_at.is_(None),
                or_(range_cond, Order.delivery_date.is_(None)),
            )
            .order_by(Order.delivery_date.is_(None), Order.delivery_date.asc())
        )
        .scalars()
        .all()
    )
    if not orders:
        return []

    order_ids = [o.id for o in orders]
    task_rows = db.execute(
        select(Task.order_id, Task.vale_number, Task.status).where(
            Task.order_id.in_(order_ids),
            Task.deleted_at.is_(None),
        )
    ).all()

    active_statuses = {
        TaskStatus.pendiente.value,
        TaskStatus.por_liquidar.value,
        TaskStatus.en_progreso.value,
    }
    agg: dict[uuid.UUID, dict] = {}
    for order_id, vale_number, task_status in task_rows:
        entry = agg.setdefault(order_id, {"count": 0, "vales": set(), "pending": 0})
        entry["count"] += 1
        if vale_number is not None:
            entry["vales"].add(int(vale_number))
        status_value = task_status.value if isinstance(task_status, TaskStatus) else task_status
        if status_value in active_statuses:
            entry["pending"] += 1

    items: list[CalendarOrderItem] = []
    for order in orders:
        customer = order.customer
        entry = agg.get(order.id, {"count": 0, "vales": set(), "pending": 0})
        items.append(
            CalendarOrderItem(
                id=order.id,
                customer_id=order.customer_id,
                customer_name=customer.name_user if customer else None,
                customer_last_name=customer.last_name if customer else None,
                total_pairs=order.total_pairs,
                state=order.state,
                priority=calculate_task_priority(order.delivery_date),
                delivery_date=order.delivery_date,
                creation_date=order.creation_date,
                has_production=entry["count"] > 0,
                vale_numbers=sorted(entry["vales"]),
                task_count=entry["count"],
                pending_tasks=entry["pending"],
            )
        )
    return items


def apply_order_state_inventory(
    db: Session,
    current_user_id: uuid.UUID,
    order: Order,
    new_state: OrderStatus,
) -> None:
    """Ajusta el inventario (reservas) cuando cambia el estado de una orden.

    FLUJO:
    - Pedido 'completado' -> SUMAR a reserved (entrada de pares fabricados)
    - Pedido 'entregado' -> RESTAR de reserved (salida de pares fabricados)
    - Pedido vuelve atrás desde 'completado' -> RESTAR de reserved lo sumado

    PEDIDOS PARA STOCK (order.customer_id is None): al completar se suma a
    `amount` (bodega) en vez de `reserved`, y al revertir se resta de `amount`.
    """
    is_stock = order.customer_id is None
    # 1. El pedido pasa a 'completado' -> SUMAR A RESERVED (entrada de pares fabricados)
    #    ...o a AMOUNT (bodega) si es producción para stock.
    if new_state == OrderStatus.completado and order.state != OrderStatus.completado:
        for detail in order.details:
            stmt = (
                select(Inventory)
                .where(
                    (Inventory.product_id == detail.product_id)
                    & (Inventory.size == detail.size)
                    & (Inventory.deleted_at == None)
                )
                .with_for_update()
                .limit(1)
            )
            inventory_item = db.execute(stmt).scalar_one_or_none()

            quantity = Decimal(detail.amount)

            if inventory_item:
                if is_stock:
                    inventory_item.amount += quantity
                else:
                    inventory_item.reserved += quantity
                db.add(inventory_item)
            else:
                inventory_item = Inventory(
                    id=uuid.uuid4(),
                    product_id=detail.product_id,
                    size=detail.size,
                    colour=detail.colour,
                    amount=quantity if is_stock else 0,
                    reserved=0 if is_stock else quantity,
                    minimum_stock=0,
                )
                db.add(inventory_item)

            db.add(
                InventoryMovement(
                    id=uuid.uuid4(),
                    product_id=detail.product_id,
                    user_id=current_user_id,
                    type_of_movement=InventoryMovementType.entrada,
                    size=detail.size,
                    colour=detail.colour,
                    amount=quantity,
                    reason=(
                        f"Entrada a stock bodega - Pedido {order.id}"
                        if is_stock
                        else f"Entrada de pares fabricados - Pedido {order.id}"
                    ),
                    movement_date=datetime.now(UTC),
                )
            )

    # 2. El pedido pasa a 'entregado' -> RESTAR DE RESERVED (salida de pares fabricados)
    elif new_state == OrderStatus.entregado and order.state != OrderStatus.entregado:
        for detail in order.details:
            stmt = (
                select(Inventory)
                .where(
                    (Inventory.product_id == detail.product_id)
                    & (Inventory.size == detail.size)
                    & (Inventory.deleted_at == None)
                )
                .with_for_update()
                .limit(1)
            )
            inventory_item = db.execute(stmt).scalar_one_or_none()

            if inventory_item:
                quantity = Decimal(detail.amount)

                if inventory_item.reserved >= quantity:
                    inventory_item.reserved -= quantity
                    db.add(inventory_item)

                db.add(
                    InventoryMovement(
                        id=uuid.uuid4(),
                        product_id=detail.product_id,
                        user_id=current_user_id,
                        type_of_movement=InventoryMovementType.salida,
                        size=detail.size,
                        colour=detail.colour,
                        amount=quantity,
                        reason=f"Entrega al cliente - Pedido {order.id}",
                        movement_date=datetime.now(UTC),
                    )
                )

    # 3. El pedido vuelve atrás desde 'completado' a otro estado
    # Revertir: RESTAR de reserved lo que se había sumado
    elif order.state == OrderStatus.completado and new_state not in (
        OrderStatus.completado,
        OrderStatus.entregado,
    ):
        for detail in order.details:
            stmt = (
                select(Inventory)
                .where(
                    (Inventory.product_id == detail.product_id)
                    & (Inventory.size == detail.size)
                    & (Inventory.deleted_at == None)
                )
                .limit(1)
            )
            inventory_item = db.execute(stmt).scalar_one_or_none()

            if inventory_item:
                quantity = Decimal(detail.amount)

                if is_stock:
                    inventory_item.amount -= quantity
                else:
                    inventory_item.reserved -= quantity
                db.add(inventory_item)

                db.add(
                    InventoryMovement(
                        id=uuid.uuid4(),
                        product_id=detail.product_id,
                        user_id=current_user_id,
                        type_of_movement=InventoryMovementType.entrada,
                        size=detail.size,
                        colour=detail.colour,
                        amount=quantity,
                        reason=f"Devolución: Pedido #{order.id} cambió de completado a {new_state.value}",
                        movement_date=datetime.now(UTC),
                    )
                )

    # Si la orden pasa a 'entregado', actualizar TODOS los detalles a 'entregado'
    if new_state == OrderStatus.entregado:
        db.execute(
            sa_update(OrderDetail)
            .where(OrderDetail.order_id == order.id)
            .values(state=OrderStatus.entregado)
        )


def apply_detail_state_inventory(
    db: Session,
    current_user_id: uuid.UUID,
    order: Order,
    detail_data: OrderDetailItemCreateRequest,
    old_detail: OrderDetail | None,
) -> None:
    """Ajusta el inventario (reservas) cuando una línea de detalle cambia de estado en el PUT."""
    # 1. Si un producto pasa a "entregado" (desde completado).
    #    Los pedidos para stock nunca se entregan: se omite la salida.
    if (
        old_detail
        and old_detail.state != OrderStatus.entregado
        and detail_data.state == OrderStatus.entregado
        and order.customer_id is not None
    ):
        stmt = (
            select(Inventory)
            .where(
                (Inventory.product_id == detail_data.product_id)
                & (Inventory.size == detail_data.size)
                & (Inventory.deleted_at == None)
            )
            .limit(1)
        )
        inventory_item = db.execute(stmt).scalar_one_or_none()

        if inventory_item:
            quantity = Decimal(detail_data.amount)

            # RESTAR de reserved (salida de pares fabricados que se entregan)
            if inventory_item.reserved >= quantity:
                inventory_item.reserved -= quantity
                db.add(inventory_item)

            # Registrar la salida de pares al cliente
            db.add(
                InventoryMovement(
                    id=uuid.uuid4(),
                    product_id=detail_data.product_id,
                    user_id=current_user_id,
                    type_of_movement=InventoryMovementType.salida,
                    size=detail_data.size,
                    colour=detail_data.colour,
                    amount=quantity,
                    reason=f"Entrega al cliente - Pedido {order.id}",
                    movement_date=datetime.now(UTC),
                )
            )

    # 2. Si un producto pasa a "completado" (desde otro estado que no sea completado/entregado)
    elif (
        old_detail
        and old_detail.state not in (OrderStatus.completado, OrderStatus.entregado)
        and detail_data.state == OrderStatus.completado
    ):
        # Determinar si es "Completado desde bodega" (stock existente) o fabricación real
        is_from_warehouse = detail_data.observations and "Completado desde bodega" in (
            detail_data.observations or ""
        )

        stmt = (
            select(Inventory)
            .where(
                (Inventory.product_id == detail_data.product_id)
                & (Inventory.size == detail_data.size)
                & (Inventory.deleted_at == None)
            )
            .limit(1)
        )
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
                    minimum_stock=0,
                )
                db.add(inventory_item)

            # Registrar movimiento de salida (stock sale de bodega)
            db.add(
                InventoryMovement(
                    id=uuid.uuid4(),
                    product_id=detail_data.product_id,
                    user_id=current_user_id,
                    type_of_movement=InventoryMovementType.salida,
                    size=detail_data.size,
                    colour=detail_data.colour,
                    amount=quantity,
                    reason=f"Despacho desde bodega - Pedido {order.id}",
                    movement_date=datetime.now(UTC),
                )
            )
        else:
            # ─── CASO FABRICACIÓN ───
            # Pedido para stock (sin cliente): entra a bodega (amount).
            # Pedido con cliente: entra a pares fabricados (reserved).
            is_stock = order.customer_id is None
            if inventory_item:
                if is_stock:
                    inventory_item.amount += quantity
                else:
                    inventory_item.reserved += quantity
                db.add(inventory_item)
            else:
                inventory_item = Inventory(
                    id=uuid.uuid4(),
                    product_id=detail_data.product_id,
                    size=detail_data.size,
                    colour=detail_data.colour,
                    amount=quantity if is_stock else 0,
                    reserved=0 if is_stock else quantity,
                    minimum_stock=0,
                )
                db.add(inventory_item)

            # Registrar la entrada de pares fabricados
            db.add(
                InventoryMovement(
                    id=uuid.uuid4(),
                    product_id=detail_data.product_id,
                    user_id=current_user_id,
                    type_of_movement=InventoryMovementType.entrada,
                    size=detail_data.size,
                    colour=detail_data.colour,
                    amount=quantity,
                    reason=(
                        f"Entrada a stock bodega - Pedido {order.id}"
                        if is_stock
                        else f"Entrada de pares fabricados - Pedido {order.id}"
                    ),
                    movement_date=datetime.now(UTC),
                )
            )


def resolve_order_state_from_details(
    details: list[OrderDetailItemCreateRequest],
) -> OrderStatus | None:
    """Determina el nuevo estado de la orden a partir de los estados de sus líneas.

    Calculado directamente desde los datos del request (evita problemas con autoflush).
    Devuelve None cuando no aplica ningún cambio (se mantiene el estado actual).
    """
    detail_states = [d.state if d.state is not None else OrderStatus.pendiente for d in details]
    if not detail_states:
        return None
    # Si TODOS están entregado -> entregado
    if all(s == OrderStatus.entregado for s in detail_states):
        return OrderStatus.entregado
    # Si TODOS están completado o entregado (pero no todos entregado) -> completado
    if all(s in (OrderStatus.completado, OrderStatus.entregado) for s in detail_states):
        return OrderStatus.completado
    # Si alguno está en_progreso -> en_progreso
    if any(s == OrderStatus.en_progreso for s in detail_states):
        return OrderStatus.en_progreso
    # Si todos están pendiente -> pendiente
    if all(s == OrderStatus.pendiente for s in detail_states):
        return OrderStatus.pendiente
    # Else: mantener estado actual
    return None


def complete_emplantillado(
    db: Session,
    current_user_id: uuid.UUID,
    task: Task,
) -> None:
    """Al completar la etapa emplantillado: marca los detalles completados.

    Pedido con cliente -> los pares entran a reserved (pares fabricados).
    Pedido para stock (sin cliente) -> los pares entran a amount (bodega).
    """
    if task.product_id and task.order_id:
        # Obtener orden para detalles
        order = db.query(Order).filter(Order.id == task.order_id).first()

        if order:
            is_stock = order.customer_id is None
            # Actualizar OrderDetails — filtrar también por line_group
            details = (
                db.query(OrderDetail)
                .filter(
                    OrderDetail.order_id == task.order_id,
                    OrderDetail.product_id == task.product_id,
                    OrderDetail.line_group == task.line_group,
                )
                .all()
            )

            for detail in details:
                detail.state = "completado"

                # NUEVA: Agregar ENTRADA al inventario (pares fabricados)
                stmt = (
                    select(Inventory)
                    .where(
                        (Inventory.product_id == detail.product_id)
                        & (Inventory.size == detail.size)
                        & (Inventory.deleted_at == None)
                    )
                    .limit(1)
                )
                inventory_item = db.execute(stmt).scalar_one_or_none()

                if inventory_item:
                    quantity = Decimal(detail.amount)
                    if is_stock:
                        # Producción para stock: entra a BODEGA
                        inventory_item.amount = inventory_item.amount + quantity
                    else:
                        # Pedido con cliente: entra a PARES FABRICADOS
                        inventory_item.reserved = inventory_item.reserved + quantity
                    db.add(inventory_item)  # Marcar como actualizado

                    # Registrar ENTRADA en movimientos
                    db.add(
                        InventoryMovement(
                            id=uuid.uuid4(),
                            product_id=detail.product_id,
                            user_id=current_user_id,
                            type_of_movement=InventoryMovementType.entrada,
                            size=detail.size,
                            colour=detail.colour,
                            amount=quantity,
                            reason=(
                                f"Entrada a stock bodega - Vale #{task.vale_number}"
                                if is_stock
                                else f"Entrada por producción completada - Vale #{task.vale_number}"
                            ),
                            movement_date=datetime.now(UTC),
                        )
                    )
                else:
                    # Crear registro de inventario si no existe
                    quantity = Decimal(detail.amount)
                    new_inventory = Inventory(
                        id=uuid.uuid4(),
                        product_id=detail.product_id,
                        size=detail.size,
                        colour=detail.colour,
                        amount=quantity if is_stock else Decimal(0),
                        reserved=Decimal(0) if is_stock else quantity,
                        minimum_stock=0,
                    )
                    db.add(new_inventory)

                    # Registrar ENTRADA
                    db.add(
                        InventoryMovement(
                            id=uuid.uuid4(),
                            product_id=detail.product_id,
                            user_id=current_user_id,
                            type_of_movement=InventoryMovementType.entrada,
                            size=detail.size,
                            colour=detail.colour,
                            amount=quantity,
                            reason=(
                                f"Entrada a stock bodega - Vale #{task.vale_number}"
                                if is_stock
                                else f"Entrada por producción completada - Vale #{task.vale_number}"
                            ),
                            movement_date=datetime.now(UTC),
                        )
                    )


def create_order(
    *,
    db: Session,
    customer_id: uuid.UUID | None,
    total_pairs: int,
    delivery_date: datetime | None,
    details: list[OrderDetailItemCreateRequest],
    created_by: uuid.UUID,
) -> Order:
    """
    Crea una orden mayorista con sus líneas de detalle.

    Común al flujo del jefe (POST /admin/orders) y al del cliente
    (POST /client/orders). El `total_pairs` se recalcula en el servidor
    como la suma de los `amount` de los detalles para no confiar en el body.

    Si `customer_id` es None, la orden es producción para stock/bodega
    (sin cliente asignado).
    """
    if customer_id is not None:
        customer_check = db.execute(select(User).where(User.id == customer_id)).scalar_one_or_none()
        if not customer_check:
            raise ValueError("Cliente no encontrado")

    # Recalcular total de pares desde los detalles (seguridad server-side)
    total_pairs = sum(d.amount for d in details)

    new_order = Order(
        customer_id=customer_id,
        total_pairs=total_pairs,
        state=OrderStatus.pendiente,
        delivery_date=delivery_date,
        creation_date=datetime.now(UTC),
        created_by=created_by,
    )

    for detail_data in details:
        # Auto-fill unit_price from client_prices if available
        unit_price = None
        if customer_id is not None:
            from app.models.client_price import ClientPrice
            cp = db.execute(
                select(ClientPrice).where(
                    ClientPrice.client_id == customer_id,
                    ClientPrice.product_id == detail_data.product_id,
                    ClientPrice.deleted_at.is_(None),
                )
            ).scalar_one_or_none()
            if cp:
                unit_price = float(cp.unit_price)

        detail = OrderDetail(
            product_id=detail_data.product_id,
            size=detail_data.size,
            colour=detail_data.colour,
            amount=detail_data.amount,
            state=OrderStatus.pendiente,
            order_date=datetime.now(UTC),
            created_by=created_by,
            line_group=detail_data.line_group,
            observations=detail_data.observations,
            unit_price=unit_price,
        )
        new_order.details.append(detail)

    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order
