"""
Archivo: be/app/routers/dashboard_empleado_tasks.py
Descripción: Endpoints de tareas, vales y reportes del panel del empleado.
"""

import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.dependencies import get_current_user, get_db
from app.models.category import Category
from app.models.order import Order, OrderDetail
from app.models.product import Product
from app.models.report_share import ReportShare
from app.models.tasks import Task
from app.models.user import User
from app.schemas.dashboard_empleado import (
    AvailableTaskListResponse,
    AvailableTaskSchema,
    EmployeeTaskListResponse,
    EmployeeTaskSchema,
    EmployeeTaskStatusUpdate,
    MyPerformanceResponse,
    MyPerformanceTaskBreakdown,
    MyTaskDetail,
    MyTasksReportResponse,
    SharedReportDetailResponse,
    SharedReportItem,
    SharedReportListResponse,
    TaskObservationUpdate,
    ValeDetailItem,
    ValeResponse,
    ValeTaskInfo,
)
from app.controllers.dashboard_empleado import get_task_type_for_occupation

router = APIRouter(
    prefix="/api/v1/dashboard/employee",
    tags=["dashboard-empleado"],
)


@router.get(
    "/tasks",
    response_model=EmployeeTaskListResponse,
    summary="Tareas asignadas al empleado actual",
)
def get_my_tasks(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    status: str | None = Query(None, description="Filtrar por estado"),
    type: str | None = Query(None, description="Filtrar por tipo/cargo"),
) -> EmployeeTaskListResponse:
    """Retorna las tareas asignadas al empleado autenticado."""
    query = (
        select(Task)
        .options(
            joinedload(Task.product).joinedload(Product.category),
            joinedload(Task.assigned_user),
        )
        .where(
            Task.assigned_to == current_user.id,
            Task.deleted_at == None,
        )
    )

    if status:
        query = query.where(Task.status == status)
    if type:
        query = query.where(Task.type == type)

    query = query.order_by(desc(Task.created_at))
    result = db.execute(query)
    tasks = result.scalars().unique().all()

    task_list = []
    for t in tasks:
        product_name = t.product.name_product if t.product else None
        product_image = t.product.image_url if t.product else None
        product_category = t.product.category.name_category if t.product and t.product.category else None
        # BUGFIX: usar name_user no name
        assigned_name = f"{t.assigned_user.name_user} {t.assigned_user.last_name}".strip() if t.assigned_user else None
        task_list.append(
            EmployeeTaskSchema(
                id=str(t.id),
                order_id=str(t.order_id) if t.order_id else None,
                product_id=str(t.product_id) if t.product_id else None,
                product_name=product_name,
                product_image=product_image,
                product_category=product_category,
                line_group=t.line_group,
                assigned_to=str(t.assigned_to) if t.assigned_to else None,
                assigned_user_name=assigned_name,
                assigned_user_occupation=t.assigned_user.occupation if t.assigned_user else None,
                type=t.type,
                status=t.status,
                priority=str(t.priority.value) if hasattr(t.priority, 'value') else str(t.priority),
                vale_number=t.vale_number,
                amount=t.amount,
                description=t.description_task,
                observation=t.observation,
                created_at=t.created_at,
                deadline=t.deadline,
                task_prices=t.product.task_prices if t.product else {},
            )
        )

    return EmployeeTaskListResponse(
        tasks=task_list,
        total=len(task_list),
    )


@router.get(
    "/available-tasks",
    response_model=AvailableTaskListResponse,
    summary="Tareas disponibles para reclamar según mi ocupación",
)
def get_available_tasks(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> AvailableTaskListResponse:
    """Retorna las tareas pendientes sin asignar que coinciden con la ocupación del empleado."""
    task_type = get_task_type_for_occupation(current_user.occupation)
    if not task_type:
        return AvailableTaskListResponse(tasks=[], total=0)

    query = (
        select(Task)
        .options(joinedload(Task.product).joinedload(Product.category))
        .where(
            Task.assigned_to == None,
            Task.type == task_type,
            Task.status == 'pendiente',
            Task.deleted_at == None,
        )
        .order_by(desc(Task.created_at))
    )

    tasks = db.execute(query).scalars().unique().all()

    return AvailableTaskListResponse(
        tasks=[
            AvailableTaskSchema(
                id=str(t.id),
                order_id=str(t.order_id) if t.order_id else None,
                product_id=str(t.product_id) if t.product_id else None,
                product_name=t.product.name_product if t.product else None,
                product_image=t.product.image_url if t.product else None,
                product_category=t.product.category.name_category if t.product and t.product.category else None,
                line_group=t.line_group,
                type=t.type,
                status=t.status,
                priority=str(t.priority.value) if hasattr(t.priority, 'value') else str(t.priority),
                vale_number=t.vale_number,
                amount=t.amount,
                description=t.description_task,
                created_at=t.created_at,
                deadline=t.deadline,
                task_prices=t.product.task_prices if t.product else {},
            )
            for t in tasks
        ],
        total=len(tasks),
    )


@router.post(
    "/tasks/{task_id}/claim",
    summary="Reclamar una tarea disponible",
)
def claim_task(
    task_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Asigna la tarea al empleado actual y la pone en progreso."""
    task_type = get_task_type_for_occupation(current_user.occupation)
    if not task_type:
        raise HTTPException(status_code=403, detail="Tu ocupación no puede reclamar tareas")

    task = db.execute(
        select(Task).where(Task.id == task_id, Task.deleted_at == None)
    ).scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if task.assigned_to is not None:
        raise HTTPException(status_code=409, detail="Esta tarea ya tiene un empleado asignado")

    if task.type != task_type:
        raise HTTPException(
            status_code=403,
            detail=f"Esta tarea es de tipo '{task.type}' y tu ocupación es '{current_user.occupation}'"
        )

    # Asignar al empleado actual
    task.assigned_to = current_user.id
    task.status = 'en_progreso'
    task.assignment_date = datetime.now(UTC)
    db.commit()

    return {
        "success": True,
        "message": "Tarea reclamada exitosamente",
        "task_id": str(task.id),
    }


@router.patch(
    "/tasks/{task_id}/observation",
    summary="Actualizar observación de una tarea",
)
def update_task_observation(
    task_id: uuid.UUID,
    data: TaskObservationUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Actualiza la observación de una tarea (solo el empleado asignado)."""
    task = db.execute(
        select(Task).where(Task.id == task_id, Task.deleted_at == None)
    ).scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el empleado asignado puede modificar la observación")

    task.observation = data.observation
    db.commit()

    return {
        "success": True,
        "message": "Observación actualizada",
    }


@router.patch(
    "/tasks/{task_id}/status",
    summary="Actualizar estado y observación de una tarea (empleado)",
)
def update_employee_task_status(
    task_id: uuid.UUID,
    data: EmployeeTaskStatusUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Actualiza el estado y la observación de una tarea (solo el empleado asignado)."""
    task = db.execute(
        select(Task).where(Task.id == task_id, Task.deleted_at == None)
    ).scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Solo el empleado asignado puede modificar esta tarea")

    task.status = data.status
    if data.status == "completado" and not task.completed_at:
        task.completed_at = datetime.now(UTC)
    if data.observation is not None:
        task.observation = data.observation

    # ─── AUTO-CREAR SIGUIENTE ETAPA ───
    # Cuando el empleado completa una tarea, crear automáticamente la siguiente
    # etapa como pendiente (sin asignar) para que otro empleado pueda reclamarla.
    STAGE_ORDER = ['corte', 'guarnicion', 'soladura', 'emplantillado']
    if data.status == 'completado' and task.type in STAGE_ORDER:
        current_index = STAGE_ORDER.index(task.type)
        if current_index < len(STAGE_ORDER) - 1:
            next_type = STAGE_ORDER[current_index + 1]
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
                now2 = datetime.now(UTC)
                next_task = Task(
                    id=uuid.uuid4(),
                    assigned_to=None,
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
                    status='pendiente',
                )
                db.add(next_task)

    db.commit()

    return {"success": True, "message": "Tarea actualizada"}


@router.get(
    "/tasks/{task_id}/vale",
    response_model=ValeResponse,
    summary="Obtener vale de producción para el empleado",
)
def get_task_vale(
    task_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ValeResponse:
    """
    Retorna el vale de producción completo visible para el empleado.
    - Solo la tarea del empleado actual muestra precios y es editable.
    - Las demás tareas muestran solo el nombre del empleado asignado.
    """
    task = db.execute(
        select(Task)
        .options(joinedload(Task.product).joinedload(Product.category))
        .where(Task.id == task_id, Task.deleted_at == None)
    ).scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")

    if not task.order_id:
        raise HTTPException(status_code=400, detail="Esta tarea no tiene una orden asociada")

    # Obtener la orden con sus detalles
    order = db.execute(
        select(Order)
        .options(
            selectinload(Order.details).selectinload(OrderDetail.product),
            joinedload(Order.customer),
        )
        .where(Order.id == task.order_id)
    ).scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    # Obtener todas las tareas para esta orden + producto + line_group
    all_tasks = db.execute(
        select(Task)
        .options(joinedload(Task.assigned_user))
        .where(
            Task.order_id == task.order_id,
            Task.product_id == task.product_id,
            Task.line_group == task.line_group,
            Task.deleted_at == None,
        )
        .order_by(Task.created_at)
    ).scalars().all()

    # Construir la lista de tareas del vale
    vale_tasks = []
    for t in all_tasks:
        is_mine = t.assigned_to == current_user.id
        assigned_name = None
        if t.assigned_user:
            assigned_name = f"{t.assigned_user.name_user} {t.assigned_user.last_name}".strip()

        # Precio: solo visible si es mi tarea
        price_per_dozen = 0.0
        total_cost = 0.0
        if is_mine and t.product and t.product.task_prices:
            price_per_dozen = float(t.product.task_prices.get(t.type, 0))
            total_cost = round((t.amount / 12) * price_per_dozen) if t.amount else 0.0

        vale_tasks.append(ValeTaskInfo(
            id=str(t.id),
            type=t.type,
            status=t.status,
            priority=str(t.priority.value) if hasattr(t.priority, 'value') else str(t.priority),
            amount=t.amount,
            assigned_user_name=assigned_name,
            assigned_user_occupation=t.assigned_user.occupation if t.assigned_user else None,
            observation=t.observation,
            is_mine=is_mine,
            price_per_dozen=price_per_dozen,
            total_cost=total_cost,
        ))

    # Detalles de la orden filtrados por producto y line_group
    customer = order.customer
    customer_name = customer.name_user if customer else None
    customer_last_name = customer.last_name if customer else None

    details = [
        ValeDetailItem(size=d.size, amount=d.amount)
        for d in order.details
        if d.product_id == task.product_id and d.line_group == task.line_group
    ]

    total_pairs = sum(d.amount for d in details)

    product_name = task.product.name_product if task.product else None
    product_image = task.product.image_url if task.product else None
    product_category = task.product.category.name_category if task.product and task.product.category else None

    return ValeResponse(
        order_id=str(task.order_id),
        customer_name=customer_name,
        customer_last_name=customer_last_name,
        product_id=str(task.product_id) if task.product_id else "",
        product_name=product_name,
        product_image=product_image,
        product_category=product_category,
        vale_number=task.vale_number,
        line_group=task.line_group,
        total_pairs=total_pairs,
        details=details,
        tasks=vale_tasks,
    )


# ─────────────────────────────────────────────
#  Reportes del empleado
# ─────────────────────────────────────────────


@router.get(
    "/report/my-performance",
    response_model=MyPerformanceResponse,
    summary="Rendimiento propio del empleado",
)
def get_my_performance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    category: str | None = Query(None),
):
    """Retorna KPIs de rendimiento del empleado autenticado."""
    user_id = current_user.id

    query = db.query(Task).filter(
        Task.assigned_to == user_id,
        Task.status.in_(["completado", "pagado"]),
        Task.deleted_at == None,
    ).join(Product, Task.product_id == Product.id)
    if category:
        query = query.outerjoin(Category, Product.category_id == Category.id).filter(
            Category.name_category == category
        )
    if start_date:
        query = query.filter(func.coalesce(Task.completed_at, Task.created_at) >= start_date)
    if end_date:
        query = query.filter(func.coalesce(Task.completed_at, Task.created_at) <= end_date)

    tasks = query.all()

    total_tasks = len(tasks)
    total_pairs = sum(t.amount or 0 for t in tasks)

    total_earnings = 0.0
    for t in tasks:
        if t.product and t.product.task_prices:
            prices = t.product.task_prices
            task_type = str(t.type.value) if hasattr(t.type, "value") else str(t.type)
            price_per_dozen = float(prices.get(task_type, 0) or 0)
            total_earnings += round((t.amount / 12) * price_per_dozen, 2) if t.amount else 0

    type_counts = {}
    for t in tasks:
        pname = str(t.type.value) if hasattr(t.type, "value") else str(t.type)
        type_counts[pname] = type_counts.get(pname, 0) + 1

    breakdown = [
        MyPerformanceTaskBreakdown(process_name=pname, count=count)
        for pname, count in sorted(type_counts.items())
    ]

    return MyPerformanceResponse(
        total_tasks_completed=total_tasks,
        total_pairs_produced=total_pairs,
        total_earnings=round(total_earnings, 2),
        tasks_breakdown=breakdown,
        name=f"{current_user.name_user} {current_user.last_name}",
    )


@router.get(
    "/report/my-tasks",
    response_model=MyTasksReportResponse,
    summary="Reporte detallado de tareas del empleado con valores calculados",
)
def get_my_tasks_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    start_date: datetime | None = Query(None),
    end_date: datetime | None = Query(None),
    category: str | None = Query(None),
):
    """Retorna detalle de tareas completadas/pagadas del empleado autenticado,
    con valores calculados por tarea y desglose por proceso."""
    user_id = current_user.id

    # Subconsulta para total_pairs por (order_id, product_id)
    order_pairs_sub = (
        select(
            OrderDetail.order_id,
            OrderDetail.product_id,
            func.sum(OrderDetail.amount).label("total_pairs"),
        )
        .where(OrderDetail.deleted_at == None)
        .group_by(OrderDetail.order_id, OrderDetail.product_id)
        .subquery()
    )

    # Subconsulta para colour único por (order, product, line_group)
    colour_sub = (
        select(
            OrderDetail.order_id,
            OrderDetail.product_id,
            OrderDetail.line_group,
            func.min(OrderDetail.colour).label("colour"),
        )
        .where(OrderDetail.deleted_at == None)
        .group_by(OrderDetail.order_id, OrderDetail.product_id, OrderDetail.line_group)
        .subquery()
    )

    tasks_detail_query = (
        select(
            Task.id,
            Task.type,
            Task.completed_at,
            Task.created_at,
            Task.status,
            Task.amount.label("task_amount"),
            order_pairs_sub.c.total_pairs,
            Product.name_product,
            Product.task_prices,
            Task.order_id,
            Task.product_id,
            Task.vale_number,
            Task.line_group,
            colour_sub.c.colour,
        )
        .outerjoin(
            order_pairs_sub,
            (Task.order_id == order_pairs_sub.c.order_id)
            & (Task.product_id == order_pairs_sub.c.product_id),
        )
        .join(Product, Task.product_id == Product.id)
        .outerjoin(
            colour_sub,
            (Task.order_id == colour_sub.c.order_id)
            & (Task.product_id == colour_sub.c.product_id)
            & (Task.line_group == colour_sub.c.line_group),
        )
        .where(
            Task.assigned_to == user_id,
            Task.status.in_(["completado", "pagado"]),
            Task.deleted_at == None,
        )
    )

    if category:
        tasks_detail_query = tasks_detail_query.outerjoin(
            Category, Product.category_id == Category.id
        ).where(Category.name_category == category)
    if start_date:
        tasks_detail_query = tasks_detail_query.where(
            func.coalesce(Task.completed_at, Task.created_at) >= start_date
        )
    if end_date:
        tasks_detail_query = tasks_detail_query.where(
            func.coalesce(Task.completed_at, Task.created_at) <= end_date
        )

    task_detail_rows = db.execute(tasks_detail_query).all()

    # Desglose por tipo de tarea
    breakdown_query = (
        select(Task.type, func.count(Task.id).label("count"))
        .join(Product, Task.product_id == Product.id)
        .where(
            Task.assigned_to == user_id,
            Task.status.in_(["completado", "pagado"]),
            Task.deleted_at == None,
        )
        .group_by(Task.type)
    )
    if category:
        breakdown_query = breakdown_query.outerjoin(
            Category, Product.category_id == Category.id
        ).where(Category.name_category == category)
    if start_date:
        breakdown_query = breakdown_query.where(
            func.coalesce(Task.completed_at, Task.created_at) >= start_date
        )
    if end_date:
        breakdown_query = breakdown_query.where(
            func.coalesce(Task.completed_at, Task.created_at) <= end_date
        )

    breakdown_results = db.execute(breakdown_query).all()
    tasks_breakdown = [
        MyPerformanceTaskBreakdown(
            process_name=(
                str(row._mapping["type"].value)
                if hasattr(row._mapping["type"], "value")
                else str(row._mapping["type"])
            ),
            count=row._mapping["count"],
        )
        for row in breakdown_results
    ]

    total_earnings = 0.0
    tasks_list = []
    for row_obj in task_detail_rows:
        row = row_obj._mapping
        pairs = int(
            row["task_amount"]
            if (row["task_amount"] and row["task_amount"] > 0)
            else (row["total_pairs"] or 0)
        )
        prices = row["task_prices"] or {}
        task_type = (
            str(row["type"].value)
            if hasattr(row["type"], "value")
            else str(row["type"])
        )
        price_per_dozen = float(prices.get(task_type, 0) or 0)
        task_price = round((pairs / 12) * price_per_dozen, 2) if pairs > 0 else 0.0
        total_earnings += task_price

        status_str = (
            str(row["status"].value)
            if hasattr(row["status"], "value")
            else str(row["status"])
        )

        tasks_list.append(
            MyTaskDetail(
                id=str(row["id"]),
                order_id=str(row["order_id"]) if row["order_id"] else None,
                product_name=row["name_product"] or "—",
                process_name=task_type,
                amount=pairs,
                status=status_str,
                colour=row["colour"],
                vale_number=row["vale_number"],
                created_at=(
                    row["created_at"].isoformat() if row["created_at"] else ""
                ),
                completed_at=(
                    row["completed_at"].isoformat()
                    if row["completed_at"]
                    else None
                ),
                price_per_dozen=price_per_dozen,
                task_total_price=task_price,
            )
        )

    return MyTasksReportResponse(
        total_tasks_completed=len(tasks_list),
        total_pairs_produced=sum(t.amount for t in tasks_list),
        total_earnings=round(total_earnings, 2),
        tasks_breakdown=tasks_breakdown,
        tasks_list=tasks_list,
        name=f"{current_user.name_user} {current_user.last_name}",
    )


@router.get(
    "/reports/shared",
    response_model=SharedReportListResponse,
    summary="Reportes compartidos con el empleado",
)
def get_shared_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista los reportes compartidos con el empleado autenticado."""
    shares = (
        db.query(ReportShare)
        .filter(
            ReportShare.target_user_id == current_user.id,
            ReportShare.deleted_at == None,
        )
        .order_by(desc(ReportShare.created_at))
        .all()
    )

    items = []
    for s in shares:
        shared_by_name = ""
        if s.shared_by:
            shared_by_name = f"{s.shared_by.name_user} {s.shared_by.last_name}"

        items.append(SharedReportItem(
            id=str(s.id),
            report_type=s.report_type,
            report_title=s.report_title,
            shared_by_name=shared_by_name,
            message=s.message,
            is_read=s.is_read,
            created_at=s.created_at,
        ))

    return SharedReportListResponse(reports=items, total=len(items))


@router.get(
    "/reports/shared/{share_id}",
    response_model=SharedReportDetailResponse,
    summary="Detalle de un reporte compartido",
)
def get_shared_report_detail(
    share_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    share = (
        db.query(ReportShare)
        .filter(
            ReportShare.id == share_id,
            ReportShare.target_user_id == current_user.id,
            ReportShare.deleted_at == None,
        )
        .first()
    )
    if not share:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    # Marcar como leído
    if not share.is_read:
        share.is_read = True
        share.read_at = datetime.now(UTC)
        db.commit()

    shared_by_name = ""
    if share.shared_by:
        shared_by_name = f"{share.shared_by.name_user} {share.shared_by.last_name}"

    return SharedReportDetailResponse(
        id=str(share.id),
        report_type=share.report_type,
        report_title=share.report_title,
        shared_by_name=shared_by_name,
        message=share.message,
        is_read=share.is_read,
        created_at=share.created_at,
        parameters=share.parameters or {},
    )
