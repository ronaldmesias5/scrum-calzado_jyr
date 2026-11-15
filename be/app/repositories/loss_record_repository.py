# ════════════════════════════════════════
# 📄 Acceso a datos de incidencias generales (LossRecord)
# ════════════════════════════════════════

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.scrap import LossRecord

GENERAL_INCIDENCE_CATEGORIES = ("maquinaria", "insumo")


class LossRecordRepository:
    """Consultas de LossRecord. No hace commit: la transacción la dirige la capa superior."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_general_by_user(self, user_id) -> list[LossRecord]:
        """Incidencias generales (maquinaria/insumo) registradas por un usuario."""
        stmt = (
            select(LossRecord)
            .where(
                LossRecord.registered_by_id == user_id,
                LossRecord.incidence_category.in_(GENERAL_INCIDENCE_CATEGORIES),
                LossRecord.deleted_at.is_(None),
            )
            .order_by(LossRecord.created_at.desc())
        )
        return list(self.db.execute(stmt).scalars().all())
