# ════════════════════════════════════════
# 📄 Router FastAPI con endpoints del panel de administración del jefe
# ════════════════════════════════════════

import logging

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

logger = logging.getLogger(__name__)


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
        logger.exception("Error en get_recent_orders")
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

