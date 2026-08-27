"""
Archivo: be/app/modules/dashboard_jefe/service.py
Descripción: Lógica de negocio del panel del jefe (métricas, pedidos recientes, alertas).
"""

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.incidence import Incidence, IncidenceStatus
from app.models.inventory import Inventory
from app.models.order import Order, OrderStatus
from app.models.tasks import Task
from app.models.user import User
from app.schemas.dashboard_jefe import (
    AlertSchema,
    AlertsResponse,
    DashboardMetricsResponse,
    MetricSchema,
    RecentOrderSchema,
    RecentOrdersResponse,
)


def get_metrics_data(db: Session) -> DashboardMetricsResponse:
    """Retorna los KPIs principales desde la BD (0 si sin datos)."""
    # 1. Pedidos por estado
    pending = db.query(Order).filter(Order.state == OrderStatus.pendiente).count()
    production = db.query(Order).filter(Order.state == OrderStatus.en_progreso).count()

    # 2. Stock total (sumatoria de todas las tallas/colores)
    total_stock = db.query(func.sum(Inventory.amount)).scalar() or 0

    # 3. Alertas (Incidencias abiertas reportadas por empleados)
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


def get_recent_orders_data(db: Session) -> RecentOrdersResponse:
    """Retorna los últimos 5 pedidos registrados desde la BD (vacío si no hay datos)."""
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


def get_alerts_data(db: Session) -> AlertsResponse:
    """Retorna las alertas basadas en incidencias abiertas."""
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
            type="error",  # Usar error para incidencias reportadas
            title=f"Incidencia: {inc.type_incidence}",
            message=f"Reportado por {reporter_name}: {inc.description_incidence or 'Sin descripción'}",
            time=inc.created_at.strftime("%H:%M") if inc.created_at else "Ahora"
        ))

    return AlertsResponse(alerts=alerts)
