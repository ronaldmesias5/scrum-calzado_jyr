"""
Archivo: be/app/modules/supplies/schemas.py
Descripción: Schemas Pydantic para validación de entrada/salida del módulo de insumos.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────
# Tipos de categoría de insumo
# ─────────────────────────────────────────────────────────

SupplyCategory = Literal["corte", "guarnicion", "soladura", "terminado", "otros"]


# ─────────────────────────────────────────────────────────
# Schemas de Insumo
# ─────────────────────────────────────────────────────────

class SupplyBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    category: str = Field(..., max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    stock_quantity: float = Field(default=0, ge=0)
    sizes: Optional[dict[str, float]] = None
    unit: Optional[str] = Field(default="unidades", max_length=50)


class SupplyCreate(SupplyBase):
    pass


class SupplyUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    stock_quantity: Optional[float] = Field(None, ge=0)
    sizes: Optional[dict[str, float]] = None
    unit: Optional[str] = Field(None, max_length=50)


class LinkedProductOut(BaseModel):
    product_id: str
    product_name: str
    quantity_required: float


class SupplyOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    category: str
    color: Optional[str]
    stock_quantity: float
    sizes: Optional[dict[str, float]]
    unit: Optional[str]
    created_at: datetime
    linked_products: list[LinkedProductOut] = []

    model_config = {"from_attributes": True}


class SuppliesListResponse(BaseModel):
    items: list[SupplyOut]
    total: int


# ─────────────────────────────────────────────────────────
# Schemas de vinculación producto ↔ insumo
# ─────────────────────────────────────────────────────────

class LinkSupplyToProduct(BaseModel):
    supply_id: str
    quantity_required: float = Field(default=0, ge=0, description="Unidades del insumo requeridas por par al ser transformadas (o 0 si opcional)")


class ProductSupplyOut(BaseModel):
    supply_id: str
    supply_name: str
    supply_color: str | None = None
    supply_unit: str | None = None
    supply_category: str
    quantity_required: float
    stock_quantity: float
    stock_sufficient: bool  # True si stock_quantity >= quantity_required * (pedidos activos del producto)


class ProductSuppliesCheckResponse(BaseModel):
    product_id: str
    product_name: str
    supplies: list[ProductSupplyOut]
    all_supplies_available: bool
