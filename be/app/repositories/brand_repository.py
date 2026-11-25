# ════════════════════════════════════════
# 📄 Acceso a datos de marcas del catálogo
# ════════════════════════════════════════

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.brand import Brand
from app.models.product import Product
from app.models.style import Style


class BrandRepository:
    """Consultas y mutaciones de Brand. No hace commit: la transacción la dirige la capa superior."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_all(self) -> list[Brand]:
        return list(
            self.db.execute(
                select(Brand).where(Brand.deleted_at == None).order_by(Brand.name_brand)  # noqa: E711
            )
            .scalars()
            .all()
        )

    def list_public(
        self, only_with_products: bool = False, category_id=None
    ) -> list[Brand]:
        """Marcas del catálogo público; opcionalmente solo con productos activos."""
        query = select(Brand).where(Brand.deleted_at.is_(None))
        if only_with_products or category_id:
            conditions = [
                (Product.brand_id == Brand.id)
                & (Product.deleted_at.is_(None))
                & (Product.state.is_(True))
            ]
            if category_id:
                conditions.append(Product.category_id == category_id)
            query = query.where(select(Product.id).where(*conditions).exists())
        return list(self.db.execute(query).scalars().all())

    def get_by_id(self, brand_id) -> Brand | None:
        return self.db.execute(
            select(Brand).where((Brand.id == brand_id) & (Brand.deleted_at == None))  # noqa: E711
        ).scalar()

    def find_by_name(self, name: str, exclude_id=None) -> Brand | None:
        stmt = select(Brand).where(
            (Brand.name_brand.ilike(name)) & (Brand.deleted_at == None)  # noqa: E711
        )
        if exclude_id is not None:
            stmt = stmt.where(Brand.id != exclude_id)
        return self.db.execute(stmt).scalar()

    def list_active_styles(self, brand_id) -> list[Style]:
        return list(
            self.db.execute(
                select(Style).where((Style.brand_id == brand_id) & (Style.deleted_at == None))  # noqa: E711
            )
            .scalars()
            .all()
        )

    def add(self, brand: Brand) -> None:
        self.db.add(brand)
