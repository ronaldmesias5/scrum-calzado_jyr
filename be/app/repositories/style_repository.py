# ════════════════════════════════════════
# 📄 Acceso a datos de estilos del catálogo
# ════════════════════════════════════════

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.style import Style


class StyleRepository:
    """Consultas y mutaciones de Style. No hace commit: la transacción la dirige la capa superior."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def list_all(self, brand_id=None) -> list[Style]:
        query = select(Style).where(Style.deleted_at == None)  # noqa: E711
        if brand_id:
            query = query.where(Style.brand_id == brand_id)
        return list(self.db.execute(query.order_by(Style.name_style)).scalars().all())

    def get_by_id(self, style_id) -> Style | None:
        return self.db.execute(
            select(Style).where((Style.id == style_id) & (Style.deleted_at == None))  # noqa: E711
        ).scalar()

    def find_by_name_in_brand(self, name: str, brand_id, exclude_id=None) -> Style | None:
        stmt = select(Style).where(
            (Style.name_style.ilike(name))
            & (Style.brand_id == brand_id)
            & (Style.deleted_at == None)  # noqa: E711
        )
        if exclude_id is not None:
            stmt = stmt.where(Style.id != exclude_id)
        return self.db.execute(stmt).scalar()

    def list_active_products(self, style_id) -> list[Product]:
        return list(
            self.db.execute(
                select(Product).where(
                    (Product.style_id == style_id) & (Product.deleted_at == None)  # noqa: E711
                )
            )
            .scalars()
            .all()
        )

    def add(self, style: Style) -> None:
        self.db.add(style)
