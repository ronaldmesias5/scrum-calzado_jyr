"""
Archivo: be/app/modules/dashboard_jefe/schemas.py
Descripción: Schemas Pydantic para dashboard administrativo del jefe.

¿Qué?
  Define 5 schemas para dashboard mock:
  - MetricSchema: KPI individual (label, value, change, change_positive)
  - RecentOrderSchema: Pedido reciente (order_id, client_name, status, etc.)
  - AlertSchema: Alerta del sistema (type, title, description, timestamp)
  - DashboardMetricsResponse: Wrapper para lista de métricas
  - RecentOrdersResponse: Wrapper para lista de pedidos
  
¿Para qué?
  - Type safety para endpoints dashboard_jefe/router.py
  - Documentar estructura de datos en OpenAPI docs
  - Facilitar migración a datos reales (cambiar values internos, no estructura)
  
¿Impacto?
  MEDIO — Frontend dashboard_jefe/types/*.ts replica estas interfaces.
  Modificar schemas rompe: frontend components/dashboard/DashboardMetricCard,
  AdminDashboardPage, services/api.ts
  Dependencias: dashboard_jefe/router.py
"""

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
    status: Literal["pending", "in_production", "ready", "delivered"]
    date: str


class AlertSchema(BaseModel):
    id: str
    type: Literal["warning", "error", "info"]
    title: str
    description: str
    timestamp: str


class DashboardMetricsResponse(BaseModel):
    metrics: list[MetricSchema]


class RecentOrdersResponse(BaseModel):
    orders: list[RecentOrderSchema]


class AlertsResponse(BaseModel):
    alerts: list[AlertSchema]
