from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
import uuid


class ClientOrderDetailItem(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: Optional[str] = None
    style_name: Optional[str] = None
    category_name: Optional[str] = None
    brand_name: Optional[str] = None
    image_url: Optional[str] = None
    size: str
    colour: Optional[str] = None
    amount: int
    state: str
    observations: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ClientOrderResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    total_pairs: int
    state: str
    creation_date: datetime
    delivery_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    details: list[ClientOrderDetailItem] = []

    model_config = ConfigDict(from_attributes=True)


class ClientOrderListResponse(BaseModel):
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1
    items: list[ClientOrderResponse]


class ClientOrderSummaryResponse(BaseModel):
    """Resumen de pedidos del cliente por estado (sin datos financieros)."""

    total: int
    by_state: dict[str, int]


class ClientIncidenceCreateRequest(BaseModel):
    """Reclamo de un producto de un pedido entregado (incidencia de cliente)."""

    order_id: uuid.UUID
    order_detail_id: uuid.UUID
    size: str
    colour: Optional[str] = None
    defect_code_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    quantity: int = 1
    observations: Optional[str] = None


class ClientIncidenceResponse(BaseModel):
    """Respuesta de reclamo para el dashboard del cliente."""

    id: str
    order_id: str | None = None
    order_number: str | None = None
    product_id: str
    product_name: str | None = None
    size: str
    colour: str | None = None
    defect_code: str | None = None
    defect_name: str | None = None
    description: str | None = None
    quantity: int
    observations: str | None = None
    status: str
    approved_type: str | None = None
    reviewed_by_name: str | None = None
    reviewed_at: str | None = None
    created_at: str | None = None


class ClientIncidenceListResponse(BaseModel):
    incidences: list[ClientIncidenceResponse]
    total: int = 0


class ClientSharedIncidenceResponse(BaseModel):
    """Incidencia compartida por el jefe (report_shares con report_type='incidence')."""

    id: str
    title: str
    message: Optional[str] = None
    product_name: Optional[str] = None
    size: Optional[str] = None
    colour: Optional[str] = None
    quantity: Optional[int] = None
    incident_type: Optional[str] = None
    defect: Optional[str] = None
    order_id: Optional[str] = None
    shared_by_name: Optional[str] = None
    is_read: bool = False
    created_at: Optional[str] = None


class ClientSharedIncidenceListResponse(BaseModel):
    items: list[ClientSharedIncidenceResponse]
    total: int = 0
