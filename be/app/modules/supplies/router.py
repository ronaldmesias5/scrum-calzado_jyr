"""
Archivo: be/app/modules/supplies/router.py
Descripción: Router FastAPI para la gestión de insumos de fabricación.

Endpoints:
  GET    /api/v1/supplies               - Listar insumos (filtrar por categoría)
  POST   /api/v1/supplies               - Crear insumo
  PUT    /api/v1/supplies/{id}           - Editar insumo
  DELETE /api/v1/supplies/{id}           - Soft delete insumo
  POST   /api/v1/products/{id}/supplies  - Vincular insumo a producto
  DELETE /api/v1/products/{id}/supplies/{supply_id} - Desvincular
  GET    /api/v1/products/{id}/supplies/check - Verificar disponibilidad
"""

import uuid
from datetime import datetime

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.dependencies import get_db
from app.models.supplies import Supplies
from app.models.supply_categories import SupplyCategory
from app.models.product_supplies import ProductSupply
from app.models.product import Product
from app.modules.supplies.schemas import (
    SupplyCreate,
    SupplyUpdate,
    SupplyOut,
    SuppliesListResponse,
    LinkedProductOut,
    LinkSupplyToProduct,
    ProductSuppliesCheckResponse,
    ProductSupplyOut,
)

class InternalSupplyCategoryCreate(BaseModel):
    name: str
    global_stage: Optional[str] = "otros"

# Paleta de colores predefinida
PREDEFINED_COLORS = ['amber', 'blue', 'purple', 'green', 'gray']
AVAILABLE_COLORS = ['red', 'orange', 'yellow', 'lime', 'cyan', 'indigo', 'pink', 'rose']

def _get_next_category_color(db: Session) -> str:
    """Asigna un color automático para una nueva categoría."""
    existing_cats = db.execute(select(SupplyCategory)).scalars().all()
    existing_colors = {cat.color for cat in existing_cats}
    
    # Usar colores disponibles que no estén usados
    for color in AVAILABLE_COLORS:
        if color not in existing_colors:
            return color
    
    # Si se agotaron, reiniciar desde el inicio
    return AVAILABLE_COLORS[0]

router = APIRouter(
    prefix="/api/v1",
    tags=["supplies"],
)


def _supply_to_out(supply: Supplies) -> SupplyOut:
    """Convierte un objeto Supplies ORM a SupplyOut schema."""
    linked = []
    for link in supply.product_links:
        if link.product:
            linked.append(LinkedProductOut(
                product_id=str(link.product_id),
                product_name=link.product.name_product,
                quantity_required=link.quantity_required,
            ))
    return SupplyOut(
        id=str(supply.id),
        name=supply.name_supplies,
        description=supply.description_supplies,
        category=supply.category.value if hasattr(supply.category, "value") else supply.category,
        color=supply.color,
        stock_quantity=supply.stock_quantity,
        sizes=supply.sizes,
        unit=supply.unit,
        created_at=supply.created_at,
        linked_products=linked,
    )


# ─────────────────────────────────────────────────────────
# GET y POST /supplies/categories — Categorías de Insumos
# ─────────────────────────────────────────────────────────

@router.get("/supplies/categories", summary="Listar categorias de insumos")
def list_supply_categories(db: Session = Depends(get_db)):
    cats = db.execute(select(SupplyCategory).order_by(SupplyCategory.name)).scalars().all()
    return [{"id": str(c.id), "name": c.name, "color": c.color, "global_stage": c.global_stage} for c in cats]

@router.post("/supplies/categories", status_code=201, summary="Crear categoria de insumo")
def create_supply_category(body: InternalSupplyCategoryCreate, db: Session = Depends(get_db)):
    # Asignar un color automático
    color = _get_next_category_color(db)
    cat = SupplyCategory(
        name=body.name.lower(), 
        color=color,
        global_stage=body.global_stage
    )
    try:
        db.add(cat)
        db.commit()
        db.refresh(cat)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="La categoría ya existe o es inválida")
    return {"id": str(cat.id), "name": cat.name, "color": cat.color, "global_stage": cat.global_stage}

@router.delete("/supplies/categories/{category_id}", status_code=204, summary="Eliminar categoria de insumo")
def delete_supply_category(category_id: str, db: Session = Depends(get_db)):
    try:
        uid = uuid.UUID(category_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")
    cat = db.execute(select(SupplyCategory).where(SupplyCategory.id == uid)).scalars().first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db.delete(cat)
    db.commit()

# ─────────────────────────────────────────────────────────
# GET /supplies — Listar insumos
# ─────────────────────────────────────────────────────────

@router.get("/supplies", response_model=SuppliesListResponse, summary="Listar insumos")
def list_supplies(
    category: str | None = Query(None, description="Filtrar por categoría"),
    db: Session = Depends(get_db),
) -> SuppliesListResponse:
    stmt = select(Supplies).where(Supplies.deleted_at == None)
    if category:
        stmt = stmt.where(Supplies.category == category)
    stmt = stmt.order_by(Supplies.created_at.desc())
    supplies = db.execute(stmt).scalars().all()
    return SuppliesListResponse(
        items=[_supply_to_out(s) for s in supplies],
        total=len(supplies),
    )


# ─────────────────────────────────────────────────────────
# POST /supplies — Crear insumo
# ─────────────────────────────────────────────────────────

@router.post("/supplies", response_model=SupplyOut, status_code=201, summary="Crear insumo")
def create_supply(body: SupplyCreate, db: Session = Depends(get_db)) -> SupplyOut:
    supply = Supplies(
        name_supplies=body.name,
        description_supplies=body.description,
        category=body.category,
        color=body.color,
        stock_quantity=body.stock_quantity,
        sizes=body.sizes,
        unit=body.unit,
    )
    db.add(supply)
    db.commit()
    db.refresh(supply)
    return _supply_to_out(supply)


# ─────────────────────────────────────────────────────────
# PUT /supplies/{id} — Editar insumo
# ─────────────────────────────────────────────────────────

@router.put("/supplies/{supply_id}", response_model=SupplyOut, summary="Editar insumo")
def update_supply(supply_id: str, body: SupplyUpdate, db: Session = Depends(get_db)) -> SupplyOut:
    try:
        uid = uuid.UUID(supply_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")

    supply = db.execute(
        select(Supplies).where((Supplies.id == uid) & (Supplies.deleted_at == None))
    ).scalars().first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")

    if body.name is not None:
        supply.name_supplies = body.name
    if body.description is not None:
        supply.description_supplies = body.description
    if body.category is not None:
        supply.category = body.category
    if body.color is not None:
        supply.color = body.color
    if body.stock_quantity is not None:
        supply.stock_quantity = body.stock_quantity
    if body.sizes is not None:
        supply.sizes = body.sizes
    if body.unit is not None:
        supply.unit = body.unit

    db.commit()
    db.refresh(supply)
    return _supply_to_out(supply)


# ─────────────────────────────────────────────────────────
# DELETE /supplies/{id} — Soft delete insumo
# ─────────────────────────────────────────────────────────

@router.delete("/supplies/{supply_id}", status_code=204, summary="Eliminar insumo")
def delete_supply(supply_id: str, db: Session = Depends(get_db)) -> None:
    try:
        uid = uuid.UUID(supply_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")

    supply = db.execute(
        select(Supplies).where((Supplies.id == uid) & (Supplies.deleted_at == None))
    ).scalars().first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")

    supply.deleted_at = datetime.utcnow()
    db.commit()


# ─────────────────────────────────────────────────────────
# POST /products/{id}/supplies — Vincular insumo a producto
# ─────────────────────────────────────────────────────────

@router.post("/products/{product_id}/supplies", response_model=dict, status_code=201, summary="Vincular insumo a producto")
def link_supply_to_product(product_id: str, body: LinkSupplyToProduct, db: Session = Depends(get_db)) -> dict:
    try:
        pid = uuid.UUID(product_id)
        sid = uuid.UUID(body.supply_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="IDs inválidos")

    product = db.execute(select(Product).where((Product.id == pid) & (Product.deleted_at == None))).scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    supply = db.execute(select(Supplies).where((Supplies.id == sid) & (Supplies.deleted_at == None))).scalars().first()
    if not supply:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")

    existing = db.execute(
        select(ProductSupply).where((ProductSupply.product_id == pid) & (ProductSupply.supply_id == sid))
    ).scalars().first()
    if existing:
        existing.quantity_required = body.quantity_required
        db.commit()
        return {"detail": "Vínculo actualizado", "quantity_required": body.quantity_required}

    link = ProductSupply(product_id=pid, supply_id=sid, quantity_required=body.quantity_required)
    db.add(link)
    db.commit()
    return {"detail": "Insumo vinculado exitosamente", "quantity_required": body.quantity_required}


# ─────────────────────────────────────────────────────────
# DELETE /products/{id}/supplies/{supply_id} — Desvincular
# ─────────────────────────────────────────────────────────

@router.delete("/products/{product_id}/supplies/{supply_id}", status_code=204, summary="Desvincular insumo de producto")
def unlink_supply_from_product(product_id: str, supply_id: str, db: Session = Depends(get_db)) -> None:
    try:
        pid = uuid.UUID(product_id)
        sid = uuid.UUID(supply_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="IDs inválidos")

    link = db.execute(
        select(ProductSupply).where((ProductSupply.product_id == pid) & (ProductSupply.supply_id == sid))
    ).scalars().first()
    if not link:
        raise HTTPException(status_code=404, detail="Vínculo no encontrado")
    db.delete(link)
    db.commit()


# ─────────────────────────────────────────────────────────
# GET /products/{id}/supplies/check — Verificar disponibilidad
# ─────────────────────────────────────────────────────────

@router.get("/products/{product_id}/supplies/check", response_model=ProductSuppliesCheckResponse, summary="Verificar disponibilidad de insumos")
def check_product_supplies(product_id: str, db: Session = Depends(get_db)) -> ProductSuppliesCheckResponse:
    try:
        pid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID inválido")

    product = db.execute(select(Product).where((Product.id == pid) & (Product.deleted_at == None))).scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    links = db.execute(select(ProductSupply).where(ProductSupply.product_id == pid)).scalars().all()

    supply_items: list[ProductSupplyOut] = []
    all_available = True

    for link in links:
        supply = link.supply
        if not supply or supply.deleted_at:
            continue
        sufficient = supply.stock_quantity >= link.quantity_required
        if not sufficient:
            all_available = False
        supply_items.append(ProductSupplyOut(
            supply_id=str(supply.id),
            supply_name=supply.name_supplies,
            supply_color=supply.color,
            supply_unit=supply.unit or "unidades",
            supply_category=supply.category.value if hasattr(supply.category, "value") else supply.category,
            quantity_required=link.quantity_required,
            stock_quantity=supply.stock_quantity,
            stock_sufficient=sufficient,
        ))

    return ProductSuppliesCheckResponse(
        product_id=product_id,
        product_name=product.name_product,
        supplies=supply_items,
        all_supplies_available=all_available,
    )
