# ════════════════════════════════════════
# 📄 Acceso a datos de reportes compartidos (ReportShare)
# ════════════════════════════════════════

from sqlalchemy.orm import Session

from app.models.report_share import ReportShare


class ReportShareRepository:
    """Mutaciones de ReportShare. No hace commit: la transacción la dirige la capa superior."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def add(self, share: ReportShare) -> None:
        self.db.add(share)
