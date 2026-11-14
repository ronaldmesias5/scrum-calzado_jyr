# ════════════════════════════════════════
# 📄 Migración: Agregar columna 'reserved' a tabla 'inventory'
# ════════════════════════════════════════

from alembic import op
import sqlalchemy as sa

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
