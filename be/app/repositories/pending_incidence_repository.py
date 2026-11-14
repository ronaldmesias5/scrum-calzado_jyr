# ════════════════════════════════════════
# 📄 Acceso a datos de incidencias pendientes de producto
# ════════════════════════════════════════

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.pending_incidence import PendingProductIncidence


class PendingProductIncidenceRepository:
    """Consultas y mutaciones de PendingProductIncidence. No hace commit."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def count_live_by_order(self, order_id: uuid.UUID) -> int:
        return (
            self.db.execute(
                select(func.count(PendingProductIncidence.id)).where(
                    PendingProductIncidence.order_id == order_id,
                    PendingProductIncidence.deleted_at.is_(None),
                )
            ).scalar()
            or 0
        )
