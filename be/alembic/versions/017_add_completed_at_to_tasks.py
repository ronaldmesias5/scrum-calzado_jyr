"""add completed_at to tasks table

Revision ID: 017_add_completed_at_to_tasks
Revises: 016_add_pagado_task_status
Create Date: 2026-04-26 21:35:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '017_add_completed_at_to_tasks'
down_revision = '016_add_pagado_task_status'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True))
    # Inicializar con created_at para las tareas ya completadas/pagadas
    op.execute("UPDATE tasks SET completed_at = created_at WHERE status IN ('completado', 'pagado')")


def downgrade() -> None:
    op.drop_column('tasks', 'completed_at')
