"""
Archivo: be/alembic/env.py
Descripción: Entorno de configuración de Alembic para auto-migraciones.

¿Qué?
  Configura Alembic con:
  - Importa Base (ORM metadata) y TODOS los modelos (User, Role, etc.)
  - Sobreescribe sqlalchemy.url con settings.DATABASE_URL (Pydantic)
  - Define run_migrations_offline() y run_migrations_online()
  - target_metadata = Base.metadata (detecta tablas automáticamente)
  
¿Para qué?
  - Conectar Alembic con BD usando misma config que backend (config.py)
  - Detectar cambios en modelos ORM automáticamente
  - Generar migraciones: alembic revision --autogenerate
  - Aplicar migraciones: alembic upgrade head (o desde init_db.py)
  
¿Impacto?
  CRÍTICO — Sin env.py, Alembic NO puede generar ni aplicar migraciones.
  Modificar target_metadata rompe: autogenerate (no detecta tablas).
  Olvidar importar modelo nuevo: Alembic NO genera migration para esa tabla.
  Dependencias: config.py (DATABASE_URL), database.py (Base),
               models/*.py (todos deben importarse aquí)
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.core.config import settings
from app.core.database import Base

# ────────────────────────────────────────────────────────────────────────────────
# 📦 Importar TODOS los modelos para que Alembic los detecte automáticamente
# ────────────────────────────────────────────────────────────────────────────────

# Core
from app.models.role import Role  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.password_reset_token import PasswordResetToken  # noqa: F401
from app.models.type_document import TypeDocument  # noqa: F401

# Catálogo
from app.models.category import Category  # noqa: F401
from app.models.brand import Brand  # noqa: F401
from app.models.style import Style  # noqa: F401
from app.models.product import Product  # noqa: F401

# Órdenes
from app.models.order import Order, OrderDetail  # noqa: F401

# Inventario
from app.models.inventory import Inventory  # noqa: F401
from app.models.inventory_movement import InventoryMovement  # noqa: F401

# Suministros
from app.models.supplies import Supplies  # noqa: F401
from app.models.supplies_movement import SuppliesMovement  # noqa: F401

# Vales
from app.models.vale import Vale, DetailVale  # noqa: F401

# Tareas e Incidencias
from app.models.incidence import Incidence  # noqa: F401

# Notificaciones
from app.models.notifications import Notification  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Sobreescribir la URL de la BD con la configuración de Pydantic Settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Ejecutar migraciones en modo 'offline'."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Ejecutar migraciones en modo 'online'."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
