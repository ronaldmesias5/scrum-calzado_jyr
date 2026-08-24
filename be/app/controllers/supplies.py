"""Controladores de insumos (supplies)."""

import uuid

from sqlalchemy.orm import Session


def deduct_supplies_for_production(
    product_id: uuid.UUID,
    breakdown: dict[str, float],
    current_user_id: uuid.UUID,
    db: Session,
) -> None:
    """Wrapper hacia el servicio de deducción de insumos (misma firma del service)."""
    from app.services.supplies import deduct_supplies_for_production as _service

    return _service(
        product_id=product_id,
        breakdown=breakdown,
        current_user_id=current_user_id,
        db=db,
    )