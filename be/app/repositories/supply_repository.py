# ════════════════════════════════════════
# 📄 Acceso a datos de insumos y sus vínculos con productos
# ════════════════════════════════════════

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session, selectinload

from app.models.product_supplies import ProductSupply
from app.models.supplies import Supplies
from app.models.supply_categories import SupplyCategory


class SupplyRepository:
    """Consultas y mutaciones de Supplies/SupplyCategory. No hace commit."""

    def __init__(self, db: Session) -> None:
        self.db = db

    # ── Categorías ─────────────────────────────────────────

    def list_categories_ordered(self) -> list[SupplyCategory]:
        return list(
            self.db.execute(select(SupplyCategory).order_by(SupplyCategory.name)).scalars().all()
        )

    def list_all_for_colors(self) -> list[SupplyCategory]:
        """Categorías sin orden (para calcular el siguiente color libre)."""
        return list(self.db.execute(select(SupplyCategory)).scalars().all())

    def get_category_by_id(self, category_id) -> SupplyCategory | None:
        return self.db.execute(
            select(SupplyCategory).where(SupplyCategory.id == category_id)
        ).scalar()

    def get_category_by_name(self, name: str) -> SupplyCategory | None:
        return self.db.execute(
            select(SupplyCategory).where(SupplyCategory.name == name)
        ).scalar()

    def add_category(self, category: SupplyCategory) -> None:
        self.db.add(category)

    def delete_category(self, category: SupplyCategory) -> None:
        self.db.delete(category)

    # ── Insumos ────────────────────────────────────────────

    def list_supplies_paginated(
        self, category: str | None, offset: int = 0, limit: int = 10
    ) -> tuple[int, list[Supplies]]:
        stmt = select(Supplies).where(Supplies.deleted_at == None)  # noqa: E711
        count_stmt = select(func.count(Supplies.id)).where(Supplies.deleted_at == None)  # noqa: E711

        if category:
            stmt = stmt.where(Supplies.category == category)
            count_stmt = count_stmt.where(Supplies.category == category)

        total = self.db.execute(count_stmt).scalar() or 0
        stmt = (
            stmt.options(
                selectinload(Supplies.product_links).selectinload(ProductSupply.product)
            )
            .order_by(desc(Supplies.created_at))
            .offset(offset)
            .limit(limit)
        )
        return total, list(self.db.execute(stmt).scalars().all())

    def get_live_supply(self, supply_id) -> Supplies | None:
        return self.db.execute(
            select(Supplies).where(
                (Supplies.id == supply_id) & (Supplies.deleted_at == None)  # noqa: E711
            )
        ).scalar()

    def add_supply(self, supply: Supplies) -> None:
        self.db.add(supply)


class ProductSupplyRepository:
    """Consultas y mutaciones de ProductSupply. No hace commit."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_link(self, product_id, supply_id) -> ProductSupply | None:
        return self.db.execute(
            select(ProductSupply).where(
                (ProductSupply.product_id == product_id) & (ProductSupply.supply_id == supply_id)
            )
        ).scalar()

    def list_links_by_product(self, product_id) -> list[ProductSupply]:
        return list(
            self.db.execute(
                select(ProductSupply).where(ProductSupply.product_id == product_id)
            ).scalars().all()
        )

    def add_link(self, link: ProductSupply) -> None:
        self.db.add(link)

    def delete_link(self, link: ProductSupply) -> None:
        self.db.delete(link)
