"""
Schemas para catálogo público
"""

from pydantic import BaseModel

class CategoryResponse(BaseModel):
    """Categoría de productos"""
    id: str
    name: str
    description: str | None = None
    
    class Config:
        from_attributes = True

class CategoriesListResponse(BaseModel):
    """Lista de categorías"""
    categories: list[CategoryResponse]

class StyleResponse(BaseModel):
    id: str
    name: str
    brand_id: str
    brand_name: str
    
    class Config:
        from_attributes = True

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
    
    class Config:
        from_attributes = True

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
    
    class Config:
        from_attributes = True

class ProductsListResponse(BaseModel):
    products: list[ProductResponse]

