"""
Módulo: service.py (Supplies)
Descripción: Lógica de negocio para deducción de insumos al iniciar producción.
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product_supplies import ProductSupply
from app.models.supplies import Supplies
from app.models.supplies_movement import SuppliesMovement, SuppliesMovementType


def deduct_supplies_for_production(
    product_id: uuid.UUID,
    breakdown: dict[str, float],
    current_user_id: uuid.UUID,
    db: Session,
) -> None:
    """
    Deduce insumos vinculados a un producto según el breakdown de tallas a producir.

    - Recorre todos los ProductSupply del producto.
    - Calcula cantidad requerida = sum(quantity_required * breakdown[talla]) por talla.
    - Si el insumo tiene sizes y unit="tallas": deduce de cada talla del dict sizes.
    - Si no: deduce de stock_quantity plano.
    - Crea SuppliesMovement (tipo salida) por cada insumo.
    - Lanza HTTPException 400 si algún insumo no tiene stock suficiente.
    """
    links = db.execute(
        select(ProductSupply).where(ProductSupply.product_id == product_id)
    ).scalars().all()

    if not links:
        return

    now = datetime.now(timezone.utc)

    for link in links:
        supply = link.supply
        if not supply or supply.deleted_at:
            continue

        # Calcular total requerido para este insumo
        required_total = Decimal("0")
        for size, pairs in breakdown.items():
            required_total += Decimal(str(link.quantity_required)) * Decimal(str(pairs))

        if required_total <= 0:
            continue

        # Deducir según tipo de unidad
        if supply.sizes and supply.unit == "tallas":
            sizes = dict(supply.sizes)
            for size, pairs in breakdown.items():
                needed = Decimal(str(link.quantity_required)) * Decimal(str(pairs))
                if needed <= 0:
                    continue
                available = Decimal(str(sizes.get(size, 0)))
                if needed > available:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"Stock insuficiente de {supply.name_supplies}"
                            f" (talla {size}): requiere {needed}, disponible {available}"
                        ),
                    )
                sizes[size] = float(available - needed)
            supply.sizes = sizes
            supply.stock_quantity = sum(float(v) for v in sizes.values())
        else:
            current = Decimal(str(supply.stock_quantity or 0))
            if current < required_total:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"Stock insuficiente de {supply.name_supplies}:"
                        f" requiere {required_total}, disponible {current}"
                    ),
                )
            supply.stock_quantity = current - required_total

        # Registrar movimiento de salida
        movement = SuppliesMovement(
            id=uuid.uuid4(),
            supplies_id=supply.id,
            user_id=current_user_id,
            type_of_movement=SuppliesMovementType.salida,
            amount=required_total,
            colour=supply.color,
            sizes=breakdown,
            movement_date=now,
        )
        db.add(movement)
        db.add(supply)
