# ════════════════════════════════════════
# 📄 Acceso a datos de inventario y movimientos
# ════════════════════════════════════════

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement


class InventoryRepository:
    """Consultas y mutaciones de Inventory/InventoryMovement. No hace commit."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_all(self, product_id=None) -> list[Inventory]:
        query = select(Inventory).where(Inventory.deleted_at == None)  # noqa: E711
        if product_id:
            query = query.where(Inventory.product_id == product_id)
        return list(self.db.execute(query.order_by(Inventory.product_id, Inventory.size)).scalars().all())

    def list_by_product(self, product_id) -> list[Inventory]:
        return (
            self.db.query(Inventory)
            .filter((Inventory.product_id == product_id) & (Inventory.deleted_at == None))  # noqa: E711
            .all()
        )

    def list_live_for_product(self, product_id) -> list[Inventory]:
        return list(
            self.db.execute(
                select(Inventory).where(
                    (Inventory.product_id == product_id) & (Inventory.deleted_at == None)  # noqa: E711
                )
            )
            .scalars()
            .all()
        )

    def get_by_id(self, inventory_id) -> Inventory | None:
        return self.db.execute(
            select(Inventory).where((Inventory.id == inventory_id) & (Inventory.deleted_at == None))  # noqa: E711
        ).scalar()

    def find_for_product_size_colour(self, product_id, size, colour) -> list[Inventory]:
        """Todos los vivos para producto+talla+color (color None = sin color). Incluye duplicados sanables."""
        return list(
            self.db.execute(
                select(Inventory).where(
                    (Inventory.product_id == product_id)
                    & (Inventory.size == size)
                    & (Inventory.colour == (colour or None))
                    & (Inventory.deleted_at == None)  # noqa: E711
                )
            )
            .scalars()
            .all()
        )

    def find_for_product_size_no_colour(self, product_id, size) -> list[Inventory]:
        return list(
            self.db.execute(
                select(Inventory).where(
                    (Inventory.product_id == product_id)
                    & (Inventory.size == size)
                    & (Inventory.colour.is_(None))
                    & (Inventory.deleted_at == None)  # noqa: E711
                )
            )
            .scalars()
            .all()
        )

    def find_for_product_colour(self, product_id, colour) -> Inventory | None:
        return (
            self.db.query(Inventory)
            .filter(
                (Inventory.product_id == product_id)
                & (Inventory.colour == colour)
                & (Inventory.deleted_at == None)  # noqa: E711
            )
            .first()
        )

    def list_for_update(self, product_id, size) -> list[Inventory]:
        """Filas vivas con FOR UPDATE (evita doble descuento en movimientos)."""
        return list(
            self.db.execute(
                select(Inventory)
                .where(
                    (Inventory.product_id == product_id)
                    & (Inventory.size == size)
                    & (Inventory.deleted_at == None)  # noqa: E711
                )
                .with_for_update()
            )
            .scalars()
            .all()
        )

    def stock_totals_by_products(self, product_ids: list[uuid.UUID]) -> dict[uuid.UUID, tuple[int, int]]:
        """(amount, reserved) agrupados por producto en una sola consulta."""
        if not product_ids:
            return {}
        rows = self.db.execute(
            select(
                Inventory.product_id,
                func.sum(Inventory.amount),
                func.sum(Inventory.reserved),
            )
            .where(
                Inventory.product_id.in_(product_ids),
                Inventory.deleted_at.is_(None),
            )
            .group_by(Inventory.product_id)
        ).all()
        return {row[0]: (int(row[1] or 0), int(row[2] or 0)) for row in rows}

    def stock_available_by_products(self, product_ids: list) -> dict[str, int]:
        """Stock disponible (suma amount) por producto, clave str(id)."""
        if not product_ids:
            return {}
        rows = self.db.execute(
            select(Inventory.product_id, func.sum(Inventory.amount))
            .where(
                (Inventory.product_id.in_(product_ids)) & (Inventory.deleted_at.is_(None))
            )
            .group_by(Inventory.product_id)
        ).all()
        return {str(pid): int(qty or 0) for pid, qty in rows}

    def stock_total_for_product(self, product_id) -> int:
        stock_total = self.db.execute(
            select(func.sum(Inventory.amount).label("total"))
            .where((Inventory.product_id == product_id) & (Inventory.deleted_at == None))  # noqa: E711
        ).scalar() or 0
        return int(stock_total)

    def add(self, inventory: Inventory) -> None:
        self.db.add(inventory)

    def add_movement(self, movement: InventoryMovement) -> None:
        self.db.add(movement)
