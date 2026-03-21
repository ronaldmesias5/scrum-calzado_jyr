"""
Rutas públicas para el catálogo de productos
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.core.dependencies import get_db
from app.models.category import Category
from app.models.style import Style
from app.models.brand import Brand
from app.models.product import Product
from app.models.inventory import Inventory
from app.modules.catalog.schemas import (
    CategoriesListResponse, CategoryResponse,
    StylesListResponse, StyleResponse,
    StyleInventoryResponse, SizeInventoryResponse,
    BrandsListResponse, BrandResponse,
    ProductsListResponse, ProductResponse,
    ProductDetailResponse
)

router = APIRouter(
    prefix="/api/v1/catalog",
    tags=["catalog"],
)


@router.get(
    "/categories",
    response_model=CategoriesListResponse,
    summary="Obtener todas las categorías",
)
def get_categories(db: Session = Depends(get_db)) -> CategoriesListResponse:
    """
    Retorna todas las categorías de productos disponibles en el catálogo.
    
    Endpoint público sin autenticación requerida.
    """
    categories = db.execute(
        select(Category).where(Category.deleted_at == None)
    ).scalars().all()
    
    return CategoriesListResponse(
        categories=[
            {
                "id": str(cat.id),
                "name": cat.name_category,
                "description": cat.description_category,
            }
            for cat in categories
        ]
    )


@router.get(
    "/styles",
    response_model=StylesListResponse,
    summary="Obtener todos los estilos disponibles",
)
def get_styles(db: Session = Depends(get_db)) -> StylesListResponse:
    """
    Retorna todos los estilos disponibles con sus marcas asociadas.
    Usado para seleccionar estilos en formulario de pedidos.
    """
    styles = db.execute(
        select(Style).where(Style.deleted_at == None)
    ).scalars().all()
    
    return StylesListResponse(
        styles=[
            {
                "id": str(style.id),
                "name": style.name_style,
                "brand_id": str(style.brand_id),
                "brand_name": style.brand.name_brand if style.brand else "Unknown",
            }
            for style in styles
        ]
    )


@router.get(
    "/styles/{style_id}/inventory",
    response_model=StyleInventoryResponse,
    summary="Obtener tallas y disponibilidad de un estilo",
)
def get_style_inventory(style_id: str, db: Session = Depends(get_db)) -> StyleInventoryResponse:
    """
    Retorna todas las tallas disponibles para un estilo específico.
    Muestra cantidad disponible por talla.
    """
    import uuid
    try:
        style_uuid = uuid.UUID(style_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de estilo inválido")
        
    # Obtener productos del estilo
    products = db.execute(
        select(Product).where(
            (Product.style_id == style_uuid) &
            (Product.deleted_at == None)
        )
    ).scalars().all()
    
    sizes = {}
    for product in products:
        # Obtener inventario para cada producto
        inventory = db.execute(
            select(Inventory).where(
                (Inventory.product_id == product.id) &
                (Inventory.deleted_at == None)
            )
        ).scalars().all()
        
        for inv in inventory:
            if inv.size not in sizes:
                sizes[inv.size] = inv.amount
            else:
                sizes[inv.size] += inv.amount
    
    return StyleInventoryResponse(
        style_id=style_id,
        sizes=[
            {"size": size, "available": qty}
            for size, qty in sorted(sizes.items())
        ]
    )


@router.get(
    "/brands",
    response_model=BrandsListResponse,
    summary="Obtener todas las marcas",
)
def get_brands(db: Session = Depends(get_db)) -> BrandsListResponse:
    """
    Retorna todas las marcas disponibles en el catálogo.
    Endpoint público sin autenticación requerida.
    """
    brands = db.execute(
        select(Brand).where(Brand.deleted_at == None)
    ).scalars().all()
    
    return BrandsListResponse(
        brands=[
            {
                "id": str(brand.id),
                "name": brand.name_brand,
                "description": brand.description_brand,
            }
            for brand in brands
        ]
    )


@router.get(
    "/colors",
    response_model=dict,
    summary="Obtener todos los colores disponibles",
)
def get_colors(db: Session = Depends(get_db)) -> dict:
    """
    Retorna todos los colores distintos disponibles en productos activos en el catálogo.
    """
    stmt = select(Product.color).where(
        (Product.deleted_at == None) &
        (Product.state == True) &
        (Product.color != None) &
        (Product.color != "")
    ).distinct()
    
    colors = db.execute(stmt).scalars().all()
    # Limpiar y ordenar colores
    clean_colors = sorted(list(set(c.strip() for c in colors if c and c.strip())))
    return {"colors": clean_colors}


@router.get(
    "/products/{product_id}",
    response_model=ProductDetailResponse,
    summary="Obtener detalles de un producto por ID",
)
def get_product_detail(product_id: str, db: Session = Depends(get_db)) -> ProductDetailResponse:
    """
    Retorna los detalles de un producto específico por su ID.
    """
    import uuid
    try:
        product_uuid = uuid.UUID(product_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de producto inválido")

    product = db.execute(
        select(Product).where(
            (Product.id == product_uuid) &
            (Product.deleted_at == None) &
            (Product.state == True)
        )
    ).scalars().first()

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Obtener inventario para el producto
    inventory_items = db.execute(
        select(Inventory).where(
            (Inventory.product_id == product.id) &
            (Inventory.deleted_at == None)
        )
    ).scalars().all()

    sizes_inventory = [
        SizeInventoryResponse(size=item.size, available=item.amount)
        for item in inventory_items
    ]

    return ProductDetailResponse(
        id=str(product.id),
        name=product.name_product,
        description=product.description_product,
        price=product.price,
        style_id=str(product.style_id),
        style_name=product.style.name_style if product.style else "Unknown",
        category_id=str(product.category_id),
        category_name=product.category.name_category if product.category else "Unknown",
        brand_id=str(product.brand_id),
        brand_name=product.brand.name_brand if product.brand else "Unknown",
        image_url=product.image_url,
        color=product.color,
        sizes_inventory=sizes_inventory,
    )


@router.get(
    "/products",
    response_model=ProductsListResponse,
    summary="Obtener todos los productos",
)
def get_products(
    category_id: str | None = None,
    brand_id: str | None = None,
    style_id: str | None = None,
    color: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db)
) -> ProductsListResponse:
    """
    Retorna todos los productos disponibles en el catálogo.
    Incluye información de estilo, categoría y marca.
    Endpoint público sin autenticación requerida.
    """
    stmt = select(Product).where(Product.deleted_at == None).where(Product.state == True)
    
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    if brand_id:
        stmt = stmt.where(Product.brand_id == brand_id)
    if style_id:
        stmt = stmt.where(Product.style_id == style_id)
    if color:
        stmt = stmt.where(Product.color == color)
        
    if search:
        # Búsqueda por nombre de producto, marca o estilo
        stmt = stmt.join(Brand, Product.brand_id == Brand.id).join(Style, Product.style_id == Style.id)
        stmt = stmt.where(
            Product.name_product.ilike(f"%{search}%") |
            Brand.name_brand.ilike(f"%{search}%") |
            Style.name_style.ilike(f"%{search}%")
        )

    products = db.execute(stmt).scalars().all()
    
    return ProductsListResponse(
        products=[
            {
                "id": str(product.id),
                "name": product.name_product,
                "style_id": str(product.style_id),
                "style_name": product.style.name_style if product.style else "Unknown",
                "category_id": str(product.category_id),
                "category_name": product.category.name_category if product.category else "Unknown",
                "brand_id": str(product.brand_id),
                "brand_name": product.brand.name_brand if product.brand else "Unknown",
                "image_url": product.image_url,
                "color": product.color,
            }
            for product in products
        ]
    )

