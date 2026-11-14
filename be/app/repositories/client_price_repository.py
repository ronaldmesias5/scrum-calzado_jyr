# ════════════════════════════════════════
# 📄 Acceso a datos de precios personalizados por cliente
# ════════════════════════════════════════

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.client_price import ClientPrice


class ClientPriceRepository:
    """Consultas y mutaciones de ClientPrice. No hace commit."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def prices_by_products(
        self, client_id: uuid.UUID, product_ids: set[uuid.UUID]
    ) -> list[tuple]:
        """Filas (product_id, unit_price) vivas para un conjunto de productos."""
        if not product_ids:
            return []
        return self.db.execute(
            select(ClientPrice.product_id, ClientPrice.unit_price).where(
                ClientPrice.client_id == client_id,
                ClientPrice.product_id.in_(product_ids),
                ClientPrice.deleted_at.is_(None),
            )
        ).all()
