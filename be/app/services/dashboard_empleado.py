"""
Archivo: be/app/modules/dashboard_empleado/service.py
Descripción: Lógica compartida del panel del empleado.
"""

# ────────────────────────────────────────────────
# Mapa: ocupación del empleado → tipo de tarea
# ────────────────────────────────────────────────
OCCUPATION_TO_TASK_TYPE = {
    'cortador': 'corte',
    'guarnecedor': 'guarnicion',
    'solador': 'soladura',
    'emplantillador': 'emplantillado',
}


def get_task_type_for_occupation(occupation: str | None) -> str | None:
    """Retorna el tipo de tarea que corresponde a la ocupación del empleado."""
    if not occupation:
        return None
    return OCCUPATION_TO_TASK_TYPE.get(occupation)
