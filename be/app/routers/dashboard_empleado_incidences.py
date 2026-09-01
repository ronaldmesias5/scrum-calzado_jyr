"""
Archivo: be/app/routers/dashboard_empleado_incidences.py
Descripción: Endpoints de incidencias del panel del empleado.
"""

import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.incidence import Incidence, IncidenceStatus
from app.models.scrap import LossRecord
from app.models.tasks import Task
from app.models.user import User
from app.schemas.dashboard_empleado import (
    EmployeeIncidenceListResponse,
    EmployeeIncidenceSchema,
    GeneralIncidenceCreateRequest,
    GeneralIncidenceListResponse,
    GeneralIncidenceResponse,
    ProductIncidenceCreateRequest,
    ProductIncidenceListResponse,
    ProductIncidenceResponse,
)

router = APIRouter(
    prefix="/api/v1/dashboard/employee",
    tags=["dashboard-empleado"],
)

logger = logging.getLogger(__name__)


@router.get(
    "/incidences",
    response_model=EmployeeIncidenceListResponse,
    summary="Incidencias de las tareas del empleado",
)
def get_my_incidences(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    state: str | None = Query(None, description="Filtrar por estado"),
) -> EmployeeIncidenceListResponse:
    """Retorna las incidencias relacionadas con las tareas del empleado."""
    try:
        query = (
            select(Incidence)
            .join(Task, Incidence.task_id == Task.id)
            .where(
                Task.assigned_to == current_user.id,
                Incidence.deleted_at == None,
            )
        )

        if state:
            query = query.where(Incidence.state == state)
        else:
            # Por defecto: abiertas y en progreso
            query = query.where(
                Incidence.state.in_([IncidenceStatus.abierta, IncidenceStatus.en_progreso])
            )

        query = query.order_by(desc(Incidence.created_at))
        result = db.execute(query)
        incidences = result.scalars().all()

        return EmployeeIncidenceListResponse(
            incidences=[
                EmployeeIncidenceSchema(
                    id=str(inc.id),
                    task_id=str(inc.task_id),
                    type_incidence=inc.type_incidence,
                    description=inc.description_incidence,
                    state=inc.state,
                    report_date=inc.report_date,
                    created_at=inc.created_at,
                )
                for inc in incidences
            ],
            total=len(incidences),
        )
    except Exception as e:
        logger.exception("Error en get_my_incidences")
        raise HTTPException(
            status_code=500,
            detail="Error al obtener incidencias. Intente nuevamente.",
        )


# ─────────────────────────────────────────────
#  Incidencias generales (maquinaria/insumo)
# ─────────────────────────────────────────────


@router.post(
    "/general-incidences",
    response_model=GeneralIncidenceResponse,
    summary="Crear incidencia general (maquinaria/insumo)",
)
def create_general_incidence(
    data: GeneralIncidenceCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GeneralIncidenceResponse:
    """Crea una incidencia general (maquinaria o insumo) desde el dashboard del empleado."""
    from decimal import Decimal

    from app.controllers.scrap import register_incident

    if data.incidence_category not in ("maquinaria", "insumo"):
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden crear incidencias de maquinaria o insumo desde este endpoint",
        )

    try:
        loss_record = register_incident(
            db=db,
            user_id=current_user.id,
            incidence_category=data.incidence_category,
            machinery_name=data.machinery_name,
            supply_id=uuid.UUID(data.supply_id) if data.supply_id else None,
            custom_supply_name=data.custom_supply_name,
            observations=data.observations,
            incident_type="perdida",
            quantity=Decimal(1),
        )

        supply_name = None
        if loss_record.supply:
            supply_name = loss_record.supply.name_supplies

        return GeneralIncidenceResponse(
            id=str(loss_record.id),
            incidence_category=loss_record.incidence_category,
            machinery_name=loss_record.machinery_name,
            supply_id=str(loss_record.supply_id) if loss_record.supply_id else None,
            supply_name=supply_name,
            custom_supply_name=loss_record.custom_supply_name,
            observations=loss_record.observations,
            incident_type=loss_record.incident_type,
            registered_by_name=f"{current_user.name_user} {current_user.last_name}".strip(),
            created_at=loss_record.created_at,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/general-incidences",
    response_model=GeneralIncidenceListResponse,
    summary="Listar incidencias generales del empleado",
)
def get_general_incidences(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> GeneralIncidenceListResponse:
    """Lista las incidencias generales (maquinaria/insumo) registradas por el empleado."""

    stmt = (
        select(LossRecord)
        .where(
            LossRecord.registered_by_id == current_user.id,
            LossRecord.incidence_category.in_(["maquinaria", "insumo"]),
            LossRecord.deleted_at == None,
        )
        .order_by(desc(LossRecord.created_at))
    )
    records = list(db.execute(stmt).scalars().all())

    items = []
    for rec in records:
        supply_name = None
        if rec.supply:
            supply_name = rec.supply.name_supplies

        items.append(GeneralIncidenceResponse(
            id=str(rec.id),
            incidence_category=rec.incidence_category,
            machinery_name=rec.machinery_name,
            supply_id=str(rec.supply_id) if rec.supply_id else None,
            supply_name=supply_name,
            custom_supply_name=rec.custom_supply_name,
            observations=rec.observations,
            incident_type=rec.incident_type,
            registered_by_name=f"{current_user.name_user} {current_user.last_name}".strip(),
            created_at=rec.created_at,
        ))

    return GeneralIncidenceListResponse(incidences=items, total=len(items))


# ─────────────────────────────────────────────
#  Incidencias de producto (pendientes de aprobación)
# ─────────────────────────────────────────────


@router.post(
    "/product-incidences",
    response_model=ProductIncidenceResponse,
    summary="Crear incidencia de producto vinculada a tarea",
)
def create_product_incidence(
    data: ProductIncidenceCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ProductIncidenceResponse:
    """Crea una incidencia de producto pendiente de aprobación del jefe."""
    from app.controllers.dashboard_empleado import create_pending_incidence

    try:
        pending = create_pending_incidence(
            db=db,
            employee_id=current_user.id,
            task_id=uuid.UUID(data.task_id),
            size=data.size,
            colour=data.colour,
            defect_code_id=uuid.UUID(data.defect_code_id) if data.defect_code_id else None,
            description=data.description,
            quantity=data.quantity,
            observations=data.observations,
        )

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
            employee_name=f"{current_user.name_user} {current_user.last_name}".strip(),
            reviewed_by_name=None,
            reviewed_at=None,
            created_at=pending.created_at.isoformat() if pending.created_at else None,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get(
    "/product-incidences",
    response_model=ProductIncidenceListResponse,
    summary="Listar incidencias de producto del empleado",
)
def get_my_product_incidences(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ProductIncidenceListResponse:
    """Lista las incidencias de producto creadas por el empleado."""
    from app.controllers.dashboard_empleado import get_employee_pending_incidences

    pendings = get_employee_pending_incidences(db, current_user.id)

    items = []
    for p in pendings:
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
            employee_name=f"{current_user.name_user} {current_user.last_name}".strip(),
            reviewed_by_name=reviewed_by_name,
            reviewed_at=p.reviewed_at.isoformat() if p.reviewed_at else None,
            created_at=p.created_at.isoformat() if p.created_at else None,
        ))

    return ProductIncidenceListResponse(incidences=items, total=len(items))
