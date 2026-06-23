from pydantic import BaseModel
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

    class Config:
        from_attributes = True


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

    class Config:
        from_attributes = True


class ClientOrderListResponse(BaseModel):
    total: int
    page: int = 1
    page_size: int = 10
    total_pages: int = 1
    items: list[ClientOrderResponse]
