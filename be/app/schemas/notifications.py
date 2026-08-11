"""
Schemas Pydantic para el módulo de notificaciones.
"""

import uuid
from datetime import datetime
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    """Schema de respuesta para una notificación individual."""

    id: uuid.UUID
    title_notification: str
    message_notification: str
    type_notification: str  # "info" | "advertencia" | "error" | "exito"
    is_read: bool
    order_id: uuid.UUID | None = None
    link_url: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationListResponse(BaseModel):
    """Schema de respuesta para listado de notificaciones."""

    items: list[NotificationResponse]
    total: int
    unread_count: int


class NotificationsUnreadResponse(BaseModel):
    """Schema de respuesta para conteo de no leídas."""

    unread_count: int
