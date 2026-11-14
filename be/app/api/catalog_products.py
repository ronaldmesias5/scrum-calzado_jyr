"""
Rutas administrativas para gestión de productos
Admin y Jefe pueden crear, editar, eliminar productos y subir imágenes
"""

import uuid
import time
from pathlib import Path
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session

from app.config import settings
from app.dependencies import get_current_user, get_db, _require_admin_or_jefe
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.user import User
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.product_repository import ProductRepository
from app.schemas.catalog_admin import ProductCreateRequest

UPLOADS_DIR = Path(settings.UPLOAD_DIR) if settings.UPLOAD_DIR else Path(__file__).resolve().parent.parent.parent / "uploads"

router = APIRouter(
    prefix="/api/v1/admin/catalog",
    tags=["admin-catalog"],
)


@router.get("/products", summary="Listar productos (con filtros opcionales)")
def list_products(
    brand_id: str = None,
    style_id: str = None,
    category_id: str = None,
    state: bool = None,
    page: int = Query(1, ge=1, description="Página (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Elementos por página"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Obtiene productos con filtros opcionales"""
    _require_admin_or_jefe(current_user)

    brand_uuid = style_uuid = category_uuid = None
    if brand_id:
        try:
            brand_uuid = uuid.UUID(brand_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="El formato del ID de marca es incorrecto")
    if style_id:
        try:
            style_uuid = uuid.UUID(style_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="El formato del ID de estilo es incorrecto")
    if category_id:
        try:
            category_uuid = uuid.UUID(category_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="El formato del ID de categoria es incorrecto")

    offset = (page - 1) * page_size
    total, products = ProductRepository(db).list_admin_paginated(
        brand_id=brand_uuid,
        style_id=style_uuid,
        category_id=category_uuid,
        state=state,
        offset=offset,
        limit=page_size,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    # Stock por producto en UNA sola consulta agrupada (evita N+1)
    product_ids = [prod.id for prod in products]
    stock_by_product = InventoryRepository(db).stock_totals_by_products(product_ids)

    # Calcular stock total para cada producto
    products_response = []
    for prod in products:
        stock_total, manufactured_pairs = stock_by_product.get(prod.id, (0, 0))

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
            "stock_total": stock_total,
            "manufactured_pairs": manufactured_pairs,
            "task_prices": prod.task_prices or {},
            "created_at": prod.created_at.isoformat() if prod.created_at else None,
        })
    
    return {
        "products": products_response,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.post("/products/{product_id}/image", summary="Subir imagen del producto", response_model=dict)
def upload_product_image(
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

    product = ProductRepository(db).get_by_id(product_uuid)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Validar tipo de archivo por MIME real (independiente del nombre del archivo)
    # y derivar la extensión segura. Bloquea SVG/HTML/ejecutables disfrazados.
    ALLOWED_MIME = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/avif": ".avif",
        "image/bmp": ".bmp",
        "image/heic": ".heic",
        "image/heif": ".heif",
        "image/tiff": ".tiff",
    }
    ext = ALLOWED_MIME.get((image.content_type or "").lower())
    if not ext:
        raise HTTPException(
            status_code=400,
            detail="Formato de imagen no permitido. Usa JPG, PNG, WEBP, GIF, AVIF, BMP, HEIC o TIFF",
        )

    # Validar tamaño por chunks ANTES de acumular en memoria
    # (evita DoS por payload gigante: read() completo agotaría RAM)
    max_bytes = 5 * 1024 * 1024
    chunks: list[bytes] = []
    total = 0
    while chunk := image.file.read(1024 * 1024):
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB")
        chunks.append(chunk)
    content = b"".join(chunks)

    # Crear directorio si no existe
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    # Eliminar imagen anterior si existe y es un archivo local
    if product.image_url and product.image_url.startswith("/uploads/"):
        old_filename = product.image_url.split("/uploads/")[-1].split("?")[0]
        old_path = UPLOADS_DIR / old_filename
        if old_path.exists():
            old_path.unlink()

    # Guardar nuevo archivo con nombre único basado en el product_id
    filename = f"product_{product_id}{ext}"
    file_path = UPLOADS_DIR / filename
    file_path.write_bytes(content)

    # Actualizar image_url en BD con versión para forzar refresco de caché del navegador
    product.image_url = f"/uploads/{filename}?v={int(time.time())}"
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
    product_repo = ProductRepository(db)
    brand = product_repo.get_brand(brand_uuid)
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    
    style = product_repo.get_style(style_uuid)
    if not style:
        raise HTTPException(status_code=404, detail="Estilo no encontrado")
    
    # Verificar que el estilo pertenezca a la marca
    if style.brand_id != brand_uuid:
        raise HTTPException(
            status_code=400,
            detail="El estilo no pertenece a la marca seleccionada"
        )
    
    category = product_repo.get_category(category_uuid)
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Verificar que no exista un producto con el mismo nombre dentro del mismo estilo, marca, categoría y color
    if req.name:
        existing = product_repo.find_duplicate(
            style_id=style_uuid,
            brand_id=brand_uuid,
            category_id=category_uuid,
            name=req.name,
            color=req.color,
        )
        
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
        task_prices=req.task_prices.model_dump() if req.task_prices else {},
    )
    product_repo.add(product)
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
        "task_prices": product.task_prices or {},
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
    
    product_repo = ProductRepository(db)
    product = product_repo.get_by_id(product_uuid)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Verificar que existan las nuevas referencias
    brand = product_repo.get_brand(brand_uuid)
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    
    style = product_repo.get_style(style_uuid)
    if not style:
        raise HTTPException(status_code=404, detail="Estilo no encontrado")
    
    if style.brand_id != brand_uuid:
        raise HTTPException(
            status_code=400,
            detail="El estilo no pertenece a la marca seleccionada"
        )
    
    category = product_repo.get_category(category_uuid)
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
        
    # Verificar que no exista otro producto con el mismo nombre, estilo, marca, categoría y color
    if req.name:
        existing = product_repo.find_duplicate(
            style_id=style_uuid,
            brand_id=brand_uuid,
            category_id=category_uuid,
            name=req.name,
            color=req.color,
            exclude_id=product_uuid,
        )
        
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
    if req.task_prices is not None:
        product.task_prices = req.task_prices.model_dump()
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
        "task_prices": product.task_prices or {},
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
    
    product = ProductRepository(db).get_by_id(product_uuid)
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
    
    product = ProductRepository(db).get_by_id(product_uuid)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    product.deleted_at = datetime.now(timezone.utc)
    db.commit()
    
    return {"message": "Producto eliminado exitosamente"}


@router.patch("/products/{product_id}/manufactured-pairs", summary="Actualizar pares fabricados", response_model=dict)
def update_manufactured_pairs(
    product_id: str,
    request: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualiza el número de pares fabricados (reserved) para un producto."""
    _require_admin_or_jefe(current_user)

    try:
        product_uuid = UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="El formato del ID es incorrecto")

    quantity = request.get('quantity', 0)
    
    inv_repo = InventoryRepository(db)
    # Buscar el producto
    product = ProductRepository(db).get_by_id_any(product_uuid)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Obtener o crear inventario por color (si el producto tiene color)
    inventory = inv_repo.find_for_product_colour(product_uuid, product.color)
    
    if inventory:
        # Actualizar reserved
        inventory.reserved = quantity
        inventory.amount = quantity
        inventory.updated_at = datetime.now(timezone.utc)
    else:
        # Crear nuevo registro de inventario con reserved (size/amount son NOT NULL)
        inventory = Inventory(
            id=uuid.uuid4(),
            product_id=product_uuid,
            size="TODOS",
            colour=product.color,
            amount=quantity,
            reserved=quantity,
        )
        inv_repo.add(inventory)
    
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
    """Obtiene el desglose de pares fabricados (reserved) por talla para un producto."""
    _require_admin_or_jefe(current_user)

    try:
        product_uuid = UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="El formato del ID es incorrecto")
    
    # Buscar el producto
    product = ProductRepository(db).get_by_id_any(product_uuid)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Obtener todos los registros de inventario para este producto
    inventory_items = InventoryRepository(db).list_by_product(product_uuid)
    
    # Agrupar y sumar reserved por talla
    size_map: dict = {}
    for item in inventory_items:
        if item.reserved and item.reserved > 0:
            try:
                size_key = int(item.size) if item.size else 0
            except ValueError:
                size_key = item.size or "0"
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
