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
    ProductsListResponse, ProductResponse
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
    "/products",
    response_model=ProductsListResponse,
    summary="Obtener todos los productos",
)
def get_products(db: Session = Depends(get_db)) -> ProductsListResponse:
    """
    Retorna todos los productos disponibles en el catálogo.
    Incluye información de estilo, categoría y marca.
    Endpoint público sin autenticación requerida.
    """
    products = db.execute(
        select(Product).where(Product.deleted_at == None)
    ).scalars().all()
    
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
            }
            for product in products
        ]
    )

