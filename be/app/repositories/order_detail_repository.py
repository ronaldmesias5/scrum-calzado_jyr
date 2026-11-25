# ════════════════════════════════════════
# 📄 Acceso a datos de líneas de pedido (OrderDetail)
# ════════════════════════════════════════

import uuid

from sqlalchemy import delete as sa_delete
from sqlalchemy.orm import Session

from app.models.order import OrderDetail


class OrderDetailRepository:
    """Consultas y mutaciones de OrderDetail. No hace commit."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_by_order(self, order_id: uuid.UUID) -> list[OrderDetail]:
        return (
            self.db.query(OrderDetail).filter(OrderDetail.order_id == order_id).all()
        )

    def delete_by_order(self, order_id: uuid.UUID) -> None:
        self.db.execute(sa_delete(OrderDetail).where(OrderDetail.order_id == order_id))

    def add(self, detail: OrderDetail) -> None:
        self.db.add(detail)
