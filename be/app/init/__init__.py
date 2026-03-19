"""Init package: Inicialización de base de datos y datos seed."""

from app.init.init_db_simple import init_db
from app.init.seed_data import seed_all

__all__ = ["init_db", "seed_all"]