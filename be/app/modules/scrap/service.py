"""
ScrapService — funciones síncronas para el módulo de registro de incidencias.
Usa Session (síncrona), NO AsyncSession.

Funciones:
  - get_defect_codes(db): listar códigos de defecto activos
  - create_defect_code(db, data, user_id): crear código de defecto
  - get_incidents(db, filters): listar incidencias con filtros
  - get_incident_by_id(db, incident_id): obtener incidencia por ID
  - register_incident(db, data, user_id): registrar incidencia
  - repair_incident(db, incident_id, user_id): marcar como reparado
  - approve_loss(db, loss_id, user_id): aprobar pérdida (backwards compat)
  - reject_loss(db, loss_id, user_id): rechazar pérdida (backwards compat)
  - get_scrap_stock(db): listar stock de scrap
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

from app.models.scrap import DefectCode, LossRecord, ScrapStock
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement, InventoryMovementType
from app.models.product import Product
from app.models.order import Order, OrderDetail
from app.models.supplies import Supplies

VALID_CATEGORIES = {"producto", "maquinaria", "insumo"}


def get_defect_codes(db: Session) -> list[DefectCode]:
    """Obtiene todos los códigos de defecto activos."""
    stmt = (
        select(DefectCode)
        .where(DefectCode.is_active.is_(True), DefectCode.deleted_at.is_(None))
        .order_by(DefectCode.code)
    )
    return list(db.execute(stmt).scalars().all())


def create_defect_code(
    db: Session, code: str, name: str, description: str | None = None
) -> DefectCode:
    """Crea un nuevo código de defecto."""
    existing = db.execute(
        select(DefectCode).where(DefectCode.code == code)
    ).scalar_one_or_none()
    if existing:
        raise ValueError(f"Ya existe un código de defecto con código '{code}'")

    defect_code = DefectCode(
        code=code,
        name=name,
        description=description,
    )
    db.add(defect_code)
    db.flush()
    return defect_code


def get_incidents(
    db: Session,
    incident_type: str | None = None,
    product_id: uuid.UUID | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    incidence_category: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[LossRecord], int]:
    """
    Obtiene incidencias con filtros opcionales.
    Retorna (items, total).
    """
    stmt = select(LossRecord).where(LossRecord.deleted_at.is_(None))
    count_stmt = select(func.count(LossRecord.id)).where(LossRecord.deleted_at.is_(None))

    if incident_type:
        stmt = stmt.where(LossRecord.incident_type == incident_type)
        count_stmt = count_stmt.where(LossRecord.incident_type == incident_type)
    if product_id:
        stmt = stmt.where(LossRecord.product_id == product_id)
        count_stmt = count_stmt.where(LossRecord.product_id == product_id)
    if date_from:
        stmt = stmt.where(LossRecord.created_at >= date_from)
        count_stmt = count_stmt.where(LossRecord.created_at >= date_from)
    if date_to:
        stmt = stmt.where(LossRecord.created_at <= date_to)
        count_stmt = count_stmt.where(LossRecord.created_at <= date_to)
    if incidence_category:
        stmt = stmt.where(LossRecord.incidence_category == incidence_category)
        count_stmt = count_stmt.where(LossRecord.incidence_category == incidence_category)

    total = db.execute(count_stmt).scalar() or 0

    stmt = stmt.order_by(desc(LossRecord.created_at)).offset(offset).limit(limit)
    items = list(db.execute(stmt).scalars().all())

    return items, total


def get_incident_by_id(db: Session, incident_id: uuid.UUID) -> LossRecord | None:
    """Obtiene una incidencia por ID."""
    stmt = select(LossRecord).where(
        LossRecord.id == incident_id,
        LossRecord.deleted_at.is_(None),
    )
    return db.execute(stmt).scalar_one_or_none()


def _deduct_inventory(
    db: Session,
    product_id: uuid.UUID,
    size: str,
    quantity: Decimal,
) -> None:
    """Deduce del inventario. Lanza ValueError si no hay suficiente stock."""
    inventory_stmt = select(Inventory).where(
        Inventory.product_id == product_id,
        Inventory.size == size,
        Inventory.deleted_at.is_(None),
    )
    inventory_items = list(db.execute(inventory_stmt).scalars().all())

    if not inventory_items:
        raise ValueError(f"No hay inventario para el producto talla {size}")

    total_amount = sum(item.amount for item in inventory_items)
    total_reserved = sum(item.reserved for item in inventory_items)
    available = total_amount - total_reserved

    if quantity > available:
        raise ValueError(
            f"Cantidad ({quantity}) excede el stock disponible ({available}). "
            f"Stock total: {total_amount}, reservado: {total_reserved}"
        )

    remaining_to_deduct = quantity
    for inv_item in inventory_items:
        if remaining_to_deduct <= 0:
            break
        item_available = inv_item.amount - inv_item.reserved
        if item_available > 0:
            deduct = min(remaining_to_deduct, item_available)
            inv_item.amount -= deduct
            remaining_to_deduct -= deduct

    if remaining_to_deduct > 0:
        raise ValueError("No se pudo deducir la cantidad completa del inventario")


def _create_scrap_entry(
    db: Session,
    product_id: uuid.UUID,
    size: str,
    colour: str | None,
    quantity: Decimal,
    defect_code_id: uuid.UUID,
    loss_record_id: uuid.UUID,
) -> ScrapStock:
    """Crea un registro en ScrapStock."""
    scrap_entry = ScrapStock(
        product_id=product_id,
        size=size,
        colour=colour,
        quantity=quantity,
        defect_code_id=defect_code_id,
        loss_record_id=loss_record_id,
    )
    db.add(scrap_entry)
    return scrap_entry


def _create_inventory_movement(
    db: Session,
    product_id: uuid.UUID,
    user_id: uuid.UUID,
    size: str,
    colour: str | None,
    quantity: Decimal,
    reason: str,
) -> InventoryMovement:
    """Crea un movimiento de inventario."""
    movement = InventoryMovement(
        product_id=product_id,
        user_id=user_id,
        type_of_movement=InventoryMovementType.salida,
        size=size,
        colour=colour,
        amount=float(quantity),
        reason=reason,
        movement_date=datetime.now(timezone.utc),
    )
    db.add(movement)
    return movement


def _restore_inventory(
    db: Session,
    product_id: uuid.UUID,
    size: str,
    colour: str | None,
    quantity: Decimal,
) -> None:
    """Restaura cantidad al inventario (para reversiones)."""
    inventory_stmt = select(Inventory).where(
        Inventory.product_id == product_id,
        Inventory.size == size,
        Inventory.deleted_at.is_(None),
    )
    inventory_items = list(db.execute(inventory_stmt).scalars().all())

    if inventory_items:
        inventory_items[0].amount += quantity
    else:
        new_inv = Inventory(
            product_id=product_id,
            size=size,
            colour=colour or "",
            amount=quantity,
            reserved=0,
            minimum_stock=0,
        )
        db.add(new_inv)


def register_incident(
    db: Session,
    user_id: uuid.UUID,
    incidence_category: str = "producto",
    product_id: uuid.UUID | None = None,
    size: str | None = None,
    colour: str | None = None,
    quantity: Decimal = Decimal("1"),
    machinery_name: str | None = None,
    supply_id: uuid.UUID | None = None,
    custom_supply_name: str | None = None,
    defect_code_id: uuid.UUID | None = None,
    description: str | None = None,
    incident_type: str = "perdida",
    reason: str | None = None,
    observations: str | None = None,
    order_id: uuid.UUID | None = None,
    order_detail_id: uuid.UUID | None = None,
    line_group: int | None = None,
) -> LossRecord:
    """
    Registra una incidencia.

    Lógica según incidence_category:
    - "producto": valida product, defect_code, deduce inventario (perdida/en_reparacion),
      crea ScrapStock e InventoryMovement. Si hay order, reduce OrderDetail.amount.
    - "maquinaria": solo registra la incidencia (machinery_name obligatorio).
    - "insumo": solo registra la incidencia (supply_id obligatorio).

    Para producto, incident_type controla:
    - "perdida": deduce inventario, crea scrap e inventory movement
    - "en_reparacion": deduce inventario, crea scrap e inventory movement
    - "devuelto": NO deduce del inventario (ya se dedujo en entrega)
    """
    # 1. Validar incidence_category
    if incidence_category not in VALID_CATEGORIES:
        raise ValueError(
            f"Categoría de incidencia inválida: {incidence_category}. "
            f"Válidas: {', '.join(sorted(VALID_CATEGORIES))}"
        )

    # 2. Validar/auto-set incident_type según categoría
    if incidence_category == "producto":
        valid_types = {"perdida", "en_reparacion", "devuelto"}
        if incident_type not in valid_types:
            raise ValueError(f"Tipo de incidencia inválido: {incident_type}. Válidos: {', '.join(valid_types)}")
    elif incidence_category == "maquinaria":
        incident_type = "falla"
        defect_code_id = None
    elif incidence_category == "insumo":
        incident_type = "faltante"
        defect_code_id = None

    # 3. Category-specific validations
    if incidence_category == "producto":
        if not product_id:
            raise ValueError("product_id es obligatorio para incidencias de producto")
        if not size:
            raise ValueError("size es obligatorio para incidencias de producto")
        # Al menos uno de defect_code_id o description debe estar presente
        if not defect_code_id and not description:
            raise ValueError("Debe proporcionar un código de defecto o una descripción")

        # Validar producto
        product = db.execute(
            select(Product).where(Product.id == product_id, Product.deleted_at.is_(None))
        ).scalar_one_or_none()
        if not product:
            raise ValueError("Producto no encontrado")

        # Si hay order, validar y procesar
        if order_id:
            order = db.execute(
                select(Order).where(Order.id == order_id)
            ).scalar_one_or_none()
            if not order:
                raise ValueError("Orden no encontrada")

            if order_detail_id:
                order_detail = db.execute(
                    select(OrderDetail).where(
                        OrderDetail.id == order_detail_id,
                        OrderDetail.order_id == order_id,
                    )
                ).scalar_one_or_none()
                if not order_detail:
                    raise ValueError("Detalle de orden no encontrado")

                # Reducir amount del OrderDetail
                if order_detail.amount < quantity:
                    raise ValueError(
                        f"Cantidad ({quantity}) excede el amount del detalle ({order_detail.amount})"
                    )
                order_detail.amount -= quantity

                # Actualizar total_pairs de la orden
                order.total_pairs = (order.total_pairs or 0) - quantity

        # Deducir inventario (solo para perdida y en_reparacion)
        if incident_type in ("perdida", "en_reparacion"):
            _deduct_inventory(db, product_id, size, quantity)

    elif incidence_category == "maquinaria":
        if not machinery_name:
            raise ValueError("machinery_name es obligatorio para incidencias de maquinaria")
        # No inventory operations for machinery

    elif incidence_category == "insumo":
        if not supply_id and not custom_supply_name:
            raise ValueError("supply_id o custom_supply_name es obligatorio para incidencias de insumo")
        # Validate supply exists if supply_id provided
        if supply_id:
            supply = db.execute(
                select(Supplies).where(Supplies.id == supply_id, Supplies.deleted_at.is_(None))
            ).scalar_one_or_none()
            if not supply:
                raise ValueError("Insumo no encontrado")
        # No inventory deduction for supplies — just register the incidence

    # 4. Crear LossRecord
    loss_record = LossRecord(
        incidence_category=incidence_category,
        product_id=product_id,
        size=size,
        colour=colour,
        quantity=quantity,
        machinery_name=machinery_name,
        supply_id=supply_id,
        custom_supply_name=custom_supply_name,
        defect_code_id=defect_code_id,
        description=description,
        incident_type=incident_type,
        reason=reason,
        observations=observations,
        registered_by_id=user_id,
        order_id=order_id,
        order_detail_id=order_detail_id,
        line_group=line_group,
    )
    db.add(loss_record)
    db.flush()

    # 5. Solo para producto: agregar a ScrapStock y crear InventoryMovement
    if incidence_category == "producto" and incident_type in ("perdida", "en_reparacion"):
        assert product_id is not None  # validated above for producto
        assert size is not None  # validated above for producto
        if defect_code_id is not None:
            _create_scrap_entry(db, product_id, size, colour, quantity, defect_code_id, loss_record.id)
        # Build reason for inventory movement (use defect code or description)
        if defect_code_id is not None:
            defect_code_obj = db.execute(
                select(DefectCode).where(DefectCode.id == defect_code_id)
            ).scalar_one_or_none()
            reason_text = f"Incidencia: {incident_type} - {defect_code_obj.code if defect_code_obj else 'N/A'}"
        else:
            reason_text = f"Incidencia: {incident_type} - {description or 'Sin descripción'}"
        _create_inventory_movement(
            db,
            product_id,
            user_id,
            size,
            colour,
            quantity,
            reason_text,
        )

    db.commit()
    db.refresh(loss_record)
    return loss_record


def repair_incident(
    db: Session,
    incident_id: uuid.UUID,
    user_id: uuid.UUID,
    repair_destination: str = "stock",
) -> LossRecord:
    """
    Marca una incidencia como reparada.

    Solo aplica para incidencias de producto (maquinaria/insumo no tienen
    inventario que restaurar).
    """
    valid_destinations = {"stock", "reserva", "customer_return"}
    if repair_destination not in valid_destinations:
        raise ValueError(
            f"Destino de reparación inválido: '{repair_destination}'. "
            f"Válidos: {', '.join(sorted(valid_destinations))}"
        )

    incident = get_incident_by_id(db, incident_id)
    if not incident:
        raise ValueError("Incidencia no encontrada")

    if incident.incident_type == "reparado":
        raise ValueError("Ya está reparado")
    if incident.incident_type == "perdida":
        raise ValueError("Las pérdidas no se pueden reparar")
    if incident.incident_type not in ("en_reparacion", "devuelto"):
        raise ValueError(
            f"Tipo de incidencia '{incident.incident_type}' no soportado para reparación"
        )

    old_type = incident.incident_type

    # Marcar como reparado
    incident.incident_type = "reparado"
    incident.repaired_at = datetime.now(timezone.utc)
    incident.repaired_by_id = user_id

    _create_movement = False

    # Solo las incidencias de producto tienen operaciones de inventario
    if incident.incidence_category == "producto" and incident.product_id and incident.size:
        if old_type == "en_reparacion":
            if incident.order_id:
                order = db.execute(
                    select(Order).where(Order.id == incident.order_id)
                ).scalar_one_or_none()

                if order and order.state == "completado" and repair_destination == "reserva":
                    # Restaurar a OrderDetail + reservar en inventario
                    if incident.order_detail_id:
                        order_detail = db.execute(
                            select(OrderDetail).where(OrderDetail.id == incident.order_detail_id)
                        ).scalar_one_or_none()
                        if order_detail:
                            order_detail.amount += incident.quantity
                            order.total_pairs = (order.total_pairs or 0) + incident.quantity

                    # Agregar a inventory.reserved
                    inventory_stmt = select(Inventory).where(
                        Inventory.product_id == incident.product_id,
                        Inventory.size == incident.size,
                        Inventory.deleted_at.is_(None),
                    )
                    inventory_items = list(db.execute(inventory_stmt).scalars().all())
                    if inventory_items:
                        inventory_items[0].reserved = (inventory_items[0].reserved or 0) + incident.quantity
                    else:
                        new_inv = Inventory(
                            product_id=incident.product_id,
                            size=incident.size,
                            colour=incident.colour or "",
                            amount=0,
                            reserved=incident.quantity,
                            minimum_stock=0,
                        )
                        db.add(new_inv)

                    _create_movement = True

                elif order and order.state in ("en_progreso", "pendiente"):
                    # Restaurar solo a OrderDetail (sin cambio de inventario)
                    if incident.order_detail_id:
                        order_detail = db.execute(
                            select(OrderDetail).where(OrderDetail.id == incident.order_detail_id)
                        ).scalar_one_or_none()
                        if order_detail:
                            order_detail.amount += incident.quantity
                            order.total_pairs = (order.total_pairs or 0) + incident.quantity

                    _create_movement = False

                else:
                    # "entregado", "completado" sin reserva, u orden no encontrada
                    _restore_inventory(db, incident.product_id, incident.size, incident.colour, incident.quantity)
                    _create_movement = True

            else:
                # Sin orden: restaurar al inventario
                _restore_inventory(db, incident.product_id, incident.size, incident.colour, incident.quantity)
                _create_movement = True

        elif old_type == "devuelto":
            if repair_destination == "stock":
                _restore_inventory(db, incident.product_id, incident.size, incident.colour, incident.quantity)
                _create_movement = True
            elif repair_destination == "customer_return":
                # Sin impacto en inventario, solo nota en observaciones
                note = "Devuelto al cliente. Reparación completada."
                if incident.observations:
                    incident.observations += f" | {note}"
                else:
                    incident.observations = note
                _create_movement = False

    # Soft delete de ScrapStock (solo producto)
    if incident.incidence_category == "producto":
        scrap_stmt = select(ScrapStock).where(
            ScrapStock.loss_record_id == incident.id,
            ScrapStock.deleted_at.is_(None),
        )
        scrap_items = list(db.execute(scrap_stmt).scalars().all())
        now = datetime.now(timezone.utc)
        for scrap in scrap_items:
            scrap.deleted_at = now

    # Crear movimiento de inventario solo para destinos stock/reserva (solo producto)
    if _create_movement and incident.incidence_category == "producto" and incident.quantity > 0:
        movement = InventoryMovement(
            product_id=incident.product_id,
            user_id=user_id,
            type_of_movement=InventoryMovementType.entrada,
            size=incident.size,
            colour=incident.colour,
            amount=float(incident.quantity),
            reason=(
                f"Reparación completada - "
                f"{incident.defect_code.code if incident.defect_code else 'N/A'}"
            ),
            movement_date=datetime.now(timezone.utc),
        )
        db.add(movement)

    db.commit()
    db.refresh(incident)
    return incident


def approve_loss(db: Session, loss_id: uuid.UUID, user_id: uuid.UUID) -> LossRecord:
    """
    Aprueba un registro de pérdida (backwards compat).
    Cambia incident_type a "perdida" si está pendiente.
    """
    loss_record = get_incident_by_id(db, loss_id)
    if not loss_record:
        raise ValueError("Registro no encontrado")

    if loss_record.incident_type == "perdida":
        loss_record.incident_type = "perdida"  # no-op, ya es pérdida
    loss_record.approved_by_id = user_id
    loss_record.approved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(loss_record)
    return loss_record


def reject_loss(db: Session, loss_id: uuid.UUID, user_id: uuid.UUID) -> LossRecord:
    """
    Rechaza un registro de pérdida (backwards compat).
    Cambia incident_type a "rejected". Si estaba como perdida, restaura stock.
    Solo aplica para incidencias de producto.
    """
    loss_record = get_incident_by_id(db, loss_id)
    if not loss_record:
        raise ValueError("Registro no encontrado")

    previous_type = loss_record.incident_type

    # Si era producto y estaba como pérdida/en_reparacion, restaurar inventario
    if loss_record.incidence_category == "producto" and previous_type in ("perdida", "en_reparacion"):
        # Restaurar inventario
        _restore_inventory(db, loss_record.product_id, loss_record.size, loss_record.colour, loss_record.quantity)

        # Soft delete scrap
        scrap_stmt = select(ScrapStock).where(
            ScrapStock.loss_record_id == loss_record.id,
            ScrapStock.deleted_at.is_(None),
        )
        scrap_items = list(db.execute(scrap_stmt).scalars().all())
        now = datetime.now(timezone.utc)
        for scrap in scrap_items:
            scrap.deleted_at = now

        # Si tiene order, restaurar OrderDetail amount
        if loss_record.order_id and loss_record.order_detail_id:
            order_detail = db.execute(
                select(OrderDetail).where(OrderDetail.id == loss_record.order_detail_id)
            ).scalar_one_or_none()
            if order_detail:
                order_detail.amount += loss_record.quantity
                order = db.execute(
                    select(Order).where(Order.id == loss_record.order_id)
                ).scalar_one_or_none()
                if order:
                    order.total_pairs = (order.total_pairs or 0) + loss_record.quantity

        # Crear movimiento de inventario (entrada por reversión)
        defect_code = db.execute(
            select(DefectCode).where(DefectCode.id == loss_record.defect_code_id)
        ).scalar_one_or_none()
        movement = InventoryMovement(
            product_id=loss_record.product_id,
            user_id=user_id,
            type_of_movement=InventoryMovementType.entrada,
            size=loss_record.size,
            colour=loss_record.colour,
            amount=float(loss_record.quantity),
            reason=(
                f"Reversión por rechazo de incidencia - "
                f"{defect_code.code if defect_code else 'N/A'}"
            ),
            movement_date=datetime.now(timezone.utc),
        )
        db.add(movement)

    loss_record.incident_type = "rechazado"

    db.commit()
    db.refresh(loss_record)
    return loss_record


def solve_incident(
    db: Session,
    incident_id: uuid.UUID,
    user_id: uuid.UUID,
) -> LossRecord:
    """
    Marca una incidencia de tipo falla o faltante como solucionado.
    Solo aplica para incidencias de maquinaria e insumo.
    """
    incident = get_incident_by_id(db, incident_id)
    if not incident:
        raise ValueError("Incidencia no encontrada")

    if incident.incident_type == "solucionado":
        raise ValueError("Ya está solucionado")
    if incident.incident_type not in ("falla", "faltante"):
        raise ValueError(
            f"Tipo de incidencia '{incident.incident_type}' no soportado para solucionar. "
            "Solo incidencias de tipo falla o faltante pueden ser solucionadas"
        )

    incident.incident_type = "solucionado"
    incident.repaired_at = datetime.now(timezone.utc)
    incident.repaired_by_id = user_id

    db.commit()
    db.refresh(incident)
    return incident


def get_scrap_stock(db: Session) -> list[ScrapStock]:
    """Obtiene todo el stock de scrap activo."""
    stmt = (
        select(ScrapStock)
        .where(ScrapStock.deleted_at.is_(None))
        .order_by(desc(ScrapStock.created_at))
    )
    return list(db.execute(stmt).scalars().all())
