"""
Módulo: client_prices.py
Descripción: CRUD de precios personalizados por cliente.
¿Para qué? El jefe asigna precios por producto a cada cliente.
¿Endpoint? /api/v1/admin/client-prices
"""

import logging
import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, joinedload

from app.dependencies import _require_jefe, get_current_user, get_db
from app.models.client_price import ClientPrice
from app.models.product import Product
from app.models.user import User
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

    query = (
        select(ClientPrice)
        .options(joinedload(ClientPrice.client), joinedload(ClientPrice.product))
        .where(ClientPrice.deleted_at.is_(None))
    )
    if client_id:
        query = query.where(ClientPrice.client_id == client_id)

    query = query.order_by(desc(ClientPrice.created_at)).offset((page - 1) * page_size).limit(page_size)
    rows = db.execute(query).unique().scalars().all()

    return [_to_response(r) for r in rows]


@router.post("", response_model=ClientPriceResponse, status_code=201)
def create_or_update_client_price(
    request: ClientPriceCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientPriceResponse:
    """Crea o actualiza un precio personalizado (upsert por client_id + product_id)."""
    _require_jefe(current_user)

    client = db.execute(
        select(User).where(User.id == request.client_id).execution_options(populate_existing=True)
    ).scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    if not client.role or client.role.name_role != "client":
        raise HTTPException(status_code=400, detail="El usuario no es cliente")

    product = db.execute(select(Product).where(Product.id == request.product_id)).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    existing = db.execute(
        select(ClientPrice).where(
            ClientPrice.client_id == request.client_id,
            ClientPrice.product_id == request.product_id,
            ClientPrice.deleted_at.is_(None),
        )
    ).scalar_one_or_none()

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
        db.add(cp)
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

    cp = db.execute(
        select(ClientPrice)
        .options(joinedload(ClientPrice.client), joinedload(ClientPrice.product))
        .where(ClientPrice.id == price_id, ClientPrice.deleted_at.is_(None))
    ).unique().scalar_one_or_none()
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

    cp = db.execute(
        select(ClientPrice).where(ClientPrice.id == price_id, ClientPrice.deleted_at.is_(None))
    ).scalar_one_or_none()
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

    client = db.execute(
        select(User).where(User.id == request.client_id).execution_options(populate_existing=True)
    ).scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    if not client.role or client.role.name_role != "client":
        raise HTTPException(status_code=400, detail="El usuario no es cliente")

    results = []
    for item in request.prices:
        product = db.execute(select(Product).where(Product.id == item.product_id)).scalar_one_or_none()
        if not product:
            continue

        existing = db.execute(
            select(ClientPrice).where(
                ClientPrice.client_id == request.client_id,
                ClientPrice.product_id == item.product_id,
                ClientPrice.deleted_at.is_(None),
            )
        ).scalar_one_or_none()

        if existing:
            existing.unit_price = item.unit_price
            cp = existing
        else:
            cp = ClientPrice(
                client_id=request.client_id,
                product_id=item.product_id,
                unit_price=item.unit_price,
            )
            db.add(cp)

        db.flush()
        db.refresh(cp)
        results.append(_to_response(cp, client, product))

    db.commit()
    return results
