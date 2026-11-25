# ════════════════════════════════════════
# 📄 Acceso a datos de tickets de reactivación de cuenta
# ════════════════════════════════════════

from sqlalchemy.orm import Session

from app.models.reactivation_ticket import ReactivationTicket


class ReactivationTicketRepository:
    """Consultas y mutaciones de ReactivationTicket. No hace commit."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, ticket_id) -> ReactivationTicket | None:
        return self.db.query(ReactivationTicket).filter(ReactivationTicket.id == ticket_id).first()

    def get_pending_by_user(self, user_id) -> ReactivationTicket | None:
        return (
            self.db.query(ReactivationTicket)
            .filter(
                ReactivationTicket.user_id == user_id,
                ReactivationTicket.status == "pending",
            )
            .first()
        )

    def list_all(self, status: str | None = None) -> list[ReactivationTicket]:
        query = self.db.query(ReactivationTicket)
        if status:
            query = query.filter(ReactivationTicket.status == status)
        return query.order_by(ReactivationTicket.created_at.desc()).all()

    def add(self, ticket: ReactivationTicket) -> None:
        self.db.add(ticket)
