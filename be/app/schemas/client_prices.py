"""
Schemas Pydantic para precios personalizados por cliente (client_prices).
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ClientPriceCreateItem(BaseModel):
    """Ítem individual para asignación en lote."""
    product_id: UUID = Field(..., description="ID del producto")
    unit_price: float = Field(..., gt=0, description="Precio unitario COP")

    model_config = ConfigDict(from_attributes=True)


class ClientPriceCreateRequest(BaseModel):
    """Esquema para crear o actualizar un precio personalizado."""
    client_id: UUID = Field(..., description="ID del cliente")
    product_id: UUID = Field(..., description="ID del producto")
    unit_price: float = Field(..., gt=0, description="Precio unitario COP")

    model_config = ConfigDict(from_attributes=True)


class ClientPriceUpdateRequest(BaseModel):
    """Esquema para actualizar solo el precio."""
    unit_price: float = Field(..., gt=0, description="Nuevo precio unitario COP")

    model_config = ConfigDict(from_attributes=True)


class ClientPriceResponse(BaseModel):
    """Esquema de respuesta para un precio personalizado."""
    id: UUID
    client_id: UUID
    client_name: str | None = None
    client_email: str | None = None
    product_id: UUID
    product_name: str | None = None
    unit_price: float
    created_at: datetime | None = None


class ClientPriceBulkRequest(BaseModel):
    """Esquema para asignar precios en lote a un cliente."""
    client_id: UUID = Field(..., description="ID del cliente")
    prices: list[ClientPriceCreateItem] = Field(..., description="Lista de precios")
