"""
Rutas administrativas para gestión de inventario
Admin y Jefe pueden gestionar stock, movimientos y pares fabricados
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.dependencies import get_current_user, get_db, _require_admin_or_jefe
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement, InventoryMovementType
from app.models.user import User
from app.schemas.catalog_admin import (
    InventoryCreateRequest,
    BulkInventoryUpdateRequest,
    InventoryMovementCreateRequest,
)

router = APIRouter(
    prefix="/api/v1/admin/catalog",
    tags=["admin-catalog"],
)


@router.get("/inventory", summary="Listar inventario (con filtros opcionales)")
def list_inventory(
    product_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene inventario con filtros opcionales"""
    _require_admin_or_jefe(current_user)
    
    query = select(Inventory).where(Inventory.deleted_at == None)
    
    if product_id:
        try:
            query = query.where(Inventory.product_id == uuid.UUID(product_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="El formato del ID de producto es incorrecto")
    
    inventory = db.execute(query.order_by(Inventory.product_id, Inventory.size)).scalars().all()
    
    return {
        "inventory": [
            {
                "id": str(inv.id),
                "product_id": str(inv.product_id),
                "product_name": inv.product.name_product if inv.product else "Unknown",
                "size": inv.size,
                "quantity": inv.amount,
                "created_at": inv.created_at.isoformat() if inv.created_at else None,
            }
            for inv in inventory
        ]
    }


@router.post("/inventory", summary="Crear o actualizar inventario")
def create_or_update_inventory(
    req: InventoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea o actualiza el inventario de un producto con una talla"""
    _require_admin_or_jefe(current_user)
    
    try:
        product_uuid = uuid.UUID(req.product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="El formato del ID de producto es incorrecto")
    
    # Verificar que el producto exista
    product = db.execute(
        select(Product).where((Product.id == product_uuid) & (Product.deleted_at == None))
    ).scalar()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Buscar inventario existente
    # Buscar inventario existente (tomar todos para auto-sanar duplicados)
    existing_invs = db.execute(
        select(Inventory).where(
            (Inventory.product_id == product_uuid)
            & (Inventory.size == req.size)
            & (Inventory.deleted_at == None)
        )
    ).scalars().all()
    
    if existing_invs:
        existing_inv = existing_invs[0]
        old_amount = sum(float(inv.amount or 0) for inv in existing_invs)
        
        # Calcular diferencia para el movimiento
        diff = req.quantity - old_amount
        
        # Actualizar
        existing_inv.amount = req.quantity
        existing_inv.updated_at = datetime.now(timezone.utc)
        
        # Eliminar los duplicados si existen para evitar sumas fantasma
        for dup in existing_invs[1:]:
            dup.deleted_at = datetime.now(timezone.utc)
            dup.amount = 0
            db.add(dup)
        
        if diff != 0:
            movement_type = InventoryMovementType.entrada if diff > 0 else InventoryMovementType.salida
            db.add(InventoryMovement(
                id=uuid.uuid4(),
                product_id=product_uuid,
                user_id=current_user.id,
                type_of_movement=movement_type,
                size=req.size,
                amount=abs(diff),
                reason="Ajuste manual (Panel Admin)",
                movement_date=datetime.now(timezone.utc)
            ))
            
        db.commit()
        db.refresh(existing_inv)
        return {
            "id": str(existing_inv.id),
            "product_id": str(existing_inv.product_id),
            "product_name": product.name_product,
            "size": existing_inv.size,
            "quantity": existing_inv.amount,
            "message": "Inventario actualizado exitosamente"
        }
    else:
        # Crear nuevo
        inventory = Inventory(
            id=uuid.uuid4(),
            product_id=product_uuid,
            size=req.size,
            amount=req.quantity,
        )
        db.add(inventory)
        
        # Registrar movimiento de entrada inicial
        if req.quantity > 0:
            db.add(InventoryMovement(
                id=uuid.uuid4(),
                product_id=product_uuid,
                user_id=current_user.id,
                type_of_movement=InventoryMovementType.entrada,
                size=req.size,
                amount=req.quantity,
                reason="Stock inicial (Panel Admin)",
                movement_date=datetime.now(timezone.utc)
            ))
            
        db.commit()
        db.refresh(inventory)
        return {
            "id": str(inventory.id),
            "product_id": str(inventory.product_id),
            "product_name": product.name_product,
            "size": inventory.size,
            "quantity": inventory.amount,
            "message": "Inventario creado exitosamente"
        }


@router.delete("/inventory/{inventory_id}", summary="Eliminar inventario")
def delete_inventory(
    inventory_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Elimina lógicamente un registro de inventario"""
    _require_admin_or_jefe(current_user)
    
    try:
        inventory_uuid = uuid.UUID(inventory_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="El formato del ID es incorrecto")
    
    inventory = db.execute(
        select(Inventory).where((Inventory.id == inventory_uuid) & (Inventory.deleted_at == None))
    ).scalar()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventario no encontrado")
    
    inventory.deleted_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": "Inventario eliminado exitosamente"}


@router.post("/inventory/bulk", summary="Actualizar inventario de múltiples tallas")
def bulk_update_inventory(
    req: BulkInventoryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea o actualiza el inventario de un producto para múltiples tallas a la vez"""
    _require_admin_or_jefe(current_user)
    
    try:
        try:
            product_uuid = uuid.UUID(req.product_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="El formato del ID de producto es incorrecto")
        
        # Verificar que el producto exista
        product = db.execute(
            select(Product).where((Product.id == product_uuid) & (Product.deleted_at == None))
        ).scalar()
        if not product:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        
        updated_count = 0
        created_count = 0
        results = []
        
        # PRIMERO: Obtener todas las tallas actuales del producto
        current_inventory = db.execute(
            select(Inventory).where(
                (Inventory.product_id == product_uuid) &
                (Inventory.deleted_at == None)
            )
        ).scalars().all()
        
        # SEGUNDO: Actualizar o crear las tallas en el request
        for size_str, quantity in req.quantities.items():
            size = str(size_str).strip()
            if not size:
                continue
            
            # Convertir cantidad a entero
            quantity = int(quantity) if isinstance(quantity, (int, float)) else int(str(quantity))
            
            # Buscar inventario existente (tomar todos para auto-sanar duplicados)
            existing_invs = db.execute(
                select(Inventory).where(
                    (Inventory.product_id == product_uuid) &
                    (Inventory.size == size) &
                    (Inventory.deleted_at == None)
                )
            ).scalars().all()
            
            if existing_invs:
                existing_inv = existing_invs[0]
                old_amount = sum(float(inv.amount or 0) for inv in existing_invs)
                diff = quantity - old_amount
                
                # Actualizar el principal
                existing_inv.amount = quantity
                existing_inv.updated_at = datetime.now(timezone.utc)
                db.add(existing_inv)
                
                # Eliminar los duplicados si existen para evitar sumas fantasma
                for dup in existing_invs[1:]:
                    dup.deleted_at = datetime.now(timezone.utc)
                    dup.amount = 0
                    db.add(dup)
                
                if diff != 0:
                    movement_type = InventoryMovementType.entrada if diff > 0 else InventoryMovementType.salida
                    db.add(InventoryMovement(
                        id=uuid.uuid4(),
                        product_id=product_uuid,
                        user_id=current_user.id,
                        type_of_movement=movement_type,
                        size=size,
                        amount=abs(diff),
                        reason="Ajuste masivo (Panel Admin)",
                        movement_date=datetime.now(timezone.utc)
                    ))
                
                updated_count += 1
                results.append({
                    "size": size,
                    "quantity": quantity,
                    "action": "updated"
                })
            else:
                # Solo crear si quantity > 0
                if quantity > 0:
                    inventory = Inventory(
                        id=uuid.uuid4(),
                        product_id=product_uuid,
                        size=size,
                        amount=quantity,
                    )
                    db.add(inventory)
                    
                    db.add(InventoryMovement(
                        id=uuid.uuid4(),
                        product_id=product_uuid,
                        user_id=current_user.id,
                        type_of_movement=InventoryMovementType.entrada,
                        size=size,
                        amount=quantity,
                        reason="Stock masivo inicial (Panel Admin)",
                        movement_date=datetime.now(timezone.utc)
                    ))
                    
                    created_count += 1
                    results.append({
                        "size": size,
                        "quantity": quantity,
                        "action": "created"
                    })
                else:
                    pass
        
        db.commit()
        
        # Calcular stock_total actualizado
        stock_total = db.execute(
            select(func.sum(Inventory.amount).label("total"))
            .where((Inventory.product_id == product_uuid) & (Inventory.deleted_at == None))
        ).scalar() or 0
        
        return {
            "product_id": str(product_uuid),
            "product_name": product.name_product,
            "stock_total": int(stock_total),
            "updated_count": updated_count,
            "created_count": created_count,
            "results": results,
            "message": f"Inventario actualizado: {created_count} creados, {updated_count} actualizados"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar inventario: {str(e)}")


@router.post("/inventory/movements", summary="Registrar un movimiento de inventario")
def create_inventory_movement(
    request: InventoryMovementCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Registra un movimiento (salida/entrada) y actualiza el inventario (amount) disponible en bodega.
    Usado principalmente para descontar stock al iniciar producción de faltantes.
    """
    _require_admin_or_jefe(current_user)
    
    product_uuid = UUID(request.product_id)
    
    # 1. Buscar inventario para ese producto y talla
    inventory_items = db.execute(
        select(Inventory).where(
            (Inventory.product_id == product_uuid) &
            (Inventory.size == request.size) &
            (Inventory.deleted_at == None)
        )
    ).scalars().all()
    
    if not inventory_items:
        raise HTTPException(status_code=404, detail="Inventario no encontrado para esta talla")
        
    # Usar el registro principal (el primero)
    inv = inventory_items[0]
    
    # 2. Actualizar amount dependiendo del tipo de movimiento
    if request.movement_type == 'salida':
        if inv.amount < request.quantity:
            # En vez de error bloqueante, permitimos quedar en negativo temporalmente o lo ajustamos a 0
            # para no bloquear el inicio de producción si hay discrepancias menores.
            pass
        inv.amount -= Decimal(request.quantity)
    elif request.movement_type == 'entrada':
        inv.amount += Decimal(request.quantity)
    # Si es 'reserva' o 'ajuste', la lógica podría ser diferente, por ahora nos enfocamos en salida/entrada.
        
    db.add(inv)
    
    # 3. Registrar el movimiento
    mov_type_enum = InventoryMovementType.salida if request.movement_type == 'salida' else InventoryMovementType.entrada
    if request.movement_type == 'ajuste':
        mov_type_enum = InventoryMovementType.ajuste
    
    movement = InventoryMovement(
        id=uuid.uuid4(),
        product_id=product_uuid,
        user_id=current_user.id,
        type_of_movement=mov_type_enum,
        size=request.size,
        colour=inv.colour, # Usar el color del inventario
        amount=Decimal(request.quantity),
        reason=request.notes or f"Movimiento manual de {request.movement_type} (Referencia: {request.reference_id})",
        movement_date=datetime.now(timezone.utc)
    )
    db.add(movement)
    
    try:
        db.commit()
        return {"status": "success", "message": "Inventario actualizado correctamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar movimiento: {str(e)}")
