"""
Rutas públicas para el catálogo de productos
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.repositories.brand_repository import BrandRepository
from app.repositories.category_repository import CategoryRepository
from app.repositories.inventory_repository import InventoryRepository
from app.repositories.product_repository import ProductRepository
from app.repositories.style_repository import StyleRepository
from app.schemas.catalog import (
    CategoriesListResponse, StylesListResponse, StyleInventoryResponse, SizeInventoryResponse,
    BrandsListResponse, ProductsListResponse, ProductDetailResponse
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
def get_categories(
    only_with_products: bool = Query(
        False, description="Solo categorías con al menos un producto activo"
    ),
    db: Session = Depends(get_db),
) -> CategoriesListResponse:
    """
    Retorna todas las categorías de productos disponibles en el catálogo.

    Endpoint público sin autenticación requerida.
    """
    categories = CategoryRepository(db).list_public(only_with_products)

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
def get_styles(
    only_with_products: bool = Query(
        False, description="Solo estilos con al menos un producto activo"
    ),
    brand_id: str | None = Query(None, description="Filtrar por marca"),
    category_id: str | None = Query(None, description="Filtrar por categoría"),
    db: Session = Depends(get_db),
) -> StylesListResponse:
    """
    Retorna todos los estilos disponibles con sus marcas asociadas.
    Usado para seleccionar estilos en formulario de pedidos.
    """
    styles = StyleRepository(db).list_public(only_with_products, brand_id, category_id)

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
    products = ProductRepository(db).list_by_style_live(style_uuid)

    sizes = {}
    product_ids = [product.id for product in products]
    if product_ids:
        # Una sola consulta para todo el estilo (evita N+1 por producto)
        inventory = InventoryRepository(db).list_live_by_products(product_ids)

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
def get_brands(
    only_with_products: bool = Query(
        False, description="Solo marcas con al menos un producto activo"
    ),
    category_id: str | None = Query(None, description="Filtrar por categoría"),
    db: Session = Depends(get_db),
) -> BrandsListResponse:
    """
    Retorna todas las marcas disponibles en el catálogo.
    Endpoint público sin autenticación requerida.
    """
    brands = BrandRepository(db).list_public(only_with_products, category_id)

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
    colors = ProductRepository(db).list_distinct_colors()
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

    product = ProductRepository(db).get_public_detail(product_uuid)

    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Obtener inventario para el producto
    inventory_items = InventoryRepository(db).list_live_for_product(product.id)

    sizes_inventory = [
        SizeInventoryResponse(size=item.size, available=item.amount)
        for item in inventory_items
    ]

    available = int(sum((item.amount or 0) for item in inventory_items))

    return ProductDetailResponse(
        id=str(product.id),
        name=product.name_product,
        description=product.description_product,
        style_id=str(product.style_id),
        style_name=product.style.name_style if product.style else "Unknown",
        category_id=str(product.category_id),
        category_name=product.category.name_category if product.category else "Unknown",
        brand_id=str(product.brand_id),
        brand_name=product.brand.name_brand if product.brand else "Unknown",
        image_url=product.image_url,
        color=product.color,
        available=available,
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
    page: int = Query(1, ge=1, description="Página (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Elementos por página"),
    db: Session = Depends(get_db)
) -> ProductsListResponse:
    """
    Retorna los productos disponibles en el catálogo con paginación.
    Incluye información de estilo, categoría y marca.
    Endpoint público sin autenticación requerida.
    """
    total, products = ProductRepository(db).list_active_paginated(
        category_id=category_id,
        brand_id=brand_id,
        style_id=style_id,
        color=color,
        search=search,
        offset=(page - 1) * page_size,
        limit=page_size,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    # Stock total por producto (evita N+1: una sola consulta agrupada)
    product_ids = [p.id for p in products]
    available_by_product = InventoryRepository(db).stock_available_by_products(product_ids)

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
                "available": available_by_product.get(str(product.id), 0),
            }
            for product in products
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )

