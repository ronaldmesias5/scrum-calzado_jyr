"""
Utilidad para calcular la prioridad de una tarea basada en su fecha límite.
"""

from datetime import datetime


def calculate_task_priority(deadline: datetime | None) -> str:
    """Calcula la prioridad de una tarea según los días restantes hasta el deadline.

    - Si no hay deadline → 'baja'
    - Si quedan ≤ 10 días → 'alta'
    - Si quedan > 10 días → 'baja'
    """
    if deadline is None:
        return "baja"

    now = datetime.now(deadline.tzinfo) if deadline.tzinfo else datetime.now()
    days_remaining = (deadline - now).days

    if days_remaining <= 10:
        return "alta"
    return "baja"
