"""
Migración: Agregar columna 'reserved' a tabla 'inventory'

Objetivo:
  - Agregar campo `reserved` para rastrear pares apartados/reservados para producción
  - Permite distinguir entre stock disponible (amount - reserved) y stock total (amount)
  - Necesario para manejar correctamente el flujo: reserva -> producción -> entrada -> salida

Cambios:
  - Agregar columna `reserved` (Numeric 10,2) con default 0 en tabla inventory
  - Esto permite que la validación de stock sea: (amount - reserved) >= cantidad_pedida
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Identificadores de migración
revision = '014_add_reserved'
down_revision = '013_tasks_columns'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Agregar columna reserved a inventory"""
    op.add_column('inventory', sa.Column(
        'reserved',
        sa.Numeric(precision=10, scale=2),
        server_default='0',
        nullable=False
    ))


def downgrade() -> None:
    """Remover columna reserved de inventory"""
    op.drop_column('inventory', 'reserved')
