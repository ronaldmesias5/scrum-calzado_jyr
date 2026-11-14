"""
Rutas administrativas para gestión de marcas
Admin y Jefe pueden crear, editar, eliminar marcas
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.dependencies import get_current_user, get_db, _require_admin_or_jefe
from app.models.brand import Brand
from app.models.style import Style
from app.models.user import User
from app.schemas.catalog_admin import BrandCreateRequest

router = APIRouter(
    prefix="/api/v1/admin/catalog",
    tags=["admin-catalog"],
)


@router.get("/brands", summary="Listar todas las marcas")
def list_brands(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene todas las marcas (públicas y privadas)"""
    _require_admin_or_jefe(current_user)
    
    brands = db.execute(
        select(Brand).where(Brand.deleted_at == None).order_by(Brand.name_brand)
    ).scalars().all()
    
    return {
        "brands": [
            {
                "id": str(brand.id),
                "name": brand.name_brand,
                "description": brand.description_brand,
                "created_at": brand.created_at.isoformat() if brand.created_at else None,
            }
            for brand in brands
        ]
    }


@router.post("/brands", summary="Crear nueva marca", response_model=dict)
def create_brand(
    req: BrandCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea una nueva marca"""
    _require_admin_or_jefe(current_user)
    
    # Verificar que no exista una marca con el mismo nombre
    existing = db.execute(
        select(Brand).where(
            (Brand.name_brand.ilike(req.name)) &
            (Brand.deleted_at == None)
        )
    ).scalar()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una marca con el nombre '{req.name}'"
        )
    
    brand = Brand(
        id=uuid.uuid4(),
        name_brand=req.name,
        description_brand=req.description,
    )
    db.add(brand)
    db.commit()
    db.refresh(brand)
    
    return {
        "id": str(brand.id),
        "name": brand.name_brand,
        "description": brand.description_brand,
        "message": "Marca creada exitosamente"
    }


@router.put("/brands/{brand_id}", summary="Actualizar marca", response_model=dict)
def update_brand(
    brand_id: str,
    req: BrandCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza una marca existente"""
    _require_admin_or_jefe(current_user)
    
    try:
        brand_uuid = uuid.UUID(brand_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El formato del ID de marca es incorrecto"
        )
    
    brand = db.execute(
        select(Brand).where(
            (Brand.id == brand_uuid) &
            (Brand.deleted_at == None)
        )
    ).scalar()
    
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marca no encontrada"
        )
    
    # Verificar que no exista otra marca con el mismo nombre
    existing = db.execute(
        select(Brand).where(
            (Brand.name_brand.ilike(req.name)) &
            (Brand.id != brand_uuid) &
            (Brand.deleted_at == None)
        )
    ).scalar()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe otra marca con el nombre '{req.name}'"
        )
    
    brand.name_brand = req.name
    brand.description_brand = req.description
    brand.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(brand)
    
    return {
        "id": str(brand.id),
        "name": brand.name_brand,
        "description": brand.description_brand,
        "message": "Marca actualizada exitosamente"
    }


@router.delete("/brands/{brand_id}", summary="Eliminar marca")
def delete_brand(
    brand_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Elimina lógicamente una marca (soft delete)"""
    _require_admin_or_jefe(current_user)
    
    try:
        brand_uuid = uuid.UUID(brand_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El formato del ID de marca es incorrecto"
        )
    
    brand = db.execute(
        select(Brand).where(
            (Brand.id == brand_uuid) &
            (Brand.deleted_at == None)
        )
    ).scalar()
    
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marca no encontrada"
        )
    
    # Verificar que no haya estilos asociados activos
    active_styles = db.execute(
        select(Style).where(
            (Style.brand_id == brand_uuid) &
            (Style.deleted_at == None)
        )
    ).scalars().all()
    
    if active_styles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar la marca porque tiene {len(active_styles)} estilo(s) asociado(s)"
        )
    
    brand.deleted_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": "Marca eliminada exitosamente"}
