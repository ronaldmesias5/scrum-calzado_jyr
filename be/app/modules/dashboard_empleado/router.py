"""
Archivo: be/app/modules/dashboard_empleado/router.py
Descripción: Agregador de routers del panel del empleado.
Cada sub-router filtra datos según el usuario autenticado (current_user).
"""

from fastapi import APIRouter

from app.modules.dashboard_empleado.incidences import router as incidences_router
from app.modules.dashboard_empleado.metrics import router as metrics_router
from app.modules.dashboard_empleado.tasks import router as tasks_router

router = APIRouter()
router.include_router(metrics_router)
router.include_router(tasks_router)
router.include_router(incidences_router)