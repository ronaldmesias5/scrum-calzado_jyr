# ════════════════════════════════════════
# 📄 Endpoints de métricas del panel del empleado
# ════════════════════════════════════════

from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.repositories.incidence_repository import IncidenceRepository
from app.repositories.task_repository import TaskRepository
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

    task_repo = TaskRepository(db)

    # Tareas pendientes (asignadas a mí, no completadas ni canceladas)
    pending_tasks = task_repo.count_pending_by_assignee(current_user.id)

    # Tareas completadas hoy
    completed_today = task_repo.count_completed_between(
        current_user.id, today_start, today_end
    )

    # Total pares asignados (no cancelados)
    total_pairs = task_repo.sum_amount_by_assignee(current_user.id)

    # Incidencias abiertas de mis tareas
    open_incidences = IncidenceRepository(db).count_open_by_assignee(current_user.id)

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

