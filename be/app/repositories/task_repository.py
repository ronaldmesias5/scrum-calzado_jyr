# ════════════════════════════════════════
# 📄 Acceso a datos de tareas de producción (Task)
# ════════════════════════════════════════

import uuid

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.models.tasks import Task


class TaskRepository:
    """Consultas y mutaciones de Task. No hace commit."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def order_ids_with_live_tasks(self, order_ids: list[uuid.UUID]) -> set[uuid.UUID]:
        """Ids de pedidos que tienen al menos una tarea viva (producción iniciada)."""
        if not order_ids:
            return set()
        rows = self.db.execute(
            select(distinct(Task.order_id)).where(
                Task.order_id.in_(order_ids), Task.deleted_at.is_(None)
            )
        ).all()
        return {row[0] for row in rows}

    def count_live_by_order(self, order_id: uuid.UUID) -> int:
        return (
            self.db.execute(
                select(func.count(Task.id)).where(
                    Task.order_id == order_id, Task.deleted_at.is_(None)
                )
            ).scalar()
            or 0
        )
