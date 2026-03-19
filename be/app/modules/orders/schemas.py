"""
Módulo: schemas.py (Orders)
Descripción: Esquemas Pydantic para validación y serialización de órdenes.
¿Para qué? Definir estructura de datos para solicitudes/respuestas de órdenes.
¿Impacto? Valida datos de entrada y serializa respuestas API.
"""

from datetime import datetime
from uuid import UUID
from typing import List

from pydantic import BaseModel, Field

from app.models.order import OrderStatus


# ────────────────────────────────────────────────
# Esquemas para OrderDetail (línea de pedido)
# ────────────────────────────────────────────────

class OrderDetailItemResponse(BaseModel):
    """Esquema para mostrar una línea de pedido."""
    id: UUID
    product_id: UUID
    product_name: str | None = None
    style_name: str | None = None
    category_name: str | None = None
    brand_name: str | None = None
    image_url: str | None = None
    size: str
    colour: str | None = None
    amount: int
    state: OrderStatus | None = None
    order_date: datetime | None = None

    class Config:
        from_attributes = True


class OrderDetailItemCreateRequest(BaseModel):
    """Esquema para crear una línea de pedido al crear una orden."""
    product_id: UUID = Field(..., description="ID del producto/estilo")
    size: str = Field(..., min_length=1, max_length=10, description="Talla")
    colour: str | None = Field(None, max_length=100, description="Color")
    amount: int = Field(..., gt=0, description="Cantidad de pares")

    class Config:
        from_attributes = True


# ────────────────────────────────────────────────
# Esquemas para Order
# ────────────────────────────────────────────────

class OrderResponse(BaseModel):
    """Esquema para mostrar una orden en listados."""
    id: UUID
    customer_id: UUID
    customer_name: str | None = None
    customer_last_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    total_pairs: int
    state: OrderStatus
    creation_date: datetime | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class OrderDetailResponse(BaseModel):
    """Esquema detallado de una orden con todos sus items."""
    id: UUID
    customer_id: UUID
    customer_name: str | None = None
    customer_last_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    total_pairs: int
    state: OrderStatus
    creation_date: datetime | None = None
    delivery_date: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    deleted_at: datetime | None = None
    details: List[OrderDetailItemResponse] = []

    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    """Esquema para respuesta de listado paginado de órdenes."""
    total: int = Field(..., description="Total de órdenes en la base de datos")
    page: int = Field(..., description="Página actual (1-indexed)")
    page_size: int = Field(..., description="Cantidad de órdenes por página")
    total_pages: int = Field(..., description="Total de páginas")
    items: List[OrderResponse] = Field(..., description="Órdenes en esta página")


class OrderCreateRequest(BaseModel):
    """Esquema para crear una nueva orden."""
    customer_id: UUID = Field(..., description="ID del cliente que realiza el pedido")
    total_pairs: int = Field(..., gt=0, description="Total de pares en el pedido")
    delivery_date: datetime | None = Field(None, description="Fecha estimada de entrega")
    details: List[OrderDetailItemCreateRequest] = Field(default_factory=list, description="Líneas del pedido")

    class Config:
        from_attributes = True


class OrderUpdateStatusRequest(BaseModel):
    """Esquema para actualizar el estado de una orden."""
    state: OrderStatus = Field(..., description="Nuevo estado de la orden")

    class Config:
        from_attributes = True


class OrderUpdateDetailsRequest(BaseModel):
    """Esquema para actualizar los detalles de un pedido existente."""
    delivery_date: datetime | None = None
    details: List[OrderDetailItemCreateRequest] = Field(..., description="Nueva lista completa de líneas del pedido")

    class Config:
        from_attributes = True
