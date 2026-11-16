# ════════════════════════════════════════
# 📄 Normalización de datos de entrada reutilizable
# ════════════════════════════════════════


def normalize_email(email: str) -> str:
    """Normaliza un correo a minúsculas y sin espacios.

    Se usa tanto en los esquemas Pydantic como en la capa de servicios para que
    el registro, el login y las búsquedas por email sean insensibles al casing.
    """
    return email.strip().lower()
