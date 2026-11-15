# ════════════════════════════════════════
# 📄 Acceso a datos de precios personalizados por cliente
# ════════════════════════════════════════

import uuid

from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.models.client_price import ClientPrice


class ClientPriceRepository:
    """Consultas y mutaciones de ClientPrice. No hace commit."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_paginated(self, client_id=None, offset: int = 0, limit: int = 50) -> list[ClientPrice]:
        query = (
            select(ClientPrice)
            .options(joinedload(ClientPrice.client), joinedload(ClientPrice.product))
            .where(ClientPrice.deleted_at.is_(None))
        )
        if client_id:
            query = query.where(ClientPrice.client_id == client_id)
        query = query.order_by(desc(ClientPrice.created_at)).offset(offset).limit(limit)
        return list(self.db.execute(query).unique().scalars().all())

    def get_by_id(self, price_id) -> ClientPrice | None:
        return (
            self.db.execute(
                select(ClientPrice)
                .options(joinedload(ClientPrice.client), joinedload(ClientPrice.product))
                .where(ClientPrice.id == price_id, ClientPrice.deleted_at.is_(None))
            )
            .unique()
            .scalar_one_or_none()
        )

    def get_live_by_id(self, price_id) -> ClientPrice | None:
        return self.db.execute(
            select(ClientPrice).where(ClientPrice.id == price_id, ClientPrice.deleted_at.is_(None))
        ).scalar_one_or_none()

    def get_by_client_product(self, client_id, product_id) -> ClientPrice | None:
        return self.db.execute(
            select(ClientPrice).where(
                ClientPrice.client_id == client_id,
                ClientPrice.product_id == product_id,
                ClientPrice.deleted_at.is_(None),
            )
        ).scalar_one_or_none()

    def add(self, client_price: ClientPrice) -> None:
        self.db.add(client_price)

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
