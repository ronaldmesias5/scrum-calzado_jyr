# ════════════════════════════════════════
# 📄 CRUD de precios personalizados por cliente
# ════════════════════════════════════════

import logging
import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies import _require_jefe, get_current_user, get_db
from app.models.client_price import ClientPrice
from app.models.product import Product
from app.models.user import User
from app.repositories.client_price_repository import ClientPriceRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.user_repository import UserRepository
from app.schemas.client_prices import (
    ClientPriceBulkRequest,
    ClientPriceCreateRequest,
    ClientPriceResponse,
    ClientPriceUpdateRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/v1/admin/client-prices",
    tags=["admin"],
)


def _to_response(cp: ClientPrice, client: User | None = None, product: Product | None = None) -> ClientPriceResponse:
    c = client or getattr(cp, "client", None)
    p = product or getattr(cp, "product", None)
    return ClientPriceResponse(
        id=cp.id,
        client_id=cp.client_id,
        client_name=f"{c.name_user} {c.last_name}" if c else None,
        client_email=c.email if c else None,
        product_id=cp.product_id,
        product_name=p.name_product if p else None,
        unit_price=float(cp.unit_price),
        created_at=cp.created_at,
    )


@router.get("", response_model=list[ClientPriceResponse])
def list_client_prices(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    client_id: uuid.UUID | None = Query(None, description="Filtrar por cliente"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> list[ClientPriceResponse]:
    """Lista precios personalizados. Opcionalmente filtra por cliente."""
    _require_jefe(current_user)

    rows = ClientPriceRepository(db).list_paginated(
        client_id=client_id, offset=(page - 1) * page_size, limit=page_size
    )

    return [_to_response(r) for r in rows]


@router.post("", response_model=ClientPriceResponse, status_code=201)
def create_or_update_client_price(
    request: ClientPriceCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientPriceResponse:
    """Crea o actualiza un precio personalizado (upsert por client_id + product_id)."""
    _require_jefe(current_user)

    client = UserRepository(db).get_by_id(request.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    if not client.role or client.role.name_role != "client":
        raise HTTPException(status_code=400, detail="El usuario no es cliente")

    product = ProductRepository(db).get_by_id_any(request.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    price_repo = ClientPriceRepository(db)
    existing = price_repo.get_by_client_product(request.client_id, request.product_id)

    if existing:
        existing.unit_price = request.unit_price
        db.commit()
        db.refresh(existing)
        cp = existing
    else:
        cp = ClientPrice(
            client_id=request.client_id,
            product_id=request.product_id,
            unit_price=request.unit_price,
        )
        price_repo.add(cp)
        db.commit()
        db.refresh(cp)

    return _to_response(cp, client, product)


@router.put("/{price_id}", response_model=ClientPriceResponse)
def update_client_price(
    price_id: uuid.UUID,
    request: ClientPriceUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientPriceResponse:
    """Actualiza el precio de un registro existente."""
    _require_jefe(current_user)

    cp = ClientPriceRepository(db).get_by_id(price_id)
    if not cp:
        raise HTTPException(status_code=404, detail="Registro de precio no encontrado")

    cp.unit_price = request.unit_price
    db.commit()
    db.refresh(cp)

    return _to_response(cp)


@router.delete("/{price_id}")
def delete_client_price(
    price_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    """Elimina (soft delete) un registro de precio personalizado."""
    _require_jefe(current_user)

    cp = ClientPriceRepository(db).get_live_by_id(price_id)
    if not cp:
        raise HTTPException(status_code=404, detail="Registro de precio no encontrado")

    cp.deleted_at = datetime.now(UTC)
    db.commit()

    return {"detail": "Precio eliminado correctamente"}


@router.post("/bulk", response_model=list[ClientPriceResponse], status_code=201)
def bulk_upsert_client_prices(
    request: ClientPriceBulkRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ClientPriceResponse]:
    """Asigna precios en lote para un cliente."""
    _require_jefe(current_user)

    client = UserRepository(db).get_by_id(request.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    if not client.role or client.role.name_role != "client":
        raise HTTPException(status_code=400, detail="El usuario no es cliente")

    price_repo = ClientPriceRepository(db)
    product_repo = ProductRepository(db)
    results = []
    for item in request.prices:
        product = product_repo.get_by_id_any(item.product_id)
        if not product:
            continue

        existing = price_repo.get_by_client_product(request.client_id, item.product_id)

        if existing:
            existing.unit_price = item.unit_price
            cp = existing
        else:
            cp = ClientPrice(
                client_id=request.client_id,
                product_id=item.product_id,
                unit_price=item.unit_price,
            )
            price_repo.add(cp)

        db.flush()
        db.refresh(cp)
        results.append(_to_response(cp, client, product))

    db.commit()
    return results
