# ════════════════════════════════════════
# 📄 Acceso a datos de reportes compartidos (ReportShare)
# ════════════════════════════════════════

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.report_share import ReportShare


class ReportShareRepository:
    """Consultas y mutaciones de ReportShare. No hace commit: la transacción la dirige la capa superior."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def add(self, share: ReportShare) -> None:
        self.db.add(share)

    def list_by_target_user(self, user_id, report_type: str | None = None) -> list[ReportShare]:
        """Reportes compartidos con un usuario, más recientes primero."""
        query = self.db.query(ReportShare).filter(
            ReportShare.target_user_id == user_id,
            ReportShare.deleted_at.is_(None),
        )
        if report_type:
            query = query.filter(ReportShare.report_type == report_type)
        return query.order_by(desc(ReportShare.created_at)).all()

    def get_for_target(self, share_id, user_id) -> ReportShare | None:
        """Reporte compartido por id, solo si pertenece al usuario destino."""
        return (
            self.db.query(ReportShare)
            .filter(
                ReportShare.id == share_id,
                ReportShare.target_user_id == user_id,
                ReportShare.deleted_at.is_(None),
            )
            .first()
        )
