"""
Archivo: be/app/routers/dashboard_jefe.py
Descripción: Router FastAPI con endpoints del panel de administración del jefe.

¿Qué?
  Define 3 endpoints (Sprint 3):
  - GET /metrics: Retorna KPIs (pedidos pendientes, producción, stock, alertas)
  - GET /recent-orders: Lista últimos 5 pedidos
  - GET /alerts: Lista alertas activas
  
¿Para qué?
  - Proveer datos para dashboard AdminDashboardPage (frontend)
  - La lógica de negocio vive en service.py (Sprint 4+)

¿Impacto?
  MEDIO — Dashboard AdminDashboardPage depende de estos endpoints.
  Modificar schemas rompe: frontend dashboard-jefe/services/api.ts
  Dependencias: dashboard_jefe/schemas.py, dashboard_jefe/service.py,
               frontend modules/dashboard-jefe/services/api.ts
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import _require_jefe, get_current_user, get_db
from app.models.user import User
from app.schemas.dashboard_jefe import (
    AlertsResponse,
    DashboardMetricsResponse,
    RecentOrdersResponse,
)
from app.controllers.dashboard_jefe import (
    get_alerts_data,
    get_metrics_data,
    get_recent_orders_data,
)

router = APIRouter(
    prefix="/api/v1/dashboard/admin",
    tags=["dashboard-jefe"],
)


@router.get(
    "/metrics",
    response_model=DashboardMetricsResponse,
    summary="Métricas del dashboard del jefe",
)
def get_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardMetricsResponse:
    """Retorna los KPIs principales desde la BD (0 si sin datos)."""
    _require_jefe(current_user)
    return get_metrics_data(db)


@router.get(
    "/recent-orders",
    response_model=RecentOrdersResponse,
    summary="Pedidos recientes para el dashboard",
)
def get_recent_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RecentOrdersResponse:
    """Retorna los últimos 5 pedidos registrados desde la BD (vacío si no hay datos)."""
    _require_jefe(current_user)
    try:
        return get_recent_orders_data(db)
    except Exception as e:
        print(f"Error en get_recent_orders: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error al obtener órdenes recientes. Intente nuevamente.",
        )


@router.get(
    "/alerts",
    response_model=AlertsResponse,
    summary="Alertas activas del sistema",
)
def get_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AlertsResponse:
    """Retorna las alertas basadas en incidencias abiertas."""
    _require_jefe(current_user)
    return get_alerts_data(db)
