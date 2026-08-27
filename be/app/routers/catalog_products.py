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
from sqlalchemy import select, func

from app.config import settings
from app.dependencies import get_current_user, get_db, _require_admin_or_jefe
from app.models.brand import Brand
from app.models.style import Style
from app.models.category import Category
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.user import User
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
    
    query = select(Product).where(Product.deleted_at == None)
    count_query = select(func.count(Product.id)).where(Product.deleted_at == None)
    
    if brand_id:
        try:
            brand_uuid = uuid.UUID(brand_id)
            query = query.where(Product.brand_id == brand_uuid)
            count_query = count_query.where(Product.brand_id == brand_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="El formato del ID de marca es incorrecto")
    
    if style_id:
        try:
            style_uuid = uuid.UUID(style_id)
            query = query.where(Product.style_id == style_uuid)
            count_query = count_query.where(Product.style_id == style_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="El formato del ID de estilo es incorrecto")
    
    if category_id:
        try:
            category_uuid = uuid.UUID(category_id)
            query = query.where(Product.category_id == category_uuid)
            count_query = count_query.where(Product.category_id == category_uuid)
        except ValueError:
            raise HTTPException(status_code=400, detail="El formato del ID de categoria es incorrecto")
    
    if state is not None:
        query = query.where(Product.state == state)
        count_query = count_query.where(Product.state == state)
    
    total = db.execute(count_query).scalar() or 0
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    offset = (page - 1) * page_size
    
    products = db.execute(query.order_by(Product.name_product).offset(offset).limit(page_size)).scalars().all()
    
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

    # Validar tamaño (máximo 5 MB)
    content = await image.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="La imagen no puede superar 5 MB")

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
        task_prices=req.task_prices.model_dump() if req.task_prices else {},
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
    _require_admin_or_jefe(current_user)

    try:
        product_uuid = UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="El formato del ID es incorrecto")

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
    _require_admin_or_jefe(current_user)

    try:
        product_uuid = UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="El formato del ID es incorrecto")
    
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
