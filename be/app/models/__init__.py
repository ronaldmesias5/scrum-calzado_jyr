"""
Archivo: be/app/models/__init__.py
Descripción: Importa todos los modelos ORM para registro con SQLAlchemy.
             El orden de importación ES IMPORTANTE para las relaciones.
"""

# Importar Base primero
from app.core.database import Base

# Modelos sin dependencias externas (orden alfabético)
from app.models.brand import Brand
from app.models.category import Category
from app.models.role import Role
from app.models.style import Style
from app.models.type_document import TypeDocument

# Modelos que dependen de los anteriores
from app.models.user import User
from app.models.product import Product
from app.models.password_reset_token import PasswordResetToken
from app.models.notifications import Notification

# Modelos de inventario y movimientos
from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement
from app.models.supply_categories import SupplyCategory
from app.models.supplies import Supplies
from app.models.supplies_movement import SuppliesMovement
from app.models.product_supplies import ProductSupply

# Modelos de órdenes
from app.models.order import Order

# Modelos de vales
from app.models.vale import Vale

# Tareas DEBE importarse antes de Incidence
from app.models.tasks import Task

# Incidencias (depende de Task)
from app.models.incidence import Incidence

__all__ = [
    "Base",
    "Brand",
    "Category",
    "Role",
    "Style",
    "TypeDocument",
    "User",
    "Product",
    "PasswordResetToken",
    "Notification",
    "Inventory",
    "InventoryMovement",
    "SupplyCategory",
    "Supplies",
    "SuppliesMovement",
    "ProductSupply",
    "Order",
    "Vale",
    "Task",
    "Incidence",
]