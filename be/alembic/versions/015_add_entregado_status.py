"""add entregado status to order_status enum

Revision ID: 015_add_entregado
Revises: 014_add_reserved_to_inventory
Create Date: 2026-04-18 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '015_add_entregado'
down_revision = '014_add_reserved'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Agregar el nuevo valor al ENUM order_status
    op.execute("ALTER TYPE order_status ADD VALUE 'entregado' BEFORE 'cancelado'")


def downgrade() -> None:
    # PostgreSQL no permite remover valores de ENUM directamente
    # Por lo que dejamos un comentario de referencia
    pass
    # Para remover, se tendría que:
    # 1. Crear un nuevo tipo ENUM sin 'entregado'
    # 2. Convertir la columna al nuevo tipo
    # 3. Remover el tipo viejo
