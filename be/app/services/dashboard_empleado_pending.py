"""
Servicio para incidencias de producto pendientes de aprobación.

Funciones:
  - create_pending_incidence(db, employee_id, task_id, size, colour, defect_code_id, quantity, observations)
  - get_employee_pending_incidences(db, employee_id)
  - get_all_pending_incidences(db)
  - approve_pending_incidence(db, pending_id, jefe_id, incident_type)
  - reject_pending_incidence(db, pending_id, jefe_id)
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select, desc
from sqlalchemy.orm import Session, selectinload

from app.models.pending_incidence import PendingProductIncidence, PendingIncidenceStatus
from app.models.tasks import Task
from app.models.order import Order, OrderDetail, OrderStatus
from app.services.scrap import register_incident


def create_pending_incidence(
    db: Session,
    employee_id: uuid.UUID,
    task_id: uuid.UUID,
    size: str,
    colour: str | None,
    defect_code_id: uuid.UUID | None = None,
    description: str | None = None,
    quantity: int = 1,
    observations: str | None = None,
) -> PendingProductIncidence:
    """Crea una incidencia de producto pendiente de aprobación."""
    # Validar que la tarea existe y está asignada al empleado
    task = db.execute(
        select(Task).where(Task.id == task_id, Task.deleted_at.is_(None))
    ).scalar_one_or_none()
    if not task:
        raise ValueError("Tarea no encontrada")
    if task.assigned_to != employee_id:
        raise ValueError("Esta tarea no está asignada al empleado")
    if not task.product_id:
        raise ValueError("La tarea no tiene un producto asociado")

    # Validar que al menos uno de defect_code_id o description esté presente
    if not defect_code_id and not description:
        raise ValueError("Debe proporcionar un código de defecto o una descripción")

    # Validar cantidad
    if quantity <= 0:
        raise ValueError("La cantidad debe ser mayor a 0")
    if quantity > task.amount:
        raise ValueError(f"La cantidad ({quantity}) excede el amount de la tarea ({task.amount})")

    pending = PendingProductIncidence(
        employee_id=employee_id,
        task_id=task_id,
        product_id=task.product_id,
        size=size,
        colour=colour,
        defect_code_id=defect_code_id,
        description=description,
        quantity=Decimal(str(quantity)),
        observations=observations,
        status=PendingIncidenceStatus.pending,
    )
    db.add(pending)
    db.commit()
    db.refresh(pending)
    return pending


def get_employee_pending_incidences(
    db: Session,
    employee_id: uuid.UUID,
) -> list[PendingProductIncidence]:
    """Obtiene todas las incidencias de producto de un empleado."""
    stmt = (
        select(PendingProductIncidence)
        .options(
            selectinload(PendingProductIncidence.task),
            selectinload(PendingProductIncidence.product),
            selectinload(PendingProductIncidence.defect_code),
            selectinload(PendingProductIncidence.reviewed_by),
            selectinload(PendingProductIncidence.loss_record),
        )
        .where(
            PendingProductIncidence.employee_id == employee_id,
            PendingProductIncidence.deleted_at.is_(None),
        )
        .order_by(desc(PendingProductIncidence.created_at))
    )
    return list(db.execute(stmt).scalars().all())


def create_customer_pending_incidence(
    db: Session,
    customer_id: uuid.UUID,
    order_id: uuid.UUID,
    order_detail_id: uuid.UUID,
    size: str,
    colour: str | None,
    defect_code_id: uuid.UUID | None = None,
    description: str | None = None,
    quantity: int = 1,
    observations: str | None = None,
) -> PendingProductIncidence:
    """Crea un reclamo de producto de un pedido entregado (incidencia de cliente)."""
    # Validar que la orden existe y pertenece al cliente
    order = db.execute(
        select(Order).where(Order.id == order_id, Order.deleted_at.is_(None))
    ).scalar_one_or_none()
    if not order:
        raise ValueError("Pedido no encontrado")
    if order.customer_id != customer_id:
        raise ValueError("Este pedido no pertenece al cliente")
    if order.state != OrderStatus.entregado:
        raise ValueError("Solo se pueden reportar incidencias de pedidos entregados")

    # Validar que el detalle pertenece a la orden
    detail = db.execute(
        select(OrderDetail).where(
            OrderDetail.id == order_detail_id,
            OrderDetail.order_id == order.id,
            OrderDetail.deleted_at.is_(None),
        )
    ).scalar_one_or_none()
    if not detail:
        raise ValueError("Producto del pedido no encontrado")

    # Validar defecto o descripción
    if not defect_code_id and not description:
        raise ValueError("Debe proporcionar un código de defecto o una descripción")

    # Validar cantidad
    if quantity <= 0:
        raise ValueError("La cantidad debe ser mayor a 0")
    if quantity > (detail.amount or 0):
        raise ValueError(
            f"La cantidad ({quantity}) excede los pares del producto ({detail.amount})"
        )

    pending = PendingProductIncidence(
        customer_id=customer_id,
        order_id=order.id,
        order_detail_id=detail.id,
        product_id=detail.product_id,
        size=size,
        colour=colour,
        defect_code_id=defect_code_id,
        description=description,
        quantity=Decimal(str(quantity)),
        observations=observations,
        status=PendingIncidenceStatus.pending,
    )
    db.add(pending)
    db.commit()
    db.refresh(pending)

    # Notificar a todos los jefes en paralelo (best-effort, no bloquea la creación)
    try:
        from app.models.notifications import Notification, NotificationType
        from app.models.user import User
        from app.models.role import Role

        jefe_role = db.execute(select(Role).where(Role.name_role == "admin")).scalar_one_or_none()
        jefes = db.execute(
            select(User).where(
                ((User.role_id == jefe_role.id) if jefe_role else False)
                | (User.occupation == "jefe")
            )
        ).scalars().all()
        reporter = db.get(User, customer_id)
        reporter_name = f"{reporter.name_user} {reporter.last_name}".strip() if reporter else "Cliente"
        for jefe in jefes:
            if jefe.id == customer_id:
                continue
            notif = Notification(
                user_id=jefe.id,
                title_notification="Nuevo reclamo de cliente",
                message_notification=f"{reporter_name} reportó una incidencia en el pedido #{str(order.id)[:8]} — {detail.product_id} talla {size}",
                type_notification=NotificationType.error,
                order_id=order.id,
                link_url="/dashboard/admin/losses?tab=pending",
                created_by=customer_id,
            )
            db.add(notif)
        db.commit()
        # WS push best-effort
        try:
            from app.utils.ws_manager import ws_manager
            import asyncio

            for jefe in jefes:
                if jefe.id == customer_id:
                    continue
                try:
                    asyncio.run(
                        ws_manager.broadcast_to_user(
                            str(jefe.id),
                            {"type": "new_incidence", "title": "Reclamo de cliente", "order_id": str(order.id)},
                        )
                    )
                except Exception:
                    pass
        except Exception:
            pass
    except Exception:
        pass

    return pending


def get_customer_pending_incidences(
    db: Session,
    customer_id: uuid.UUID,
) -> list[PendingProductIncidence]:
    """Obtiene los reclamos reportados por un cliente."""
    stmt = (
        select(PendingProductIncidence)
        .options(
            selectinload(PendingProductIncidence.order),
            selectinload(PendingProductIncidence.product),
            selectinload(PendingProductIncidence.defect_code),
            selectinload(PendingProductIncidence.reviewed_by),
            selectinload(PendingProductIncidence.loss_record),
        )
        .where(
            PendingProductIncidence.customer_id == customer_id,
            PendingProductIncidence.deleted_at.is_(None),
        )
        .order_by(desc(PendingProductIncidence.created_at))
    )
    return list(db.execute(stmt).scalars().all())


def get_all_pending_incidences(
    db: Session,
    status_filter: str | None = None,
) -> list[PendingProductIncidence]:
    """Obtiene todas las incidencias pendientes (para el jefe)."""
    stmt = (
        select(PendingProductIncidence)
        .options(
            selectinload(PendingProductIncidence.employee),
            selectinload(PendingProductIncidence.customer),
            selectinload(PendingProductIncidence.order),
            selectinload(PendingProductIncidence.task),
            selectinload(PendingProductIncidence.product),
            selectinload(PendingProductIncidence.defect_code),
            selectinload(PendingProductIncidence.reviewed_by),
            selectinload(PendingProductIncidence.loss_record),
        )
        .where(PendingProductIncidence.deleted_at.is_(None))
    )
    if status_filter:
        stmt = stmt.where(PendingProductIncidence.status == status_filter)
    else:
        # Por defecto: solo pending
        stmt = stmt.where(PendingProductIncidence.status == PendingIncidenceStatus.pending)
    stmt = stmt.order_by(desc(PendingProductIncidence.created_at))
    return list(db.execute(stmt).scalars().all())


def approve_pending_incidence(
    db: Session,
    pending_id: uuid.UUID,
    jefe_id: uuid.UUID,
    incident_type: str,
) -> PendingProductIncidence:
    """
    Aprueba una incidencia pendiente y crea el LossRecord correspondiente.
    El jefe elige el tipo: perdida, en_reparacion, devuelto.
    """
    valid_types = {"perdida", "en_reparacion", "devuelto"}
    if incident_type not in valid_types:
        raise ValueError(f"Tipo inválido: {incident_type}. Válidos: {', '.join(valid_types)}")

    pending = db.execute(
        select(PendingProductIncidence).where(
            PendingProductIncidence.id == pending_id,
            PendingProductIncidence.deleted_at.is_(None),
        )
    ).scalar_one_or_none()
    if not pending:
        raise ValueError("Incidencia pendiente no encontrada")
    if pending.status != PendingIncidenceStatus.pending:
        raise ValueError(f"La incidencia ya está {pending.status}")

    # Crear el LossRecord real usando register_incident
    loss_record = register_incident(
        db=db,
        user_id=jefe_id,
        incidence_category="producto",
        product_id=pending.product_id,
        size=pending.size,
        colour=pending.colour,
        quantity=pending.quantity,
        defect_code_id=pending.defect_code_id,
        description=pending.description,
        incident_type=incident_type,
        reason="Incidencia reportada por empleado (aprobada por jefe)"
        if pending.employee_id
        else "Reclamo de cliente (aprobado por jefe)",
        observations=pending.observations,
        order_id=pending.order_id or (pending.task.order_id if pending.task else None),
        order_detail_id=pending.order_detail_id,
        line_group=pending.task.line_group if pending.task else None,
    )

    # Reducir la cantidad de la tarea por los pares defectuosos aprobados
    task = pending.task
    if task and task.amount >= int(pending.quantity):
        task.amount -= int(pending.quantity)

    # Actualizar la incidencia pendiente
    pending.status = PendingIncidenceStatus.approved
    pending.approved_type = incident_type
    pending.reviewed_by_id = jefe_id
    pending.reviewed_at = datetime.now(timezone.utc)
    pending.loss_record_id = loss_record.id

    db.commit()
    db.refresh(pending)
    return pending


def reject_pending_incidence(
    db: Session,
    pending_id: uuid.UUID,
    jefe_id: uuid.UUID,
) -> PendingProductIncidence:
    """Rechaza una incidencia pendiente."""
    pending = db.execute(
        select(PendingProductIncidence).where(
            PendingProductIncidence.id == pending_id,
            PendingProductIncidence.deleted_at.is_(None),
        )
    ).scalar_one_or_none()
    if not pending:
        raise ValueError("Incidencia pendiente no encontrada")
    if pending.status != PendingIncidenceStatus.pending:
        raise ValueError(f"La incidencia ya está {pending.status}")

    pending.status = PendingIncidenceStatus.rejected
    pending.reviewed_by_id = jefe_id
    pending.reviewed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(pending)
    return pending
