# ════════════════════════════════════════
# 📄 Acceso a datos de categorías de producto
# ════════════════════════════════════════

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product


class CategoryRepository:
    """Consultas y mutaciones de Category. No hace commit: la transacción la dirige la capa superior."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_all(self) -> list[Category]:
        return list(
            self.db.execute(
                select(Category).where(Category.deleted_at == None).order_by(Category.name_category)  # noqa: E711
            )
            .scalars()
            .all()
        )

    def list_public(self, only_with_products: bool = False) -> list[Category]:
        """Categorías del catálogo público; opcionalmente solo con productos activos."""
        query = select(Category).where(Category.deleted_at.is_(None))
        if only_with_products:
            query = query.where(
                select(Product.id)
                .where(
                    (Product.category_id == Category.id)
                    & (Product.deleted_at.is_(None))
                    & (Product.state.is_(True))
                )
                .exists()
            )
        return list(self.db.execute(query).scalars().all())

    def get_by_id(self, category_id) -> Category | None:
        return self.db.execute(
            select(Category).where((Category.id == category_id) & (Category.deleted_at == None))  # noqa: E711
        ).scalar()

    def find_by_name(self, name: str, exclude_id=None) -> Category | None:
        stmt = select(Category).where(
            (Category.name_category.ilike(name)) & (Category.deleted_at == None)  # noqa: E711
        )
        if exclude_id is not None:
            stmt = stmt.where(Category.id != exclude_id)
        return self.db.execute(stmt).scalar()

    def count_active_products(self, category_id) -> int:
        return (
            self.db.execute(
                select(func.count(Product.id)).where(
                    (Product.category_id == category_id) & (Product.deleted_at == None)  # noqa: E711
                )
            ).scalar()
            or 0
        )

    def add(self, category: Category) -> None:
        self.db.add(category)
