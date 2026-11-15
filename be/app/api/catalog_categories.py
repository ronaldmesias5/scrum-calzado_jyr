"""
Rutas administrativas para gestión de categorías de productos
Admin y Jefe pueden crear, editar, eliminar categorías
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db, _require_admin_or_jefe
from app.models.category import Category
from app.models.user import User
from app.repositories.category_repository import CategoryRepository
from app.schemas.catalog_admin import CategoryCreateRequest

router = APIRouter(
    prefix="/api/v1/admin/catalog",
    tags=["admin-catalog"],
)


@router.get("/categories", summary="Listar todas las categorías (admin)")
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_db),
):
    """Obtiene todas las categorías con conteo de productos"""
    _require_admin_or_jefe(current_user)

    cat_repo = CategoryRepository(db)
    categories = cat_repo.list_all()

    result = []
    for cat in categories:
        product_count = cat_repo.count_active_products(cat.id)
        result.append({
            "id": str(cat.id),
            "name": cat.name_category,
            "description": cat.description_category,
            "product_count": product_count,
            "created_at": cat.created_at.isoformat() if cat.created_at else None,
        })

    return {"categories": result}


@router.post("/categories", summary="Crear nueva categoría", response_model=dict)
def create_category(
    req: CategoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea una nueva categoría de productos"""
    _require_admin_or_jefe(current_user)

    cat_repo = CategoryRepository(db)
    existing = cat_repo.find_by_name(req.name)

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una categoría con el nombre '{req.name}'"
        )

    category = Category(
        id=uuid.uuid4(),
        name_category=req.name.strip().lower(),
        description_category=req.description,
    )
    cat_repo.add(category)
    db.commit()
    db.refresh(category)

    return {
        "id": str(category.id),
        "name": category.name_category,
        "description": category.description_category,
        "message": "Categoría creada exitosamente"
    }


@router.put("/categories/{category_id}", summary="Actualizar categoría", response_model=dict)
def update_category(
    category_id: str,
    req: CategoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza una categoría existente"""
    _require_admin_or_jefe(current_user)

    try:
        cat_uuid = uuid.UUID(category_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El formato del ID de categoría es incorrecto"
        )

    cat_repo = CategoryRepository(db)
    category = cat_repo.get_by_id(cat_uuid)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada"
        )

    existing = cat_repo.find_by_name(req.name, exclude_id=cat_uuid)

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe otra categoría con el nombre '{req.name}'"
        )

    category.name_category = req.name.strip().lower()
    category.description_category = req.description
    category.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(category)

    return {
        "id": str(category.id),
        "name": category.name_category,
        "description": category.description_category,
        "message": "Categoría actualizada exitosamente"
    }


@router.delete("/categories/{category_id}", summary="Eliminar categoría")
def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Elimina lógicamente una categoría (soft delete)"""
    _require_admin_or_jefe(current_user)

    try:
        cat_uuid = uuid.UUID(category_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El formato del ID de categoría es incorrecto"
        )

    cat_repo = CategoryRepository(db)
    category = cat_repo.get_by_id(cat_uuid)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada"
        )

    active_products = cat_repo.count_active_products(cat_uuid)

    if active_products > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar la categoría porque tiene {active_products} producto(s) asociado(s)"
        )

    category.deleted_at = datetime.now(timezone.utc)
    db.commit()

    return {"message": "Categoría eliminada exitosamente"}
