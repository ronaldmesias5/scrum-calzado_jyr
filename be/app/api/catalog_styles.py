"""
Rutas administrativas para gestión de estilos
Admin y Jefe pueden crear, editar, eliminar estilos
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db, _require_admin_or_jefe
from app.models.style import Style
from app.models.user import User
from app.repositories.brand_repository import BrandRepository
from app.repositories.style_repository import StyleRepository
from app.schemas.catalog_admin import StyleCreateRequest

router = APIRouter(
    prefix="/api/v1/admin/catalog",
    tags=["admin-catalog"],
)


@router.get("/styles", summary="Listar estilos (con filtro opcional por brand)")
def list_styles(
    brand_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene estilos, opcionalmente filtrados por marca"""
    _require_admin_or_jefe(current_user)
    
    brand_uuid = None
    if brand_id:
        try:
            brand_uuid = uuid.UUID(brand_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El formato del ID de marca es incorrecto"
            )
    
    styles = StyleRepository(db).list_all(brand_id=brand_uuid)
    
    return {
        "styles": [
            {
                "id": str(style.id),
                "name": style.name_style,
                "description": style.description_style,
                "brand_id": str(style.brand_id),
                "brand_name": style.brand.name_brand if style.brand else "Unknown",
                "created_at": style.created_at.isoformat() if style.created_at else None,
            }
            for style in styles
        ]
    }


@router.post("/styles", summary="Crear nuevo estilo", response_model=dict)
def create_style(
    req: StyleCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea un nuevo estilo"""
    _require_admin_or_jefe(current_user)
    
    try:
        brand_uuid = uuid.UUID(req.brand_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El formato del ID de marca es incorrecto"
        )
    
    style_repo = StyleRepository(db)
    # Verificar que la marca exista
    brand = BrandRepository(db).get_by_id(brand_uuid)
    
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marca no encontrada"
        )
    
    # Verificar que no exista un estilo con el mismo nombre en la misma marca
    existing = style_repo.find_by_name_in_brand(req.name, brand_uuid)
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un estilo '{req.name}' en la marca {brand.name_brand}"
        )
    
    style = Style(
        id=uuid.uuid4(),
        name_style=req.name,
        description_style=req.description,
        brand_id=brand_uuid,
    )
    style_repo.add(style)
    db.commit()
    db.refresh(style)
    
    return {
        "id": str(style.id),
        "name": style.name_style,
        "description": style.description_style,
        "brand_id": str(style.brand_id),
        "brand_name": brand.name_brand,
        "message": "Estilo creado exitosamente"
    }


@router.put("/styles/{style_id}", summary="Actualizar estilo", response_model=dict)
def update_style(
    style_id: str,
    req: StyleCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza un estilo existente"""
    _require_admin_or_jefe(current_user)
    
    try:
        style_uuid = uuid.UUID(style_id)
        brand_uuid = uuid.UUID(req.brand_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El formato del ID es incorrecto"
        )
    
    style_repo = StyleRepository(db)
    style = style_repo.get_by_id(style_uuid)
    
    if not style:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estilo no encontrado"
        )
    
    # Verificar que la marca exista
    brand = BrandRepository(db).get_by_id(brand_uuid)
    
    if not brand:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Marca no encontrada"
        )
    
    # Si cambió la marca o el nombre, verificar duplicados
    existing = style_repo.find_by_name_in_brand(req.name, brand_uuid, exclude_id=style_uuid)
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe un estilo '{req.name}' en la marca {brand.name_brand}"
        )
    
    style.name_style = req.name
    style.description_style = req.description
    style.brand_id = brand_uuid
    style.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(style)
    
    return {
        "id": str(style.id),
        "name": style.name_style,
        "description": style.description_style,
        "brand_id": str(style.brand_id),
        "brand_name": brand.name_brand,
        "message": "Estilo actualizado exitosamente"
    }


@router.delete("/styles/{style_id}", summary="Eliminar estilo")
def delete_style(
    style_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Elimina lógicamente un estilo (soft delete)"""
    _require_admin_or_jefe(current_user)
    
    try:
        style_uuid = uuid.UUID(style_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El formato del ID de estilo es incorrecto"
        )
    
    style_repo = StyleRepository(db)
    style = style_repo.get_by_id(style_uuid)
    
    if not style:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estilo no encontrado"
        )
    
    # Verificar que no haya productos asociados activos
    active_products = style_repo.list_active_products(style_uuid)
    
    if active_products:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar el estilo porque tiene {len(active_products)} producto(s) asociado(s)"
        )
    
    style.deleted_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": "Estilo eliminado exitosamente"}
