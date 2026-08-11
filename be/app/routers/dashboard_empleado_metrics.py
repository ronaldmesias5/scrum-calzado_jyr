"""
Archivo: be/app/routers/dashboard_empleado_metrics.py
Descripción: Endpoints de métricas del panel del empleado.
"""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.incidence import Incidence, IncidenceStatus
from app.models.tasks import Task
from app.models.user import User
from app.schemas.dashboard_empleado import (
    EmployeeMetricSchema,
    EmployeeMetricsResponse,
)

router = APIRouter(
    prefix="/api/v1/dashboard/employee",
    tags=["dashboard-empleado"],
)


@router.get(
    "/metrics",
    response_model=EmployeeMetricsResponse,
    summary="Métricas del dashboard del empleado",
)
def get_employee_metrics(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> EmployeeMetricsResponse:
    """Retorna KPIs del empleado basados en sus tareas asignadas."""
    today_start = datetime.now(UTC).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    today_end = today_start.replace(hour=23, minute=59, second=59, microsecond=999999)

    # Tareas pendientes (asignadas a mí, no completadas ni canceladas)
    pending_tasks = db.execute(
        select(func.count(Task.id))
        .where(
            Task.assigned_to == current_user.id,
            Task.status.in_(["pendiente", "por_liquidar", "en_progreso"]),
            Task.deleted_at == None,
        )
    ).scalar() or 0

    # Tareas completadas hoy
    completed_today = db.execute(
        select(func.count(Task.id))
        .where(
            Task.assigned_to == current_user.id,
            Task.status == "completado",
            Task.completed_at >= today_start,
            Task.completed_at <= today_end,
            Task.deleted_at == None,
        )
    ).scalar() or 0

    # Total pares asignados (no cancelados)
    total_pairs = db.execute(
        select(func.coalesce(func.sum(Task.amount), 0))
        .where(
            Task.assigned_to == current_user.id,
            Task.status != "cancelado",
            Task.deleted_at == None,
        )
    ).scalar() or 0

    # Incidencias abiertas de mis tareas
    open_incidences = db.execute(
        select(func.count(Incidence.id))
        .join(Task, Incidence.task_id == Task.id)
        .where(
            Task.assigned_to == current_user.id,
            Incidence.state == IncidenceStatus.abierta,
            Incidence.deleted_at == None,
        )
    ).scalar() or 0

    return EmployeeMetricsResponse(
        metrics=[
            EmployeeMetricSchema(
                label="Tareas Pendientes",
                value=pending_tasks,
                icon="clock",
            ),
            EmployeeMetricSchema(
                label="Completadas Hoy",
                value=completed_today,
                icon="check-circle",
            ),
            EmployeeMetricSchema(
                label="Mis Pares",
                value=int(total_pairs),
                icon="package",
            ),
            EmployeeMetricSchema(
                label="Incidencias Abiertas",
                value=open_incidences,
                icon="alert-triangle",
            ),
        ]
    )
