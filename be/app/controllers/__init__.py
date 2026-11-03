"""Controladores HTTP (thin controllers) — llamadas a `services/`."""

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
