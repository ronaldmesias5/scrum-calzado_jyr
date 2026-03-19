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
