# ════════════════════════════════════════
# 📄 Acceso a datos de incidencias de tareas (Incidence)
# ════════════════════════════════════════

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.incidence import Incidence, IncidenceStatus
from app.models.tasks import Task


class IncidenceRepository:
    """Consultas de Incidence. No hace commit: la transacción la dirige la capa superior."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_by_assignee(
        self, assignee_id: uuid.UUID, state: str | None = None
    ) -> list[Incidence]:
        """Incidencias de las tareas asignadas a un usuario. Sin estado: abiertas y en progreso."""
        query = (
            select(Incidence)
            .join(Task, Incidence.task_id == Task.id)
            .where(
                Task.assigned_to == assignee_id,
                Incidence.deleted_at.is_(None),
            )
        )
        if state:
            query = query.where(Incidence.state == state)
        else:
            query = query.where(
                Incidence.state.in_([IncidenceStatus.abierta, IncidenceStatus.en_progreso])
            )
        query = query.order_by(Incidence.created_at.desc())
        return list(self.db.execute(query).scalars().all())

    def count_open_by_assignee(self, assignee_id: uuid.UUID) -> int:
        """Cantidad de incidencias abiertas entre las tareas asignadas a un usuario."""
        return (
            self.db.execute(
                select(func.count(Incidence.id))
                .join(Task, Incidence.task_id == Task.id)
                .where(
                    Task.assigned_to == assignee_id,
                    Incidence.state == IncidenceStatus.abierta,
                    Incidence.deleted_at.is_(None),
                )
            ).scalar()
            or 0
        )
