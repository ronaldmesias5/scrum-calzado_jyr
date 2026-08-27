import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, desc, func
from sqlalchemy.orm import Session, selectinload

from app.config import settings
from app.dependencies import get_db, get_current_user
from app.models.order import Order, OrderDetail, OrderStatus
from app.models.user import User
from app.models.product import Product
from app.models.pending_incidence import PendingProductIncidence
from app.schemas.client import (
    ClientOrderResponse,
    ClientOrderListResponse,
    ClientOrderDetailItem,
    ClientOrderSummaryResponse,
    ClientIncidenceCreateRequest,
    ClientIncidenceResponse,
    ClientIncidenceListResponse,
    ClientSharedIncidenceResponse,
    ClientSharedIncidenceListResponse,
)
from app.schemas.orders import OrderCreateRequest

router = APIRouter(
    prefix="/api/v1/client",
    tags=["client"],
)


def _order_to_client_response(order: Order) -> ClientOrderResponse:
    return ClientOrderResponse(
        id=order.id,
        customer_id=order.customer_id,
        total_pairs=order.total_pairs,
        state=order.state,
        creation_date=order.creation_date,
        delivery_date=order.delivery_date,
        created_at=order.created_at,
        updated_at=order.updated_at,
        details=[
            ClientOrderDetailItem(
                id=d.id,
                product_id=d.product_id,
                product_name=d.product.name_product if d.product else None,
                style_name=d.product.style.name_style if (d.product and d.product.style) else None,
                category_name=d.product.category.name_category
                if (d.product and d.product.category)
                else None,
                brand_name=d.product.brand.name_brand if (d.product and d.product.brand) else None,
                image_url=d.product.image_url if d.product else None,
                size=d.size,
                colour=d.colour,
                amount=d.amount,
                state=d.state,
                observations=d.observations,
            )
            for d in order.details
        ],
    )


@router.get("/orders", response_model=ClientOrderListResponse)
def list_my_orders(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1, description="Página (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Elementos por página"),
) -> ClientOrderListResponse:
    """Lista los pedidos del cliente autenticado con paginación."""
    total_query = select(func.count(Order.id)).where(Order.customer_id == current_user.id)
    total = db.execute(total_query).scalar() or 0

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    offset = (page - 1) * page_size

    query = (
        select(Order)
        .options(
            selectinload(Order.details)
            .selectinload(OrderDetail.product)
            .selectinload(Product.inventory)
        )
        .where(Order.customer_id == current_user.id)
        .order_by(desc(Order.created_at))
        .offset(offset)
        .limit(page_size)
    )
    result = db.execute(query)
    orders = result.scalars().all()

    return ClientOrderListResponse(
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        items=[_order_to_client_response(o) for o in orders],
    )


@router.get("/orders/summary", response_model=ClientOrderSummaryResponse)
def get_my_orders_summary(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientOrderSummaryResponse:
    """Resumen de pedidos del cliente agrupados por estado."""
    total = (
        db.execute(
            select(func.count(Order.id)).where(Order.customer_id == current_user.id)
        ).scalar()
        or 0
    )

    rows = db.execute(
        select(Order.state, func.count(Order.id))
        .where(Order.customer_id == current_user.id)
        .group_by(Order.state)
    ).all()
    by_state: dict[str, int] = {state: count for state, count in rows}

    for estado in OrderStatus:
        by_state.setdefault(estado.value, 0)

    return ClientOrderSummaryResponse(total=total, by_state=by_state)


@router.post("/orders", response_model=ClientOrderResponse, status_code=status.HTTP_201_CREATED)
def create_my_order(
    order_data: OrderCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientOrderResponse:
    """
    Crea un pedido para el cliente autenticado.

    El `customer_id` siempre es el del cliente actual (no se permite elegir otro).
    `total_pairs` se recalcula en el servidor como suma de los detalles.
    """
    from app.controllers.orders import create_order as _create_order
    from app.routers.orders import _trigger_notifications

    try:
        new_order = _create_order(
            db=db,
            customer_id=current_user.id,
            total_pairs=order_data.total_pairs,
            delivery_date=order_data.delivery_date,
            details=order_data.details,
            created_by=current_user.id,
        )

        _trigger_notifications(
            db=db,
            new_order=new_order,
            customer_check=current_user,
            settings=settings,
        )

        return _order_to_client_response(new_order)

    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear el pedido: {e!s}")


@router.get("/orders/{order_id}", response_model=ClientOrderResponse)
def get_my_order(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientOrderResponse:
    """Obtiene detalle de un pedido específico del cliente autenticado."""
    query = (
        select(Order)
        .options(
            selectinload(Order.details)
            .selectinload(OrderDetail.product)
            .selectinload(Product.inventory)
        )
        .where(Order.id == order_id, Order.customer_id == current_user.id)
    )
    result = db.execute(query)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    return _order_to_client_response(order)


def _incidence_to_client_response(p: PendingProductIncidence) -> ClientIncidenceResponse:
    """Serializa un reclamo de cliente para el dashboard del cliente."""
    reviewed_by_name = None
    if p.reviewed_by:
        reviewed_by_name = f"{p.reviewed_by.name_user} {p.reviewed_by.last_name}".strip()

    return ClientIncidenceResponse(
        id=str(p.id),
        order_id=str(p.order_id) if p.order_id else None,
        order_number=str(p.order_id)[:8] if p.order_id else None,
        product_id=str(p.product_id),
        product_name=p.product.name_product if p.product else None,
        size=p.size,
        colour=p.colour,
        defect_code=p.defect_code.code if p.defect_code else None,
        defect_name=p.defect_code.name if p.defect_code else None,
        description=p.description,
        quantity=int(p.quantity),
        observations=p.observations,
        status=p.status,
        approved_type=p.approved_type,
        reviewed_by_name=reviewed_by_name,
        reviewed_at=p.reviewed_at.isoformat() if p.reviewed_at else None,
        created_at=p.created_at.isoformat() if p.created_at else None,
    )


@router.post(
    "/incidences", response_model=ClientIncidenceResponse, status_code=status.HTTP_201_CREATED
)
def create_my_incidence(
    data: ClientIncidenceCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientIncidenceResponse:
    """
    Reporta un reclamo sobre un producto de un pedido entregado.
    Queda en estado pendiente hasta que el jefe lo apruebe o rechace.
    """
    from app.controllers.dashboard_empleado import create_customer_pending_incidence

    try:
        pending = create_customer_pending_incidence(
            db=db,
            customer_id=current_user.id,
            order_id=data.order_id,
            order_detail_id=data.order_detail_id,
            size=data.size,
            colour=data.colour,
            defect_code_id=data.defect_code_id,
            description=data.description,
            quantity=data.quantity,
            observations=data.observations,
        )
        return _incidence_to_client_response(pending)
    except ValueError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al reportar la incidencia: {e!s}")


@router.get("/incidences", response_model=ClientIncidenceListResponse)
def list_my_incidences(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientIncidenceListResponse:
    """Lista los reclamos reportados por el cliente autenticado."""
    from app.controllers.dashboard_empleado import get_customer_pending_incidences

    items = get_customer_pending_incidences(db, current_user.id)
    return ClientIncidenceListResponse(
        incidences=[_incidence_to_client_response(p) for p in items],
        total=len(items),
    )


@router.get("/incidences/shared", response_model=ClientSharedIncidenceListResponse)
def list_shared_incidences(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClientSharedIncidenceListResponse:
    """Incidencias que el jefe compartió con este cliente (report_shares type='incidence')."""
    from app.models.report_share import ReportShare

    rows = (
        db.execute(
            select(ReportShare)
            .where(
                ReportShare.target_user_id == current_user.id,
                ReportShare.report_type == "incidence",
                ReportShare.deleted_at.is_(None),
            )
            .order_by(desc(ReportShare.created_at))
        )
        .scalars()
        .all()
    )

    params: dict
    items: list[ClientSharedIncidenceResponse] = []
    for r in rows:
        params = r.parameters or {}
        shared_by_name = None
        if r.shared_by is not None:
            shared_by_name = f"{r.shared_by.name_user} {r.shared_by.last_name}".strip()
        items.append(
            ClientSharedIncidenceResponse(
                id=str(r.id),
                title=r.report_title,
                message=r.message,
                product_name=params.get("product_name"),
                size=params.get("size"),
                colour=params.get("colour"),
                quantity=params.get("quantity"),
                incident_type=params.get("incident_type"),
                defect=params.get("defect"),
                order_id=params.get("order_id"),
                shared_by_name=shared_by_name,
                is_read=r.is_read,
                created_at=r.created_at.isoformat() if r.created_at else None,
            )
        )

    return ClientSharedIncidenceListResponse(items=items, total=len(items))
