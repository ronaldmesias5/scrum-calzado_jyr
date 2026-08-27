"""
Archivo: be/app/routers/dashboard_empleado.py
Descripción: Agregador de routers del panel del empleado.
Cada sub-router filtra datos según el usuario autenticado (current_user).
"""

from fastapi import APIRouter

from app.routers.dashboard_empleado_incidences import router as incidences_router
from app.routers.dashboard_empleado_metrics import router as metrics_router
from app.routers.dashboard_empleado_tasks import router as tasks_router

router = APIRouter()
router.include_router(metrics_router)
router.include_router(tasks_router)
router.include_router(incidences_router)
