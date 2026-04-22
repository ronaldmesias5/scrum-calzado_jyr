"""
Rutas administrativas para gestión de catálogo
Admin y Jefe pueden crear, editar, eliminar: Marcas, Estilos, Productos e Inventario
"""

import uuid
import os
from pathlib import Path
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from datetime import datetime, timezone

UPLOADS_DIR = Path("/app/uploads")

from app.core.dependencies import get_current_user, get_db, _require_admin_or_jefe
from app.models.brand import Brand
from app.models.style import Style
from app.models.category import Category
from app.models.product import Product
from app.models.product_supplies import ProductSupply
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement, InventoryMovementType
from app.models.user import User
from app.modules.admin.catalog_schemas import (
    BrandCreateRequest,
    BrandResponse,
    StyleCreateRequest,
    StyleResponse,
    ProductCreateRequest,
    ProductResponse,
    InventoryCreateRequest,
    InventoryResponse,
    BulkInventoryUpdateRequest,
)
from app.modules.auth.schemas import MessageResponse

router = APIRouter(
    prefix="/api/v1/admin/catalog",
    tags=["admin-catalog"],
)

# ─────────────────────────────────────────
# MARCAS (Brands)
# ─────────────────────────────────────────

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


# ─────────────────────────────────────────
# ESTILOS (Styles)
# ─────────────────────────────────────────

@router.get("/styles", summary="Listar estilos (con filtro opcional por brand)")
def list_styles(
    brand_id: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene estilos, opcionalmente filtrados por marca"""
    _require_admin_or_jefe(current_user)
    
    query = select(Style).where(Style.deleted_at == None)
    
    if brand_id:
        try:
            brand_uuid = uuid.UUID(brand_id)
            query = query.where(Style.brand_id == brand_uuid)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El formato del ID de marca es incorrecto"
            )
    
    styles = db.execute(query.order_by(Style.name_style)).scalars().all()
    
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
    
    # Verificar que la marca exista
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
    
    # Verificar que no exista un estilo con el mismo nombre en la misma marca
    existing = db.execute(
        select(Style).where(
            (Style.name_style.ilike(req.name)) &
            (Style.brand_id == brand_uuid) &
            (Style.deleted_at == None)
        )
    ).scalar()
    
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
    db.add(style)
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
    
    style = db.execute(
        select(Style).where(
            (Style.id == style_uuid) &
            (Style.deleted_at == None)
        )
    ).scalar()
    
    if not style:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estilo no encontrado"
        )
    
    # Verificar que la marca exista
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
    
    # Si cambió la marca o el nombre, verificar duplicados
    existing = db.execute(
        select(Style).where(
            (Style.name_style.ilike(req.name)) &
            (Style.brand_id == brand_uuid) &
            (Style.id != style_uuid) &
            (Style.deleted_at == None)
        )
    ).scalar()
    
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
    
    style = db.execute(
        select(Style).where(
            (Style.id == style_uuid) &
            (Style.deleted_at == None)
        )
    ).scalar()
    
    if not style:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estilo no encontrado"
        )
    
    # Verificar que no haya productos asociados activos
    active_products = db.execute(
        select(Product).where(
            (Product.style_id == style_uuid) &
            (Product.deleted_at == None)
        )
    ).scalars().all()
    
    if active_products:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede eliminar el estilo porque tiene {len(active_products)} producto(s) asociado(s)"
        )
    
    style.deleted_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": "Estilo eliminado exitosamente"}


# ─────────────────────────────────────────
# PRODUCTOS
# ─────────────────────────────────────────

@router.get("/products", summary="Listar productos (con filtros opcionales)")
def list_products(
    brand_id: str = None,
    style_id: str = None,
    category_id: str = None,
    state: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene productos con filtros opcionales"""
    _require_admin_or_jefe(current_user)
    
    query = select(Product).where(Product.deleted_at == None)
    
    if brand_id:
        try:
            query = query.where(Product.brand_id == uuid.UUID(brand_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="El formato del ID de marca es incorrecto")
    
    if style_id:
        try:
            query = query.where(Product.style_id == uuid.UUID(style_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="El formato del ID de estilo es incorrecto")
    
    if category_id:
        try:
            query = query.where(Product.category_id == uuid.UUID(category_id))
        except ValueError:
            raise HTTPException(status_code=400, detail="El formato del ID de categoria es incorrecto")
    
    if state is not None:
        query = query.where(Product.state == state)
    
    products = db.execute(query.order_by(Product.name_product)).scalars().all()
    
    # Calcular stock total para cada producto
    products_response = []
    for prod in products:
        stock_total = db.execute(
            select(func.sum(Inventory.amount).label("total"))
            .where((Inventory.product_id == prod.id) & (Inventory.deleted_at == None))
        ).scalar() or 0
        
        manufactured_pairs = db.execute(
            select(func.sum(Inventory.reserved).label("total"))
            .where((Inventory.product_id == prod.id) & (Inventory.deleted_at == None))
        ).scalar() or 0
        
        products_response.append({
            "id": str(prod.id),
            "name": prod.name_product,
            "description": prod.description_product,
            "color": prod.color,
            "image_url": prod.image_url,
            "insufficient_threshold": prod.insufficient_threshold,
            "state": prod.state,
            "is_active": prod.state,
            "brand_id": str(prod.brand_id),
            "brand_name": prod.brand.name_brand if prod.brand else "Unknown",
            "style_id": str(prod.style_id),
            "style_name": prod.style.name_style if prod.style else "Unknown",
            "category_id": str(prod.category_id),
            "category_name": prod.category.name_category if prod.category else "Unknown",
            "stock_total": int(stock_total),
            "manufactured_pairs": int(manufactured_pairs),
            "created_at": prod.created_at.isoformat() if prod.created_at else None,
        })
    
    return {"products": products_response}


@router.post("/products/{product_id}/image", summary="Subir imagen del producto", response_model=dict)
async def upload_product_image(
    product_id: str,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Sube y guarda la imagen de un producto. Devuelve la URL de la imagen guardada."""
    _require_admin_or_jefe(current_user)

    try:
        product_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="El formato del ID es incorrecto")

    product = db.execute(
        select(Product).where((Product.id == product_uuid) & (Product.deleted_at == None))
    ).scalar()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Validar tipo de archivo
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    # Validar tamaño (máximo 5 MB)
    content = await image.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB")

    # Crear directorio si no existe
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    # Eliminar imagen anterior si existe y es un archivo local
    if product.image_url and product.image_url.startswith("/uploads/"):
        old_filename = product.image_url.split("/uploads/")[-1]
        old_path = UPLOADS_DIR / old_filename
        if old_path.exists():
            old_path.unlink()

    # Guardar nuevo archivo con nombre único basado en el product_id
    ext = Path(image.filename).suffix.lower() if image.filename else ".jpg"
    filename = f"product_{product_id}{ext}"
    file_path = UPLOADS_DIR / filename
    file_path.write_bytes(content)

    # Actualizar image_url en BD
    product.image_url = f"/uploads/{filename}"
    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)

    return {"image_url": product.image_url, "message": "Imagen subida exitosamente"}


@router.post("/products", summary="Crear nuevo producto", response_model=dict)
def create_product(
    req: ProductCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Crea un nuevo producto (cascada: brand → style → category)"""
    _require_admin_or_jefe(current_user)
    
    try:
        brand_uuid = uuid.UUID(req.brand_id)
        style_uuid = uuid.UUID(req.style_id)
        category_uuid = uuid.UUID(req.category_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="El formato del ID es incorrecto")
    
    # Verificar que existan brand, style y category
    brand = db.execute(
        select(Brand).where((Brand.id == brand_uuid) & (Brand.deleted_at == None))
    ).scalar()
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    
    style = db.execute(
        select(Style).where((Style.id == style_uuid) & (Style.deleted_at == None))
    ).scalar()
    if not style:
        raise HTTPException(status_code=404, detail="Estilo no encontrado")
    
    # Verificar que el estilo pertenezca a la marca
    if style.brand_id != brand_uuid:
        raise HTTPException(
            status_code=400,
            detail="El estilo no pertenece a la marca seleccionada"
        )
    
    category = db.execute(
        select(Category).where((Category.id == category_uuid) & (Category.deleted_at == None))
    ).scalar()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Verificar que no exista un producto con el mismo nombre dentro del mismo estilo, marca, categoría y color
    if req.name:
        stmt = select(Product).where(
            (Product.style_id == style_uuid) &
            (Product.brand_id == brand_uuid) &
            (Product.category_id == category_uuid) &
            (Product.name_product == req.name) &
            (Product.deleted_at == None)
        )
        
        # Considerar el color en la búsqueda si se proporciona
        if req.color:
            stmt = stmt.where(Product.color == req.color)
        else:
            stmt = stmt.where((Product.color == None) | (Product.color == ""))
            
        existing = db.execute(stmt).scalar()
        
        if existing:
            detail_msg = f"Ya existe un producto con el nombre '{req.name}' para este estilo, marca y categoría"
            if req.color:
                detail_msg += f" en color {req.color}"
            
            raise HTTPException(
                status_code=409,
                detail=detail_msg
            )
    
    product = Product(
        id=uuid.uuid4(),
        name_product=req.name if req.name else style.name_style,
        description_product=req.description,
        color=req.color,
        insufficient_threshold=req.insufficient_threshold or 12,
        brand_id=brand_uuid,
        style_id=style_uuid,
        category_id=category_uuid,
        state=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return {
        "id": str(product.id),
        "name": product.name_product,
        "description": product.description_product,
        "color": product.color,
        "image_url": product.image_url,
        "insufficient_threshold": product.insufficient_threshold,
        "state": product.state,
        "is_active": product.state,
        "brand_id": str(product.brand_id),
        "brand_name": brand.name_brand,
        "style_id": str(product.style_id),
        "style_name": style.name_style,
        "category_id": str(product.category_id),
        "category_name": category.name_category,
        "message": "Producto creado exitosamente"
    }


@router.put("/products/{product_id}", summary="Actualizar producto", response_model=dict)
def update_product(
    product_id: str,
    req: ProductCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Actualiza un producto"""
    _require_admin_or_jefe(current_user)
    
    try:
        product_uuid = uuid.UUID(product_id)
        brand_uuid = uuid.UUID(req.brand_id)
        style_uuid = uuid.UUID(req.style_id)
        category_uuid = uuid.UUID(req.category_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="El formato del ID es incorrecto")
    
    product = db.execute(
        select(Product).where((Product.id == product_uuid) & (Product.deleted_at == None))
    ).scalar()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Verificar que existan las nuevas referencias
    brand = db.execute(
        select(Brand).where((Brand.id == brand_uuid) & (Brand.deleted_at == None))
    ).scalar()
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    
    style = db.execute(
        select(Style).where((Style.id == style_uuid) & (Style.deleted_at == None))
    ).scalar()
    if not style:
        raise HTTPException(status_code=404, detail="Estilo no encontrado")
    
    if style.brand_id != brand_uuid:
        raise HTTPException(
            status_code=400,
            detail="El estilo no pertenece a la marca seleccionada"
        )
    
    category = db.execute(
        select(Category).where((Category.id == category_uuid) & (Category.deleted_at == None))
    ).scalar()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
    # Verificar que no exista otro producto con el mismo nombre, estilo, marca, categoría y color
    if req.name:
        stmt = select(Product).where(
            (Product.id != product_uuid) &
            (Product.style_id == style_uuid) &
            (Product.brand_id == brand_uuid) &
            (Product.category_id == category_uuid) &
            (Product.name_product == req.name) &
            (Product.deleted_at == None)
        )
        
        if req.color:
            stmt = stmt.where(Product.color == req.color)
        else:
            stmt = stmt.where((Product.color == None) | (Product.color == ""))
            
        existing = db.execute(stmt).scalar()
        
        if existing:
            detail_msg = f"Ya existe otro producto con el nombre '{req.name}' para estas especificaciones"
            raise HTTPException(
                status_code=409,
                detail=detail_msg
            )
    
    product.name_product = req.name if req.name else style.name_style
    product.description_product = req.description
    product.color = req.color
    product.insufficient_threshold = req.insufficient_threshold or 12
    product.brand_id = brand_uuid
    product.style_id = style_uuid
    product.category_id = category_uuid
    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    
    return {
        "id": str(product.id),
        "name": product.name_product,
        "description": product.description_product,
        "color": product.color,
        "image_url": product.image_url,
        "insufficient_threshold": product.insufficient_threshold,
        "state": product.state,
        "is_active": product.state,
        "brand_id": str(product.brand_id),
        "brand_name": brand.name_brand,
        "style_id": str(product.style_id),
        "style_name": style.name_style,
        "category_id": str(product.category_id),
        "category_name": category.name_category,
        "message": "Producto actualizado exitosamente"
    }


@router.put("/products/{product_id}/toggle-state", summary="Activar/Desactivar producto")
def toggle_product_state(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Activa o desactiva un producto (cambia state)"""
    _require_admin_or_jefe(current_user)
    
    try:
        product_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="El formato del ID es incorrecto")
    
    product = db.execute(
        select(Product).where((Product.id == product_uuid) & (Product.deleted_at == None))
    ).scalar()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    product.state = not product.state
    product.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    
    return {
        "id": str(product.id),
        "state": product.state,
        "message": f"Producto {'activado' if product.state else 'desactivado'}"
    }


@router.delete("/products/{product_id}", summary="Eliminar producto")
def delete_product(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Elimina lógicamente un producto (soft delete)"""
    _require_admin_or_jefe(current_user)
    
    try:
        product_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="El formato del ID es incorrecto")
    
    product = db.execute(
        select(Product).where((Product.id == product_uuid) & (Product.deleted_at == None))
    ).scalar()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    product.deleted_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": "Producto eliminado exitosamente"}


# ─────────────────────────────────────────
# INVENTARIO
# ─────────────────────────────────────────

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
    existing_inv = db.execute(
        select(Inventory).where(
            (Inventory.product_id == product_uuid) &
            (Inventory.size == req.size) &
            (Inventory.deleted_at == None)
        )
    ).scalar()
    
    if existing_inv:
        # Calcular diferencia para el movimiento
        diff = req.quantity - float(existing_inv.amount)
        
        # Actualizar
        existing_inv.amount = req.quantity
        existing_inv.updated_at = datetime.now(timezone.utc)
        
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
    
    # Iterar sobre cada talla y cantidad
    for size_str, quantity in req.quantities.items():
        # Mantener size como string (VARCHAR en BD)
        size = str(size_str).strip()
        if not size:
            continue
        
        # Buscar inventario existente
        existing_inv = db.execute(
            select(Inventory).where(
                (Inventory.product_id == product_uuid) &
                (Inventory.size == size) &
                (Inventory.deleted_at == None)
            )
        ).scalar()
        
        if existing_inv:
            # Calcular diferencia
            diff = quantity - float(existing_inv.amount)
            
            # Actualizar
            existing_inv.amount = quantity
            existing_inv.updated_at = datetime.now(timezone.utc)
            db.add(existing_inv)
            
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
            # Solo crear si quantity > 0 (no crear registros vacíos)
            if quantity > 0:
                inventory = Inventory(
                    id=uuid.uuid4(),
                    product_id=product_uuid,
                    size=size,
                    amount=quantity,
                )
                db.add(inventory)
                
                # Registrar entrada inicial masiva
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
    
    db.commit()
    
    return {
        "product_id": str(product_uuid),
        "product_name": product.name_product,
        "updated_count": updated_count,
        "created_count": created_count,
        "results": results,
        "message": f"Inventario actualizado: {created_count} creados, {updated_count} actualizados"
    }


@router.patch("/products/{product_id}/manufactured-pairs", summary="Actualizar pares fabricados", response_model=dict)
def update_manufactured_pairs(
    product_id: str,
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualiza el número de pares fabricados (reserved) para un producto.
    
    **Parámetros:**
    - product_id: ID del producto
    - quantity: Cantidad de pares fabricados a establecer
    """
    product_uuid = UUID(product_id)
    quantity = request.get('quantity', 0)
    
    # Buscar el producto
    product = db.query(Product).filter(Product.id == product_uuid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Obtener o crear inventario por color (si el producto tiene color)
    inventory = db.query(Inventory).filter(
        (Inventory.product_id == product_uuid) &
        (Inventory.colour == product.color) &
        (Inventory.deleted_at == None)
    ).first()
    
    if inventory:
        # Actualizar reserved
        old_reserved = inventory.reserved or 0
        inventory.reserved = quantity
        inventory.updated_at = datetime.now(timezone.utc)
    else:
        # Crear nuevo registro de inventario con reserved
        inventory = Inventory(
            id=uuid.uuid4(),
            product_id=product_uuid,
            colour=product.color,
            reserved=quantity,
        )
        db.add(inventory)
    
    db.commit()
    
    return {
        "product_id": str(product_uuid),
        "product_name": product.name_product,
        "manufactured_pairs": quantity,
        "message": f"Pares fabricados actualizados a {quantity}"
    }


@router.get("/products/{product_id}/inventory-by-size", summary="Obtener inventario de pares fabricados por talla", response_model=dict)
def get_inventory_by_size(
    product_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene el desglose de pares fabricados (reserved) por talla para un producto.
    Suma los reserved de múltiples pedidos si existen para la misma talla.
    
    **Retorna:**
    - inventory: Lista de objetos con {size, reserved} agrupado y sumado por talla
    """
    product_uuid = UUID(product_id)
    
    # Buscar el producto
    product = db.query(Product).filter(Product.id == product_uuid).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Obtener todos los registros de inventario para este producto
    inventory_items = db.query(Inventory).filter(
        (Inventory.product_id == product_uuid) &
        (Inventory.deleted_at == None)
    ).all()
    
    # Agrupar y sumar reserved por talla
    size_map: dict = {}
    for item in inventory_items:
        if item.reserved and item.reserved > 0:
            size_key = int(item.size) if item.size else 0
            size_map[size_key] = size_map.get(size_key, 0) + item.reserved
    
    # Convertir a lista ordenada por talla
    inventory_list = [
        {"size": size, "reserved": float(reserved)}
        for size, reserved in sorted(size_map.items())
    ]
    
    total_reserved = sum(reserved for _, reserved in size_map.items())
    
    return {
        "product_id": str(product_uuid),
        "product_name": product.name_product,
        "category": product.category.name_category if product.category else "Unknown",
        "inventory": inventory_list,
        "total_reserved": float(total_reserved)
    }

