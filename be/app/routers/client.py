import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
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
    ClientIncidenceResponse,
    ClientIncidenceListResponse,
    ClientSharedIncidenceResponse,
    ClientSharedIncidenceListResponse,
)
from app.schemas.orders import OrderCreateRequest
from app.schemas.reports import OrderSummary, OrderItemSummary, CustomerReportResponse

router = APIRouter(
    prefix="/api/v1/client",
    tags=["client"],
)

UPLOADS_DIR = (Path(settings.UPLOAD_DIR) / "evidence") if settings.UPLOAD_DIR else (Path(__file__).resolve().parent.parent.parent / "uploads" / "evidence")
ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"}


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


def _build_order_items(details: list, category: str | None = None) -> list:
    """Agrupa OrderDetails por (product_id, colour), filtrando por categoría si se especifica."""
    items_map = {}
    for detail in details:
        cat_name = None
        if detail.product and detail.product.category:
            cat_name = getattr(detail.product.category, 'name_category', None)
        if category and (cat_name or "").lower() != category.lower():
            continue
        key = (detail.product_id, detail.colour or "")
        if key not in items_map:
            p_name = "Producto Desconocido"
            p_img = None
            if detail.product:
                p_name = getattr(detail.product, 'name_product', "Producto Desconocido")
                p_img = getattr(detail.product, 'image_url', None)
            items_map[key] = OrderItemSummary(
                product_id=detail.product_id,
                product_name=p_name,
                image_url=p_img,
                amount=0,
                category_name=cat_name,
                colour=detail.colour or None,
            )
        items_map[key].amount += (detail.amount or 0)
    return list(items_map.values())


@router.get("/orders/all", response_model=CustomerReportResponse)
def get_all_my_orders(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    category: Optional[str] = Query(None),
) -> CustomerReportResponse:
    """Retorna todos los pedidos del cliente con detalles para generar reporte PDF."""
    query = select(Order).where(Order.customer_id == current_user.id)

    if start_date:
        query = query.where(Order.created_at >= start_date)
    if end_date:
        query = query.where(Order.created_at <= end_date)

    query = query.order_by(desc(Order.created_at))
    orders = db.execute(query).scalars().all()

    orders_list = []
    for o in orders:
        items = _build_order_items(o.details or [], category)
        if category and not items:
            continue
        orders_list.append(OrderSummary(
            id=o.id,
            total_pairs=sum(it.amount for it in items) if category else (o.total_pairs or 0),
            total_price=0.0,
            state=str(o.state.value) if hasattr(o.state, 'value') else str(o.state),
            created_at=o.created_at,
            items=items,
        ))

    total_orders = len(orders_list)
    total_pairs = sum(o.total_pairs for o in orders_list)
    total_spent = sum(getattr(o, 'total_price', 0.0) or 0.0 for o in orders_list)

    customer_name = f"{current_user.name_user} {current_user.last_name}".strip()

    return CustomerReportResponse(
        user_id=current_user.id,
        name=customer_name or current_user.email,
        total_orders=total_orders,
        total_pairs=int(total_pairs),
        total_spent=float(total_spent),
        orders=orders_list,
    )


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
        rejection_reason=p.rejection_reason,
        evidence_image_url=p.evidence_image_url,
        reviewed_by_name=reviewed_by_name,
        reviewed_at=p.reviewed_at.isoformat() if p.reviewed_at else None,
        created_at=p.created_at.isoformat() if p.created_at else None,
    )


@router.post(
    "/incidences", response_model=ClientIncidenceResponse, status_code=status.HTTP_201_CREATED
)
async def create_my_incidence(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    order_id: str = Form(...),
    order_detail_id: str = Form(...),
    size: str = Form(...),
    colour: str | None = Form(None),
    defect_code_id: str | None = Form(None),
    description: str | None = Form(None),
    quantity: int = Form(1),
    observations: str | None = Form(None),
    evidence: UploadFile | None = File(None),
) -> ClientIncidenceResponse:
    """
    Reporta un reclamo sobre un producto de un pedido entregado.
    Queda en estado pendiente hasta que el jefe lo apruebe o rechace.
    """
    from app.controllers.dashboard_empleado import create_customer_pending_incidence

    # Handle evidence image upload
    evidence_image_url = None
    if evidence and evidence.filename:
        if evidence.content_type not in ALLOWED_MIME:
            raise HTTPException(status_code=400, detail="Formato de imagen no soportado")
        content = await evidence.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="La imagen no debe superar 5 MB")
        ext = evidence.filename.rsplit(".", 1)[-1].lower() if "." in evidence.filename else "jpg"
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        filename = f"evidence_{uuid.uuid4().hex}_{int(time.time())}.{ext}"
        (UPLOADS_DIR / filename).write_bytes(content)
        evidence_image_url = f"uploads/evidence/{filename}"

    try:
        pending = create_customer_pending_incidence(
            db=db,
            customer_id=current_user.id,
            order_id=uuid.UUID(order_id),
            order_detail_id=uuid.UUID(order_detail_id),
            size=size,
            colour=colour,
            defect_code_id=uuid.UUID(defect_code_id) if defect_code_id else None,
            description=description,
            quantity=quantity,
            observations=observations,
            evidence_image_url=evidence_image_url,
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
