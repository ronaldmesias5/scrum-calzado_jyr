"""
Schemas Pydantic para endpoints administrativos de catálogo
"""

from pydantic import BaseModel, Field, validator
from typing import Optional


# ─────────────────────────────────────────
# MARCAS
# ─────────────────────────────────────────

class BrandCreateRequest(BaseModel):
    """Request para crear/actualizar una marca"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)


class BrandResponse(BaseModel):
    """Response de una marca"""
    id: str
    name: str
    description: Optional[str]
    created_at: Optional[str]


# ─────────────────────────────────────────
# ESTILOS
# ─────────────────────────────────────────

class StyleCreateRequest(BaseModel):
    """Request para crear/actualizar un estilo"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    brand_id: str = Field(..., description="UUID de la marca")


class StyleResponse(BaseModel):
    """Response de un estilo"""
    id: str
    name: str
    description: Optional[str]
    brand_id: str
    brand_name: str
    created_at: Optional[str]


# ─────────────────────────────────────────
# PRODUCTOS
# ─────────────────────────────────────────

class ProductCreateRequest(BaseModel):
    """Request para crear/actualizar un producto"""
    name: Optional[str] = Field(None, max_length=255, description="Si no se proporciona, se genera automáticamente: '{estilo} - {categoría}'")
    description: Optional[str] = Field(None, max_length=500)
    color: Optional[str] = Field(None, max_length=100, description="Color del producto")
    insufficient_threshold: Optional[int] = Field(12, ge=1, description="Umbral en pares para marcar como insuficiente")
    brand_id: str = Field(..., description="UUID de la marca")
    style_id: str = Field(..., description="UUID del estilo (debe pertenecer a la marca)")
    category_id: str = Field(..., description="UUID de la categoría")


class ProductResponse(BaseModel):
    """Response de un producto"""
    id: str
    name: str
    description: Optional[str]
    color: Optional[str]
    insufficient_threshold: int
    state: bool
    brand_id: str
    brand_name: str
    style_id: str
    style_name: str
    category_id: str
    category_name: str
    created_at: Optional[str]


# ─────────────────────────────────────────
# INVENTARIO
# ─────────────────────────────────────────

class InventoryCreateRequest(BaseModel):
    """Request para crear/actualizar inventario"""
    product_id: str = Field(..., description="UUID del producto")
    size: str = Field(..., min_length=1, max_length=50, description="Talla (ej: XS, S, M, L, XL, 36, 37, 38, etc.)")
    quantity: int = Field(..., ge=0, description="Cantidad disponible")


class InventoryResponse(BaseModel):
    """Response de inventario"""
    id: str
    product_id: str
    product_name: str
    size: str
    quantity: int
    created_at: Optional[str]


class BulkInventoryUpdateRequest(BaseModel):
    """Request para actualizar inventario de múltiples tallas a la vez"""
    product_id: str = Field(..., description="UUID del producto")
    quantities: dict = Field(..., description="Diccionario {talla: cantidad} ej: {'21': 5, '22': 3, '23': 0}")
    
    @validator('quantities')
    def validate_quantities(cls, v):
        if not v:
            raise ValueError("quantities no puede estar vacío")
        for size, qty in v.items():
            if not isinstance(qty, int) or qty < 0:
                raise ValueError(f"Cantidad para talla {size} debe ser un número >= 0")
        return v
