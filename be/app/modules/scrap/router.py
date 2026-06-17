"""
Rutas REST para el módulo de registro de incidencias (Scrap).

Endpoints:
  GET    /api/v1/scrap/defect-codes                 — listar códigos de defecto
  POST   /api/v1/scrap/defect-codes                 — crear código de defecto
  GET    /api/v1/scrap/losses                       — listar incidencias
  POST   /api/v1/scrap/losses                       — registrar incidencia
  GET    /api/v1/scrap/losses/{loss_id}             — detalle de incidencia
  PATCH  /api/v1/scrap/losses/{loss_id}/repair      — marcar incidencia como reparada
  PATCH  /api/v1/scrap/losses/{loss_id}/approve     — aprobar (backwards compat)
  PATCH  /api/v1/scrap/losses/{loss_id}/reject      — rechazar (backwards compat)
  PATCH  /api/v1/scrap/losses/{loss_id}/solve       — solucionar incidencia (falla/faltante)
  GET    /api/v1/scrap/stock                        — listar stock de scrap
"""

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user, _require_admin_or_jefe
from app.models.user import User
from app.modules.scrap.schemas import (
    DefectCodeResponse,
    DefectCodeCreateRequest,
    IncidentResponse,
    IncidentCreateRequest,
    IncidentListResponse,
    RepairRequest,
    ScrapStockResponse,
)
from app.modules.scrap.service import (
    get_defect_codes,
    create_defect_code,
    get_incidents,
    get_incident_by_id,
    register_incident,
    repair_incident,
    solve_incident,
    approve_loss,
    reject_loss,
    get_scrap_stock,
)

# Import schemas from employee module for pending incidences
from app.modules.dashboard_empleado.schemas import (
    ProductIncidenceResponse,
    ProductIncidenceListResponse,
    ApproveProductIncidenceRequest,
)

router = APIRouter()


def _ensure_admin_or_jefe(current_user: User) -> None:
    """Valida que el usuario sea admin o jefe."""
    _require_admin_or_jefe(current_user)


# ────────────────────────────
# Defect Codes
# ────────────────────────────


@router.get("/defect-codes", response_model=list[DefectCodeResponse])
def list_defect_codes(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[DefectCodeResponse]:
    """Lista todos los códigos de defecto activos."""
    _ensure_admin_or_jefe(current_user)
    codes = get_defect_codes(db)
    return [DefectCodeResponse.model_validate(c) for c in codes]


@router.post("/defect-codes", response_model=DefectCodeResponse, status_code=status.HTTP_201_CREATED)
def create_defect_code_endpoint(
    data: DefectCodeCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> DefectCodeResponse:
    """Crea un nuevo código de defecto."""
    _ensure_admin_or_jefe(current_user)
    try:
        defect_code = create_defect_code(db, data.code, data.name, data.description)
        return DefectCodeResponse.model_validate(defect_code)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ────────────────────────────
# Incidents (Losses)
# ────────────────────────────


@router.get("/losses", response_model=IncidentListResponse)
def list_incidents(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    incident_type: str | None = Query(default=None),
    product_id: uuid.UUID | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    incidence_category: str | None = Query(default=None),
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
) -> IncidentListResponse:
    """Lista incidencias con filtros opcionales."""
    _ensure_admin_or_jefe(current_user)
    items, total = get_incidents(
        db,
        incident_type=incident_type,
        product_id=product_id,
        date_from=date_from,
        date_to=date_to,
        incidence_category=incidence_category,
        limit=limit,
        offset=offset,
    )
    return IncidentListResponse(
        items=[IncidentResponse.model_validate(item) for item in items],
        total=total,
    )


@router.post("/losses", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def register_incident_endpoint(
    data: IncidentCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> IncidentResponse:
    """Registra una incidencia (pérdida, en reparación, devolución). Cualquier usuario autenticado puede crear."""
    try:
        incident = register_incident(
            db=db,
            user_id=current_user.id,
            incidence_category=data.incidence_category,
            product_id=data.product_id,
            size=data.size,
            colour=data.colour,
            quantity=data.quantity,
            machinery_name=data.machinery_name,
            supply_id=data.supply_id,
            custom_supply_name=data.custom_supply_name,
            defect_code_id=data.defect_code_id,
            description=data.description,
            incident_type=data.incident_type,
            reason=data.reason,
            observations=data.observations,
            order_id=data.order_id,
            order_detail_id=data.order_detail_id,
            line_group=data.line_group,
        )
        return IncidentResponse.model_validate(incident)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/losses/{loss_id}", response_model=IncidentResponse)
def get_incident_detail(
    loss_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> IncidentResponse:
    """Obtiene el detalle de una incidencia."""
    _ensure_admin_or_jefe(current_user)
    incident = get_incident_by_id(db, loss_id)
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incidencia no encontrada",
        )
    return IncidentResponse.model_validate(incident)


@router.patch("/losses/{loss_id}/repair", response_model=IncidentResponse)
def repair_incident_endpoint(
    loss_id: uuid.UUID,
    data: RepairRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> IncidentResponse:
    """Marca una incidencia como reparada (en_reparacion o devuelto)."""
    _ensure_admin_or_jefe(current_user)
    try:
        incident = repair_incident(db, loss_id, current_user.id, data.repair_destination)
        return IncidentResponse.model_validate(incident)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/losses/{loss_id}/solve", response_model=IncidentResponse)
def solve_incident_endpoint(
    loss_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> IncidentResponse:
    """Soluciona una incidencia de tipo falla o faltante (maquinaria/insumo)."""
    _ensure_admin_or_jefe(current_user)
    try:
        incident = solve_incident(db, loss_id, current_user.id)
        return IncidentResponse.model_validate(incident)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ────────────────────────────
# Backwards compat endpoints
# ────────────────────────────


@router.patch("/losses/{loss_id}/approve", response_model=IncidentResponse)
def approve_loss_endpoint(
    loss_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> IncidentResponse:
    """[Compat] Aprueba un registro de pérdida."""
    _ensure_admin_or_jefe(current_user)
    try:
        loss_record = approve_loss(db, loss_id, current_user.id)
        return IncidentResponse.model_validate(loss_record)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/losses/{loss_id}/reject", response_model=IncidentResponse)
def reject_loss_endpoint(
    loss_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> IncidentResponse:
    """[Compat] Rechaza un registro de pérdida."""
    _ensure_admin_or_jefe(current_user)
    try:
        loss_record = reject_loss(db, loss_id, current_user.id)
        return IncidentResponse.model_validate(loss_record)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ────────────────────────────
# Scrap Stock
# ────────────────────────────


@router.get("/stock", response_model=list[ScrapStockResponse])
def list_scrap_stock(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ScrapStockResponse]:
    """Lista todo el stock de scrap."""
    _ensure_admin_or_jefe(current_user)
    stock = get_scrap_stock(db)
    return [ScrapStockResponse.model_validate(s) for s in stock]


# ────────────────────────────
# Pending Product Incidences (Jefe approval)
# ────────────────────────────


@router.get("/pending-incidences", response_model=ProductIncidenceListResponse)
def list_pending_product_incidences(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    status_filter: str | None = Query(default=None, description="pending, approved, rejected"),
) -> ProductIncidenceListResponse:
    """Lista incidencias de producto pendientes de aprobación (jefe/admin)."""
    from app.modules.dashboard_empleado.pending_service import get_all_pending_incidences

    _ensure_admin_or_jefe(current_user)
    pendings = get_all_pending_incidences(db, status_filter=status_filter)

    items = []
    for p in pendings:
        employee_name = ""
        if p.employee:
            employee_name = f"{p.employee.name_user} {p.employee.last_name}".strip()
        reviewed_by_name = None
        if p.reviewed_by:
            reviewed_by_name = f"{p.reviewed_by.name_user} {p.reviewed_by.last_name}".strip()

        items.append(ProductIncidenceResponse(
            id=str(p.id),
            task_id=str(p.task_id),
            task_type=p.task.type if p.task else None,
            product_id=str(p.product_id),
            product_name=p.product.name_product if p.product else None,
            size=p.size,
            colour=p.colour,
            defect_code_id=str(p.defect_code_id) if p.defect_code_id else None,
            defect_code=p.defect_code.code if p.defect_code else None,
            defect_name=p.defect_code.name if p.defect_code else None,
            description=p.description,
            quantity=int(p.quantity),
            observations=p.observations,
            status=p.status,
            approved_type=p.approved_type,
            employee_name=employee_name,
            reviewed_by_name=reviewed_by_name,
            reviewed_at=p.reviewed_at.isoformat() if p.reviewed_at else None,
            created_at=p.created_at.isoformat() if p.created_at else None,
        ))

    return ProductIncidenceListResponse(incidences=items, total=len(items))


@router.post("/pending-incidences/{pending_id}/approve", response_model=ProductIncidenceResponse)
def approve_product_incidence(
    pending_id: uuid.UUID,
    data: ApproveProductIncidenceRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ProductIncidenceResponse:
    """Aprueba una incidencia de producto y crea el LossRecord con el tipo elegido."""
    from app.modules.dashboard_empleado.pending_service import approve_pending_incidence

    _ensure_admin_or_jefe(current_user)
    try:
        pending = approve_pending_incidence(db, pending_id, current_user.id, data.incident_type)

        reviewed_by_name = f"{current_user.name_user} {current_user.last_name}".strip()
        employee_name = ""
        if pending.employee:
            employee_name = f"{pending.employee.name_user} {pending.employee.last_name}".strip()
        return ProductIncidenceResponse(
            id=str(pending.id),
            task_id=str(pending.task_id),
            task_type=pending.task.type if pending.task else None,
            product_id=str(pending.product_id),
            product_name=pending.product.name_product if pending.product else None,
            size=pending.size,
            colour=pending.colour,
            defect_code_id=str(pending.defect_code_id) if pending.defect_code_id else None,
            defect_code=pending.defect_code.code if pending.defect_code else None,
            defect_name=pending.defect_code.name if pending.defect_code else None,
            description=pending.description,
            quantity=int(pending.quantity),
            observations=pending.observations,
            status=pending.status,
            approved_type=pending.approved_type,
            employee_name=employee_name,
            reviewed_by_name=reviewed_by_name,
            reviewed_at=pending.reviewed_at.isoformat() if pending.reviewed_at else None,
            created_at=pending.created_at.isoformat() if pending.created_at else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/pending-incidences/{pending_id}/reject", response_model=ProductIncidenceResponse)
def reject_product_incidence(
    pending_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ProductIncidenceResponse:
    """Rechaza una incidencia de producto."""
    from app.modules.dashboard_empleado.pending_service import reject_pending_incidence

    _ensure_admin_or_jefe(current_user)
    try:
        pending = reject_pending_incidence(db, pending_id, current_user.id)

        reviewed_by_name = f"{current_user.name_user} {current_user.last_name}".strip()
        employee_name = ""
        if pending.employee:
            employee_name = f"{pending.employee.name_user} {pending.employee.last_name}".strip()
        return ProductIncidenceResponse(
            id=str(pending.id),
            task_id=str(pending.task_id),
            task_type=pending.task.type if pending.task else None,
            product_id=str(pending.product_id),
            product_name=pending.product.name_product if pending.product else None,
            size=pending.size,
            colour=pending.colour,
            defect_code_id=str(pending.defect_code_id) if pending.defect_code_id else None,
            defect_code=pending.defect_code.code if pending.defect_code else None,
            defect_name=pending.defect_code.name if pending.defect_code else None,
            description=pending.description,
            quantity=int(pending.quantity),
            observations=pending.observations,
            status=pending.status,
            approved_type=pending.approved_type,
            employee_name=employee_name,
            reviewed_by_name=reviewed_by_name,
            reviewed_at=pending.reviewed_at.isoformat() if pending.reviewed_at else None,
            created_at=pending.created_at.isoformat() if pending.created_at else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
