# ════════════════════════════════════════
# 📄 Acceso a datos de productos del catálogo
# ════════════════════════════════════════

import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.style import Style


class ProductRepository:
    """Consultas y mutaciones de Product. No hace commit: la transacción la dirige la capa superior."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_admin_paginated(
        self,
        *,
        brand_id: uuid.UUID | None = None,
        style_id: uuid.UUID | None = None,
        category_id: uuid.UUID | None = None,
        state: bool | None = None,
        offset: int = 0,
        limit: int = 10,
    ) -> tuple[int, list[Product]]:
        query = (
            select(Product)
            .where(Product.deleted_at == None)  # noqa: E711
            .options(
                selectinload(Product.brand),
                selectinload(Product.style),
                selectinload(Product.category),
            )
        )
        count_query = select(func.count(Product.id)).where(Product.deleted_at == None)  # noqa: E711

        if brand_id:
            query = query.where(Product.brand_id == brand_id)
            count_query = count_query.where(Product.brand_id == brand_id)
        if style_id:
            query = query.where(Product.style_id == style_id)
            count_query = count_query.where(Product.style_id == style_id)
        if category_id:
            query = query.where(Product.category_id == category_id)
            count_query = count_query.where(Product.category_id == category_id)
        if state is not None:
            query = query.where(Product.state == state)
            count_query = count_query.where(Product.state == state)

        total = self.db.execute(count_query).scalar() or 0
        products = (
            self.db.execute(query.order_by(Product.name_product).offset(offset).limit(limit))
            .scalars()
            .all()
        )
        return total, list(products)

    def list_active_paginated(
        self,
        *,
        category_id: str | None = None,
        brand_id: str | None = None,
        style_id: str | None = None,
        color: str | None = None,
        search: str | None = None,
        offset: int = 0,
        limit: int = 12,
    ) -> tuple[int, list[Product]]:
        """Catálogo activo para cliente: filtros directos (UUID/str) y búsqueda con joins."""
        base_where = (Product.deleted_at == None) & (Product.state == True)  # noqa: E711
        stmt = select(Product).where(*[base_where])
        count_stmt = select(func.count(Product.id)).where(*[base_where])

        if category_id:
            stmt = stmt.where(Product.category_id == category_id)
            count_stmt = count_stmt.where(Product.category_id == category_id)
        if brand_id:
            stmt = stmt.where(Product.brand_id == brand_id)
            count_stmt = count_stmt.where(Product.brand_id == brand_id)
        if style_id:
            stmt = stmt.where(Product.style_id == style_id)
            count_stmt = count_stmt.where(Product.style_id == style_id)
        if color:
            stmt = stmt.where(Product.color == color)
            count_stmt = count_stmt.where(Product.color == color)
        if search:
            search_filter = (
                Product.name_product.ilike(f"%{search}%")
                | Brand.name_brand.ilike(f"%{search}%")
                | Style.name_style.ilike(f"%{search}%")
            )
            stmt = stmt.join(Brand, Product.brand_id == Brand.id).join(Style, Product.style_id == Style.id)
            stmt = stmt.where(search_filter)
            count_stmt = count_stmt.join(Brand, Product.brand_id == Brand.id).join(
                Style, Product.style_id == Style.id
            )
            count_stmt = count_stmt.where(search_filter)

        total = self.db.execute(count_stmt).scalar() or 0
        products = self.db.execute(stmt.offset(offset).limit(limit)).scalars().all()
        return total, list(products)

    def get_by_id(self, product_id) -> Product | None:
        """Producto vivo por id (None si borrado)."""
        return self.db.execute(
            select(Product).where((Product.id == product_id) & (Product.deleted_at == None))  # noqa: E711
        ).scalar()

    def get_by_id_any(self, product_id) -> Product | None:
        """Producto por id sin filtro de borrado (equivalente db.query(...).first())."""
        return self.db.query(Product).filter(Product.id == product_id).first()

    def get_brand(self, brand_id) -> Brand | None:
        return self.db.execute(
            select(Brand).where((Brand.id == brand_id) & (Brand.deleted_at == None))  # noqa: E711
        ).scalar()

    def get_style(self, style_id) -> Style | None:
        return self.db.execute(
            select(Style).where((Style.id == style_id) & (Style.deleted_at == None))  # noqa: E711
        ).scalar()

    def get_category(self, category_id) -> Category | None:
        return self.db.execute(
            select(Category).where((Category.id == category_id) & (Category.deleted_at == None))  # noqa: E711
        ).scalar()

    def find_duplicate(
        self,
        *,
        style_id,
        brand_id,
        category_id,
        name: str,
        color: str | None,
        exclude_id=None,
    ) -> Product | None:
        """Producto vivo con mismo nombre/estilo/marca/categoría/color (opcional excluir id)."""
        stmt = select(Product).where(
            (Product.style_id == style_id)
            & (Product.brand_id == brand_id)
            & (Product.category_id == category_id)
            & (Product.name_product == name)
            & (Product.deleted_at == None)  # noqa: E711
        )
        if exclude_id is not None:
            stmt = stmt.where(Product.id != exclude_id)
        if color:
            stmt = stmt.where(Product.color == color)
        else:
            stmt = stmt.where((Product.color == None) | (Product.color == ""))  # noqa: E711
        return self.db.execute(stmt).scalar()

    def existing_names(self, names: set[str]) -> set[str]:
        """Nombres de producto ya existentes dentro del conjunto dado."""
        if not names:
            return set()
        return {
            row[0]
            for row in self.db.query(Product.name_product)
            .filter(Product.name_product.in_(names))
            .all()
        }

    def add(self, product: Product) -> None:
        self.db.add(product)
