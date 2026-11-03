# ════════════════════════════════════════
# 📄 Validadores compartidos y tipos Annotated reutilizables en schemas
# ════════════════════════════════════════

import re
from typing import Annotated

from pydantic import AfterValidator


def _bounded_text(label: str, min_len: int, max_len: int, upper: bool = False):
    """Valida un texto: strip, longitud mín/máx y (opcional) conversion a mayúsculas."""

    def _check(v: str) -> str:
        v = v.strip()
        if len(v) < min_len:
            raise ValueError(f"El {label} debe tener al menos {min_len} caracteres")
        if len(v) > max_len:
            raise ValueError(f"El {label} no puede exceder {max_len} caracteres")
        if upper:
            v = v.upper()
        return v

    return AfterValidator(_check)


def _check_password(v: str) -> str:
    """Valida requisitos mínimos de seguridad para contraseñas."""
    if len(v) < 8:
        raise ValueError("La contraseña debe tener al menos 8 caracteres")
    if not re.search(r"[A-Z]", v):
        raise ValueError("La contraseña debe contener al menos una letra mayúscula")
    if not re.search(r"[a-z]", v):
        raise ValueError("La contraseña debe contener al menos una letra minúscula")
    if not re.search(r"\d", v):
        raise ValueError("La contraseña debe contener al menos un número")
    return v


def _check_phone(v: str) -> str:
    """Valida longitud de teléfono (7-20 caracteres tras strip)."""
    v = v.strip()
    if len(v) < 7 or len(v) > 20:
        raise ValueError("El teléfono debe tener entre 7 y 20 caracteres")
    return v


def _check_identity_document(v: str) -> str:
    """Documento de identidad del registro: 8-10 dígitos."""
    v = v.strip()
    if len(v) < 8 or len(v) > 10:
        raise ValueError("El documento de identidad debe tener entre 8 y 10 dígitos")
    if not v.isdigit():
        raise ValueError("El documento de identidad debe contener solo dígitos")
    return v


def _check_identity_document_loose(v: str) -> str:
    """Documento de identidad de reactivación: 8-20 caracteres."""
    v = v.strip()
    if len(v) < 8 or len(v) > 20:
        raise ValueError("El documento de identidad debe tener entre 8 y 20 caracteres")
    return v


def _must_accept_terms(v: bool) -> bool:
    """Exige que los términos y condiciones estén aceptados."""
    if not v:
        raise ValueError("Debes aceptar los términos y condiciones")
    return v


# ── Tipos Annotated reutilizables ──
# Nota: `X | None = None` corta la validación para None (None no pasa por AfterValidator).
PasswordStr = Annotated[str, AfterValidator(_check_password)]
PhoneStr = Annotated[str, AfterValidator(_check_phone)]
IdentityDocStr = Annotated[str, AfterValidator(_check_identity_document)]
IdentityDocLooseStr = Annotated[str, AfterValidator(_check_identity_document_loose)]
AcceptedTerms = Annotated[bool, AfterValidator(_must_accept_terms)]

NameStr = Annotated[str, _bounded_text("nombre", 2, 255, upper=True)]
LastNameStr = Annotated[str, _bounded_text("apellido", 2, 255, upper=True)]
BusinessNameStr = Annotated[str, _bounded_text("nombre comercial", 2, 255)]
ReasonStr = Annotated[str, _bounded_text("motivo", 5, 500)]
CommentStr = Annotated[str, _bounded_text("comentario", 5, 500)]
ReasonLongStr = Annotated[str, _bounded_text("motivo", 10, 1000)]
