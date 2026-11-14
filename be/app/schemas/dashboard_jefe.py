# ════════════════════════════════════════
# 📄 Schemas Pydantic para dashboard administrativo del jefe
# ════════════════════════════════════════

from typing import Literal

from pydantic import BaseModel


class MetricSchema(BaseModel):
    label: str
    value: int
    change: str
    change_positive: bool


class RecentOrderSchema(BaseModel):
    order_id: str
    client_name: str
    quantity: int
    status: str # Permitir cualquier estado de la BD (pendiente, en_progreso, etc.)
    date: str


class AlertSchema(BaseModel):
    id: str
    type: Literal["warning", "error", "info"]
    title: str
    message: str
    time: str


class DashboardMetricsResponse(BaseModel):
    metrics: list[MetricSchema]


class RecentOrdersResponse(BaseModel):
    orders: list[RecentOrderSchema]


class AlertsResponse(BaseModel):
    alerts: list[AlertSchema]
