"""add pagado status to task_status enum

Revision ID: 016_add_pagado_task_status
Revises: 015_add_entregado
Create Date: 2026-04-27 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '016_add_pagado_task_status'
down_revision = '015_add_entregado'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Agregar el nuevo valor 'pagado' al ENUM task_status
    op.execute("ALTER TYPE task_status ADD VALUE 'pagado' AFTER 'completado'")


def downgrade() -> None:
    # PostgreSQL no permite remover valores de ENUM directamente.
    pass
