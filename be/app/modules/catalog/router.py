"""
Rutas públicas para el catálogo de productos
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.core.dependencies import get_db
from app.models.category import Category
from app.models.style import Style
from app.models.brand import Brand
from app.models.product import Product
from app.models.inventory import Inventory
from app.modules.catalog.schemas import CategoriesListResponse, CategoryResponse

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
                "name": cat.name,
                "description": cat.description,
            }
            for cat in categories
        ]
    )


@router.get(
    "/styles",
    summary="Obtener todos los estilos disponibles",
)
def get_styles(db: Session = Depends(get_db)):
    """
    Retorna todos los estilos disponibles con sus marcas asociadas.
    Usado para seleccionar estilos en formulario de pedidos.
    """
    try:
        styles = db.execute(
            select(Style).where(Style.deleted_at == None)
        ).scalars().all()
        
        return {
            "styles": [
                {
                    "id": str(style.id),
                    "name": style.name,
                    "brand_id": str(style.brand_id),
                    "brand_name": style.brand.name if style.brand else "Unknown",
                }
                for style in styles
            ]
        }
    except Exception as e:
        return {"styles": [], "error": str(e)}


@router.get(
    "/styles/{style_id}/inventory",
    summary="Obtener tallas y disponibilidad de un estilo",
)
def get_style_inventory(style_id: str, db: Session = Depends(get_db)):
    """
    Retorna todas las tallas disponibles para un estilo específico.
    Muestra cantidad disponible por talla.
    """
    try:
        import uuid
        style_uuid = uuid.UUID(style_id)
        
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
                    sizes[inv.size] = inv.quantity
                else:
                    sizes[inv.size] += inv.quantity
        
        return {
            "style_id": style_id,
            "sizes": [
                {"size": size, "available": qty}
                for size, qty in sorted(sizes.items())
            ]
        }
    except Exception as e:
        return {"style_id": style_id, "sizes": [], "error": str(e)}


@router.get(
    "/brands",
    summary="Obtener todas las marcas",
)
def get_brands(db: Session = Depends(get_db)):
    """
    Retorna todas las marcas disponibles en el catálogo.
    Endpoint público sin autenticación requerida.
    """
    try:
        brands = db.execute(
            select(Brand).where(Brand.deleted_at == None)
        ).scalars().all()
        
        return {
            "brands": [
                {
                    "id": str(brand.id),
                    "name": brand.name,
                    "description": brand.description,
                }
                for brand in brands
            ]
        }
    except Exception as e:
        return {"brands": [], "error": str(e)}


@router.get(
    "/products",
    summary="Obtener todos los productos",
)
def get_products(db: Session = Depends(get_db)):
    """
    Retorna todos los productos disponibles en el catálogo.
    Incluye información de estilo, categoría y marca.
    Endpoint público sin autenticación requerida.
    """
    try:
        products = db.execute(
            select(Product).where(Product.deleted_at == None)
        ).scalars().all()
        
        return {
            "products": [
                {
                    "id": str(product.id),
                    "name": product.name,
                    "style_id": str(product.style_id),
                    "style_name": product.style.name if product.style else "Unknown",
                    "category_id": str(product.category_id),
                    "category_name": product.category.name if product.category else "Unknown",
                    "brand_id": str(product.brand_id),
                    "brand_name": product.brand.name if product.brand else "Unknown",
                }
                for product in products
            ]
        }
    except Exception as e:
        return {"products": [], "error": str(e)}

