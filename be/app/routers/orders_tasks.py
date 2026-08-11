"""
Módulo: tasks.py (Orders)
Descripción: Rutas de tareas de producción y vales asociados a órdenes.
¿Para qué? Endpoints GET /tasks/next-number, GET /tasks/all, GET/POST /{order_id}/tasks,
PATCH /tasks/{task_id}/assign y PATCH /tasks/{task_id}/status.
¿Nota? Comparte prefix y tag con router.py de orders; la lógica de inventario vive en service.py.
"""

import traceback
import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, desc, func, select
from sqlalchemy.orm import Session, joinedload

from app.dependencies import get_current_user, get_db
from app.models.order import Order, OrderDetail
from app.models.tasks import Task
from app.models.user import User
from app.schemas.orders import (
    AssignTaskEmployeeRequest,
    ProductionBatchTasksRequest,
    ProductionTaskResponse,
    TaskStatusUpdateRequest,
)
from app.controllers.orders import complete_emplantillado
from app.controllers.supplies import deduct_supplies_for_production

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
        raise HTTPException(status_code=500, detail=f"Error al calcular número de vale: {e!s}")


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
            except Exception:
                traceback.print_exc()
                continue

        return tasks_list

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error al listar tareas: {e!s}")


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
        now = datetime.now(UTC)

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
        raise HTTPException(status_code=500, detail=f"Error al crear tareas: {e!s}")


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
        raise HTTPException(status_code=500, detail=f"Error al listar tareas: {e!s}")


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

    # Actualizar el status
    task.status = request.status

    # Asignar fecha de completado si se marca como completado por primera vez o si se marca como pagado
    if request.status in ["completado", "pagado"] and not task.completed_at:
        task.completed_at = datetime.now(UTC)
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
                now2 = datetime.now(UTC)
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
        complete_emplantillado(db=db, current_user_id=current_user.id, task=task)

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
