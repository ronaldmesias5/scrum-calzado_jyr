"""Schemas Pydantic para el módulo de registro de incidencias (Scrap)."""
import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel


class DefectCodeResponse(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: str | None = None
    is_active: bool
    model_config = {"from_attributes": True}


class DefectCodeCreateRequest(BaseModel):
    code: str
    name: str
    description: str | None = None


# Nested schemas
class ProductInfo(BaseModel):
    id: uuid.UUID
    name_product: str
    image_url: str | None = None
    model_config = {"from_attributes": True}


class UserInfo(BaseModel):
    id: uuid.UUID
    name_user: str
    last_name: str
    model_config = {"from_attributes": True}


class OrderInfo(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID | None = None
    model_config = {"from_attributes": True}


class SupplyInfo(BaseModel):
    id: uuid.UUID
    name_supplies: str
    model_config = {"from_attributes": True}


class IncidentResponse(BaseModel):
    id: uuid.UUID
    incidence_category: str = "producto"
    product_id: uuid.UUID | None = None
    product: ProductInfo | None = None
    size: str | None = None
    colour: str | None = None
    quantity: Decimal
    machinery_name: str | None = None
    supply_id: uuid.UUID | None = None
    supply: SupplyInfo | None = None
    custom_supply_name: str | None = None
    incident_type: str
    defect_code: DefectCodeResponse | None = None
    description: str | None = None  # Descripción libre del defecto
    reason: str | None = None
    observations: str | None = None
    registered_by_id: uuid.UUID
    registered_by: UserInfo | None = None
    approved_by_id: uuid.UUID | None = None
    approved_at: datetime | None = None
    order_id: uuid.UUID | None = None
    order: OrderInfo | None = None
    order_detail_id: uuid.UUID | None = None
    line_group: int | None = None
    repaired_at: datetime | None = None
    repaired_by_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class IncidentCreateRequest(BaseModel):
    incidence_category: str = "producto"
    product_id: uuid.UUID | None = None
    size: str | None = None
    colour: str | None = None
    quantity: Decimal = Decimal("1")
    machinery_name: str | None = None
    supply_id: uuid.UUID | None = None
    custom_supply_name: str | None = None
    incident_type: str = "perdida"  # perdida, en_reparacion, devuelto
    defect_code_id: uuid.UUID | None = None
    description: str | None = None  # Descripción libre del defecto (reemplaza defect_code_id)
    reason: str | None = None
    observations: str | None = None
    order_id: uuid.UUID | None = None
    order_detail_id: uuid.UUID | None = None
    line_group: int | None = None


class RepairRequest(BaseModel):
    """Schema para marcar una incidencia como reparada."""
    repair_destination: str = "stock"  # "stock", "reserva", "customer_return"


class IncidentListResponse(BaseModel):
    items: list[IncidentResponse]
    total: int


class ScrapStockResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    size: str
    colour: str | None = None
    quantity: Decimal
    defect_code: DefectCodeResponse
    loss_record_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}
