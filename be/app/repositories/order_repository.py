# ════════════════════════════════════════
# 📄 Acceso a datos de pedidos (cabecera Order)
# ════════════════════════════════════════

import uuid

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderDetail
from app.models.product import Product
from app.models.user import User


class OrderRepository:
    """Consultas y mutaciones de Order. No hace commit: la transacción la dirige la capa superior."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def _with_details(self):
        return select(Order).options(
            selectinload(Order.details)
            .selectinload(OrderDetail.product)
            .selectinload(Product.inventory)
        )

    def get_by_id(self, order_id: uuid.UUID) -> Order | None:
        return self.db.execute(select(Order).where(Order.id == order_id)).scalar_one_or_none()

    def get_with_details(self, order_id: uuid.UUID) -> Order | None:
        return self.db.execute(
            self._with_details().where(Order.id == order_id)
        ).scalar_one_or_none()

    def get_owned_with_details(self, order_id: uuid.UUID, customer_id: uuid.UUID) -> Order | None:
        return self.db.execute(
            self._with_details().where(Order.id == order_id, Order.customer_id == customer_id)
        ).scalar_one_or_none()

    def list_paginated(
        self,
        state=None,
        customer_name: str | None = None,
        offset: int = 0,
        page_size: int = 10,
    ) -> tuple[int, list[Order]]:
        """Lista órdenes con filtros opcionales. Retorna (total, página_actual)."""
        query = select(Order)
        count_query = select(func.count(Order.id)).select_from(Order)

        if state:
            query = query.where(Order.state == state)
            count_query = count_query.where(Order.state == state)

        if customer_name:
            name_filter = f"%{customer_name.strip()}%"
            query = query.join(User, Order.customer_id == User.id).where(
                (User.name_user.ilike(name_filter)) | (User.last_name.ilike(name_filter))
            )
            count_query = count_query.join(User, Order.customer_id == User.id).where(
                (User.name_user.ilike(name_filter)) | (User.last_name.ilike(name_filter))
            )

        total = self.db.execute(count_query).scalar() or 0
        query = query.order_by(desc(Order.created_at)).offset(offset).limit(page_size)
        orders = self.db.execute(query).scalars().all()
        return total, list(orders)

    def count_by_customer(self, customer_id: uuid.UUID) -> int:
        return (
            self.db.execute(
                select(func.count(Order.id)).where(Order.customer_id == customer_id)
            ).scalar()
            or 0
        )

    def list_by_customer_paginated(
        self, customer_id: uuid.UUID, offset: int, page_size: int
    ) -> list[Order]:
        return list(
            self.db.execute(
                self._with_details()
                .where(Order.customer_id == customer_id)
                .order_by(desc(Order.created_at))
                .offset(offset)
                .limit(page_size)
            )
            .scalars()
            .all()
        )

    def count_by_state_by_customer(self, customer_id: uuid.UUID) -> list[tuple]:
        return self.db.execute(
            select(Order.state, func.count(Order.id))
            .where(Order.customer_id == customer_id)
            .group_by(Order.state)
        ).all()

    def list_by_customer_dates(
        self,
        customer_id: uuid.UUID,
        start_date=None,
        end_date=None,
    ) -> list[Order]:
        query = select(Order).where(Order.customer_id == customer_id)
        if start_date:
            query = query.where(Order.created_at >= start_date)
        if end_date:
            query = query.where(Order.created_at <= end_date)
        query = query.order_by(desc(Order.created_at))
        return list(self.db.execute(query).scalars().all())

    def add(self, order: Order) -> None:
        self.db.add(order)

    def delete(self, order: Order) -> None:
        self.db.delete(order)
