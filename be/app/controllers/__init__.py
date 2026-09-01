"""Controladores HTTP (thin controllers) — llamadas a `services/`.

Este paquete contiene funciones que implementan la lógica de los endpoints
sin manejar directamente decoradores de FastAPI. Los archivos en
`be/app/routers/` siguen definiendo las rutas y deben llamar a estas
funciones para mantener una separación transporte<->lógica.

NOTA: Por ahora son adaptadores mínimos; iré migrando handlers concretos
desde `routers/` a `controllers/` según lo solicites.
"""

from . import auth
from . import orders
from . import notifications
from . import supplies
from . import scrap
from . import dashboard_empleado
from . import dashboard_jefe

__all__ = [
    "auth",
    "orders",
    "notifications",
    "supplies",
    "scrap",
    "dashboard_empleado",
    "dashboard_jefe",
]
