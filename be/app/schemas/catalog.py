"""
Schemas para catálogo público
"""

from pydantic import BaseModel, ConfigDict

class CategoryResponse(BaseModel):
    """Categoría de productos"""
    id: str
    name: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)

class CategoriesListResponse(BaseModel):
    """Lista de categorías"""
    categories: list[CategoryResponse]

class StyleResponse(BaseModel):
    id: str
    name: str
    brand_id: str
    brand_name: str

    model_config = ConfigDict(from_attributes=True)

class StylesListResponse(BaseModel):
    styles: list[StyleResponse]

class SizeInventoryResponse(BaseModel):
    size: str
    available: int | float

class StyleInventoryResponse(BaseModel):
    style_id: str
    sizes: list[SizeInventoryResponse]

class BrandResponse(BaseModel):
    id: str
    name: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)

class BrandsListResponse(BaseModel):
    brands: list[BrandResponse]

class ProductResponse(BaseModel):
    id: str
    name: str
    style_id: str
    style_name: str
    category_id: str
    category_name: str
    brand_id: str
    brand_name: str
    image_url: str | None = None
    color: str | None = None
    available: int = 0

    model_config = ConfigDict(from_attributes=True)

class ProductDetailResponse(ProductResponse):
    """Detalle completo de producto con inventario"""
    description: str | None = None
    sizes_inventory: list[SizeInventoryResponse] = []
    
class ProductsListResponse(BaseModel):
    products: list[ProductResponse]
    total: int = 0
    page: int = 1
    page_size: int = 10
    total_pages: int = 1

