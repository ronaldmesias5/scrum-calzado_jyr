"""
Archivo: be/app/modules/dashboard_empleado/schemas.py
Descripción: Schemas Pydantic para el dashboard del empleado.
"""

from datetime import datetime
from pydantic import BaseModel


class EmployeeMetricSchema(BaseModel):
    label: str
    value: int
    icon: str = "tasks"


class EmployeeMetricsResponse(BaseModel):
    metrics: list[EmployeeMetricSchema]


class EmployeeTaskSchema(BaseModel):
    """Tarea asignada al empleado."""
    id: str
    order_id: str | None = None
    product_id: str | None = None
    product_name: str | None = None
    product_image: str | None = None
    product_category: str | None = None
    line_group: int = 0
    assigned_to: str | None = None
    assigned_user_name: str | None = None
    assigned_user_occupation: str | None = None
    type: str
    status: str
    vale_number: int | None = None
    amount: int = 0
    description: str | None = None
    observation: str | None = None
    created_at: datetime | None = None
    deadline: datetime | None = None
    task_prices: dict = {}


class EmployeeTaskListResponse(BaseModel):
    tasks: list[EmployeeTaskSchema]
    total: int = 0


class EmployeeIncidenceSchema(BaseModel):
    id: str
    task_id: str
    type_incidence: str
    description: str | None = None
    state: str
    report_date: datetime | None = None
    created_at: datetime | None = None


class EmployeeIncidenceListResponse(BaseModel):
    incidences: list[EmployeeIncidenceSchema]
    total: int = 0


class AvailableTaskSchema(BaseModel):
    """Tarea pendiente disponible para reclamar."""
    id: str
    order_id: str | None = None
    product_id: str | None = None
    product_name: str | None = None
    product_image: str | None = None
    product_category: str | None = None
    line_group: int = 0
    type: str
    status: str
    vale_number: int | None = None
    amount: int = 0
    description: str | None = None
    created_at: datetime | None = None
    deadline: datetime | None = None
    task_prices: dict = {}


class AvailableTaskListResponse(BaseModel):
    tasks: list[AvailableTaskSchema]
    total: int = 0


# ────────────────────────────────────────────────
#  Schemas para el vale de producción (empleado)
# ────────────────────────────────────────────────


class TaskObservationUpdate(BaseModel):
    """Actualizar observación de una tarea."""
    observation: str | None = None


class ValeTaskInfo(BaseModel):
    """Info de una tarea dentro del vale, vista por empleado."""
    id: str
    type: str
    status: str
    amount: int
    assigned_user_name: str | None = None
    assigned_user_occupation: str | None = None
    observation: str | None = None
    is_mine: bool = False
    # Solo visible para tarea propia:
    price_per_dozen: float = 0
    total_cost: float = 0


class ValeDetailItem(BaseModel):
    """Línea de pedido en el vale (vista empleado)."""
    size: str
    amount: int


class ValeResponse(BaseModel):
    """Respuesta completa del vale de producción para empleado."""
    order_id: str
    customer_name: str | None = None
    customer_last_name: str | None = None
    product_id: str
    product_name: str | None = None
    product_image: str | None = None
    product_category: str | None = None
    vale_number: int | None = None
    line_group: int
    total_pairs: int = 0
    details: list[ValeDetailItem] = []
    tasks: list[ValeTaskInfo] = []
