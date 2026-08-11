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
    priority: str = "media"
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
    priority: str = "media"
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

class EmployeeTaskStatusUpdate(BaseModel):
    """Actualizar estado y observación de una tarea desde el dashboard del empleado."""
    status: str
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


# ────────────────────────────────────────────────
#  Schemas para reportes del empleado
# ────────────────────────────────────────────────


class MyPerformanceTaskBreakdown(BaseModel):
    process_name: str
    count: int


class MyPerformanceResponse(BaseModel):
    total_tasks_completed: int
    total_pairs_produced: int
    total_earnings: float = 0.0
    tasks_breakdown: list[MyPerformanceTaskBreakdown] = []
    name: str = ""


class SharedReportItem(BaseModel):
    id: str
    report_type: str
    report_title: str
    shared_by_name: str = ""
    message: str | None = None
    is_read: bool = False
    created_at: datetime | None = None


class SharedReportListResponse(BaseModel):
    reports: list[SharedReportItem]
    total: int = 0


class SharedReportDetailResponse(BaseModel):
    id: str
    report_type: str
    report_title: str
    shared_by_name: str
    message: str | None = None
    is_read: bool
    created_at: datetime | None = None
    parameters: dict = {}


# ────────────────────────────────────────────────
#  Schemas para reporte detallado de tareas
# ────────────────────────────────────────────────


class MyTaskDetail(BaseModel):
    """Tarea individual con valor calculado, para reporte detallado (empleado)."""
    id: str
    order_id: str | None = None
    product_name: str
    process_name: str
    amount: int
    status: str
    colour: str | None = None
    vale_number: int | None = None
    created_at: str
    completed_at: str | None = None
    price_per_dozen: float = 0.0
    task_total_price: float = 0.0


class MyTasksReportResponse(BaseModel):
    """Reporte detallado de tareas del empleado autenticado."""
    total_tasks_completed: int
    total_pairs_produced: int
    total_earnings: float = 0.0
    tasks_breakdown: list[MyPerformanceTaskBreakdown] = []
    tasks_list: list[MyTaskDetail] = []
    name: str = ""


# ────────────────────────────────────────────────
#  Schemas para incidencias generales (LossRecord)
# ────────────────────────────────────────────────


class GeneralIncidenceCreateRequest(BaseModel):
    """Crear incidencia general (maquinaria o insumo) desde el dashboard del empleado."""
    incidence_category: str  # "maquinaria" or "insumo"
    machinery_name: str | None = None
    supply_id: str | None = None
    custom_supply_name: str | None = None
    observations: str | None = None


class GeneralIncidenceResponse(BaseModel):
    """Respuesta de incidencia general para el empleado."""
    id: str
    incidence_category: str
    machinery_name: str | None = None
    supply_id: str | None = None
    supply_name: str | None = None
    custom_supply_name: str | None = None
    observations: str | None = None
    incident_type: str
    registered_by_name: str | None = None
    created_at: datetime | None = None


class GeneralIncidenceListResponse(BaseModel):
    incidences: list[GeneralIncidenceResponse]
    total: int = 0


# ────────────────────────────────────────────────
#  Schemas para incidencias de producto pendientes
# ────────────────────────────────────────────────


class ProductIncidenceCreateRequest(BaseModel):
    """Crear incidencia de producto vinculada a una tarea del empleado."""
    task_id: str
    size: str
    colour: str | None = None
    defect_code_id: str | None = None  # Ahora opcional — reemplazado por descripción libre
    description: str | None = None  # Descripción libre del defecto
    quantity: int
    observations: str | None = None


class ProductIncidenceResponse(BaseModel):
    """Respuesta de incidencia de producto para el empleado."""
    id: str
    task_id: str
    task_type: str | None = None
    product_id: str
    product_name: str | None = None
    size: str
    colour: str | None = None
    defect_code_id: str | None = None
    defect_code: str | None = None
    defect_name: str | None = None
    description: str | None = None  # Descripción libre del defecto
    quantity: int
    observations: str | None = None
    status: str
    approved_type: str | None = None
    employee_name: str | None = None
    reviewed_by_name: str | None = None
    reviewed_at: str | None = None
    created_at: str | None = None


class ProductIncidenceListResponse(BaseModel):
    incidences: list[ProductIncidenceResponse]
    total: int = 0


class ApproveProductIncidenceRequest(BaseModel):
    """Aprobar incidencia de producto — el jefe elige el tipo."""
    incident_type: str  # perdida, en_reparacion, devuelto
