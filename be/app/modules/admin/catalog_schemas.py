"""
Schemas Pydantic para endpoints administrativos de catálogo
"""

from pydantic import BaseModel, Field, validator
from typing import Optional


class TaskPrices(BaseModel):
    """Precios por tarea en COP por docena (12 pares)"""
    corte: float = Field(0.0, ge=0)
    guarnicion: float = Field(0.0, ge=0)
    soladura: float = Field(0.0, ge=0)
    emplantillado: float = Field(0.0, ge=0)

    class Config:
        from_attributes = True


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
    task_prices: Optional[TaskPrices] = Field(None, description="Precios por tarea en COP por docena")


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
    task_prices: Optional[TaskPrices] = None
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
            try:
                qty_num = int(qty) if isinstance(qty, (int, float)) else int(str(qty))
                if qty_num < 0:
                    raise ValueError(f"Cantidad para talla {size} debe ser >= 0, recibió: {qty}")
            except (ValueError, TypeError) as e:
                raise ValueError(f"Cantidad para talla {size} debe ser un número válido, recibió: {qty}. Error: {str(e)}")
        return v

class InventoryMovementCreateRequest(BaseModel):
    """Request para registrar un movimiento de inventario (salida o entrada)"""
    product_id: str = Field(..., description="UUID del producto")
    size: str = Field(..., description="Talla")
    quantity: int = Field(..., gt=0, description="Cantidad a mover")
    movement_type: str = Field(..., description="'entrada' o 'salida'")
    reference_id: Optional[str] = Field(None, description="UUID de la orden o referencia")
    reference_type: Optional[str] = Field(None, description="Tipo de referencia (ej: orden_produccion)")
    notes: Optional[str] = Field(None, description="Notas opcionales")
