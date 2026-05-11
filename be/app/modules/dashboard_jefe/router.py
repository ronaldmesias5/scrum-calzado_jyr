"""
Archivo: be/app/modules/dashboard_jefe/router.py
Descripción: Router FastAPI con endpoints del panel de administración del jefe.

¿Qué?
  Define 3 endpoints con datos MOCK (Sprint 3):
  - GET /metrics: Retorna KPIs (pedidos pendientes, producción, stock, alertas)
  - GET /recent-orders: Lista últimos 5 pedidos
  - GET /alerts: Lista alertas activas
  
¿Para qué?
  - Proveer datos para dashboard AdminDashboardPage (frontend)
  - Simular endpoints reales mientras se desarrollan modelos BD (Sprint 4+)
  - Permitir desarrollo frontend independiente del backend
  
¿Impacto?
  MEDIO — Dashboard AdminDashboardPage depende de estos endpoints.
  En Sprint 4+: Reemplazar mock data con queries a BD reales (Order, Stock, Alert models).
  Modificar schemas rompe: frontend dashboard-jefe/services/api.ts
  Dependencias: dashboard_jefe/schemas.py,
               frontend modules/dashboard-jefe/services/api.ts
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.modules.dashboard_jefe.schemas import (
    AlertSchema,
    AlertsResponse,
    DashboardMetricsResponse,
    MetricSchema,
    RecentOrderSchema,
    RecentOrdersResponse,
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
def get_metrics(db: Session = Depends(get_db)) -> DashboardMetricsResponse:
    """Retorna los KPIs principales desde la BD (0 si sin datos)."""
    from app.models.order import Order, OrderStatus
    from app.models.inventory import Inventory
    from sqlalchemy import func
    
    # 1. Pedidos por estado
    pending = db.query(Order).filter(Order.state == OrderStatus.pendiente).count()
    production = db.query(Order).filter(Order.state == OrderStatus.en_progreso).count()
    
    # 2. Stock total (sumatoria de todas las tallas/colores)
    total_stock = db.query(func.sum(Inventory.amount)).scalar() or 0
    
    # 3. Alertas (Incidencias abiertas reportadas por empleados)
    from app.models.incidence import Incidence, IncidenceStatus
    open_incidences_count = db.query(Incidence).filter(
        Incidence.state == IncidenceStatus.abierta,
        Incidence.deleted_at == None
    ).count()
    
    return DashboardMetricsResponse(
        metrics=[
            MetricSchema(label="Pedidos Pendientes", value=pending, change="Refrescado", change_positive=True),
            MetricSchema(label="En Producción", value=production, change="Refrescado", change_positive=True),
            MetricSchema(label="Pares en Stock", value=int(total_stock), change="Total", change_positive=True),
            MetricSchema(label="Incidencias Abiertas", value=open_incidences_count, change="Por resolver", change_positive=False),
        ]
    )


@router.get(
    "/recent-orders",
    response_model=RecentOrdersResponse,
    summary="Pedidos recientes para el dashboard",
)
def get_recent_orders(db: Session = Depends(get_db)) -> RecentOrdersResponse:
    """Retorna los últimos 5 pedidos registrados desde la BD (vacío si no hay datos)."""
    from app.models.order import Order
    from sqlalchemy import desc
    
    try:
        orders = db.query(Order).order_by(desc(Order.created_at)).limit(5).all()
        return RecentOrdersResponse(
            orders=[
                RecentOrderSchema(
                    order_id=str(order.id),
                    client_name=order.customer.name_user if order.customer else "N/A",
                    quantity=order.total_pairs,
                    status=order.state.value if order.state else "pendiente",
                    date=order.created_at.strftime("%d/%m/%Y") if order.created_at else "N/A"
                )
                for order in orders
            ]
        )
    except Exception as e:
        # Si hay error, retornar lista vacía
        print(f"Error en get_recent_orders: {e}")
        return RecentOrdersResponse(orders=[])


@router.get(
    "/alerts",
    response_model=AlertsResponse,
    summary="Alertas activas del sistema",
)
def get_alerts(db: Session = Depends(get_db)) -> AlertsResponse:
    """Retorna las alertas basadas en incidencias abiertas."""
    from app.models.incidence import Incidence, IncidenceStatus
    from app.models.tasks import Task
    from app.models.user import User
    
    open_incidences = db.query(Incidence).filter(
        Incidence.state == IncidenceStatus.abierta,
        Incidence.deleted_at == None
    ).order_by(Incidence.created_at.desc()).all()
    
    alerts = []
    for inc in open_incidences:
        # Obtener información del empleado que reportó (a través de la tarea)
        task = db.query(Task).filter(Task.id == inc.task_id).first()
        reporter_name = "Desconocido"
        if task and task.assigned_to:
            user = db.query(User).filter(User.id == task.assigned_to).first()
            if user:
                reporter_name = f"{user.name_user} {user.last_name}"
        
        alerts.append(AlertSchema(
            id=str(inc.id),
            type="error", # Usar error para incidencias reportadas
            title=f"Incidencia: {inc.type_incidence}",
            message=f"Reportado por {reporter_name}: {inc.description_incidence or 'Sin descripción'}",
            time=inc.created_at.strftime("%H:%M") if inc.created_at else "Ahora"
        ))
        
    return AlertsResponse(alerts=alerts)

